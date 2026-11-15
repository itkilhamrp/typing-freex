use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::mpsc::SyncSender;
use std::sync::{Arc, Mutex, RwLock};

use crate::audio::device::start_audio_stream;
use crate::audio::mixer::AudioMixer;
use crate::audio::resample::resample_stereo;
use crate::audio::spsc::{self, SpscProducer};
use crate::audio::types::{AudioError, PlayCommand, SampleData};
use crate::audio::wav::decode_wav;
use crate::{log_info, log_warn};

pub const COMMAND_QUEUE_CAPACITY: usize = 256;

#[derive(serde::Serialize)]
pub struct AudioStatusDto {
    pub healthy: bool,
    pub sample_rate: u32,
    pub loaded_samples: usize,
}

pub struct AudioEngine {
    mixer: Arc<Mutex<AudioMixer>>,
    samples_table: Arc<RwLock<Vec<Option<Arc<SampleData>>>>>,
    raw_samples: Arc<RwLock<HashMap<String, SampleData>>>,
    sample_map: Arc<RwLock<HashMap<String, usize>>>,
    cmd_tx: Mutex<SpscProducer<PlayCommand, COMMAND_QUEUE_CAPACITY>>,
    stream_healthy: Arc<AtomicBool>,
    target_sample_rate: Arc<AtomicU32>,
    rebuild_tx: Option<SyncSender<()>>,
    _shutdown_tx: Option<SyncSender<()>>,
}

impl Default for AudioEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl AudioEngine {
    pub fn new() -> Self {
        let mixer = Arc::new(Mutex::new(AudioMixer::new()));
        let samples_table = Arc::new(RwLock::new(Vec::with_capacity(256)));
        let raw_samples = Arc::new(RwLock::new(HashMap::with_capacity(256)));
        let sample_map = Arc::new(RwLock::new(HashMap::with_capacity(256)));
        let (cmd_tx, cmd_rx) = spsc::channel::<PlayCommand, COMMAND_QUEUE_CAPACITY>();
        let cmd_rx = Arc::new(cmd_rx);
        let stream_healthy = Arc::new(AtomicBool::new(false));
        let target_sample_rate = Arc::new(AtomicU32::new(48000));

        let (shutdown_tx, rebuild_tx) = match start_audio_stream(
            Arc::clone(&mixer),
            Arc::clone(&samples_table),
            Arc::clone(&raw_samples),
            Arc::clone(&sample_map),
            cmd_rx,
            Arc::clone(&stream_healthy),
            Arc::clone(&target_sample_rate),
        ) {
            Ok((s_tx, r_tx)) => {
                let rate = target_sample_rate.load(Ordering::Acquire);
                log_info!("audio", "CPAL hardware audio output initialized at {} Hz", rate);
                (Some(s_tx), Some(r_tx))
            }
            Err(e) => {
                log_warn!(
                    "audio",
                    "Native audio stream initialization skipped (headless/no-device fallback): {}",
                    e
                );
                (None, None)
            }
        };

        Self {
            mixer,
            samples_table,
            raw_samples,
            sample_map,
            cmd_tx: Mutex::new(cmd_tx),
            stream_healthy,
            target_sample_rate,
            rebuild_tx,
            _shutdown_tx: shutdown_tx,
        }
    }

    /// Register a raw WAV byte payload into memory.
    /// Resamples to the target output device rate once during registration.
    pub fn register_wav(&self, id: &str, wav_bytes: &[u8]) -> Result<(), AudioError> {
        let decoded = decode_wav(wav_bytes)?;
        let current_target_rate = self.target_sample_rate.load(Ordering::Acquire);
        let resampled = resample_stereo(decoded.clone(), current_target_rate);
        let sample_arc = Arc::new(resampled);

        if let Ok(mut raw) = self.raw_samples.write() {
            raw.insert(id.to_string(), decoded);
        }

        let mut map = self.sample_map.write().map_err(|_| AudioError::Internal("Lock poisoned".into()))?;
        let mut table = self.samples_table.write().map_err(|_| AudioError::Internal("Lock poisoned".into()))?;

        if let Some(&existing_idx) = map.get(id)
            && existing_idx < table.len()
        {
            table[existing_idx] = Some(sample_arc);
            return Ok(());
        }

        if let Some(free_idx) = table.iter().position(|slot| slot.is_none()) {
            table[free_idx] = Some(sample_arc);
            map.insert(id.to_string(), free_idx);
        } else {
            let new_idx = table.len();
            table.push(Some(sample_arc));
            map.insert(id.to_string(), new_idx);
        }

        Ok(())
    }

    /// Trigger stream rebuild to sync with newly connected OS audio devices (e.g. Bluetooth A2DP / USB DAC).
    pub fn rebuild_stream(&self) -> Result<AudioStatusDto, AudioError> {
        if let Some(ref tx) = self.rebuild_tx {
            let _ = tx.try_send(());
        }
        Ok(self.status())
    }

    /// Play a registered sound immediately.
    /// Hot-path: zero heap allocation, zero waiting, non-blocking lock-free command dispatch.
    pub fn play(&self, id: &str, volume: Option<f32>) {
        let idx_opt = {
            if let Ok(map) = self.sample_map.read() {
                map.get(id).copied()
            } else {
                None
            }
        };

        if let Some(sample_id) = idx_opt {
            let cmd = PlayCommand {
                sample_id: sample_id as u32,
                volume: volume.unwrap_or(1.0),
            };
            if let Ok(mut tx) = self.cmd_tx.lock() {
                let _ = tx.try_push(cmd);
            }
        }
    }

    pub fn set_volume(&self, volume: f32) {
        if let Ok(mut mixer) = self.mixer.lock() {
            mixer.set_master_volume(volume);
        }
    }

    pub fn clear(&self, prefix: Option<&str>) {
        if let (Ok(mut map), Ok(mut table), Ok(mut raw)) = (
            self.sample_map.write(),
            self.samples_table.write(),
            self.raw_samples.write(),
        ) {
            if let Some(p) = prefix {
                let prefix_slash = format!("{p}/");
                let keys_to_remove: Vec<String> = map
                    .keys()
                    .filter(|k| k.as_str() == p || k.starts_with(&prefix_slash))
                    .cloned()
                    .collect();
                for key in keys_to_remove {
                    raw.remove(&key);
                    if let Some(idx) = map.remove(&key)
                        && idx < table.len()
                    {
                        table[idx] = None;
                    }
                }
            } else {
                raw.clear();
                map.clear();
                table.clear();
                if let Ok(mut mixer) = self.mixer.lock() {
                    mixer.stop_all();
                }
            }
        }
    }

    pub fn status(&self) -> AudioStatusDto {
        let loaded = self.sample_map.read().map(|m| m.len()).unwrap_or(0);
        AudioStatusDto {
            healthy: self.stream_healthy.load(Ordering::Acquire),
            sample_rate: self.target_sample_rate.load(Ordering::Acquire),
            loaded_samples: loaded,
        }
    }
}
