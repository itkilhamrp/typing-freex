use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::mpsc::{channel, sync_channel, RecvTimeoutError, SyncSender};
use std::sync::{Arc, Mutex, RwLock};
use std::thread;
use std::time::Duration;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{SampleFormat, StreamConfig};

use crate::audio::engine::COMMAND_QUEUE_CAPACITY;
use crate::audio::mixer::AudioMixer;
use crate::audio::resample::resample_stereo;
use crate::audio::spsc::SpscConsumer;
use crate::audio::types::{AudioError, PlayCommand, SampleData};
use crate::{log_info, log_warn};

struct StreamBuildContext<'a> {
    device: &'a cpal::Device,
    mixer: &'a Arc<Mutex<AudioMixer>>,
    samples_table: &'a Arc<RwLock<Vec<Option<Arc<SampleData>>>>>,
    cmd_rx: &'a Arc<SpscConsumer<PlayCommand, COMMAND_QUEUE_CAPACITY>>,
    stream_healthy: &'a Arc<AtomicBool>,
    rebuild_tx: &'a SyncSender<()>,
}

fn build_stream_for_config(
    ctx: &StreamBuildContext<'_>,
    config: &StreamConfig,
    sample_format: SampleFormat,
    channels: usize,
) -> Result<cpal::Stream, AudioError> {
    let err_flag = Arc::clone(ctx.stream_healthy);
    let err_rebuild_tx = ctx.rebuild_tx.clone();
    let err_fn = move |err: cpal::Error| {
        if matches!(
            err.kind(),
            cpal::ErrorKind::DeviceNotAvailable
                | cpal::ErrorKind::StreamInvalidated
                | cpal::ErrorKind::BackendError
                | cpal::ErrorKind::HostUnavailable
        ) {
            err_flag.store(false, Ordering::SeqCst);
            let _ = err_rebuild_tx.try_send(());
        }
    };

    let stream_res = match sample_format {
        SampleFormat::F32 => {
            let mixer_clone = Arc::clone(ctx.mixer);
            let samples_clone = Arc::clone(ctx.samples_table);
            let cmd_rx_clone = Arc::clone(ctx.cmd_rx);
            ctx.device.build_output_stream(
                *config,
                move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                    if let Ok(mut m) = mixer_clone.try_lock() {
                        while let Some(cmd) = cmd_rx_clone.try_pop() {
                            m.trigger_voice(cmd.sample_id as usize, cmd.volume);
                        }
                        if let Ok(table) = samples_clone.try_read() {
                            if channels == 2 {
                                m.render_stereo_f32(data, &table);
                                return;
                            } else if channels == 1 {
                                for sample_out in data.iter_mut() {
                                    let mut temp = [0.0f32; 2];
                                    m.render_stereo_f32(&mut temp, &table);
                                    *sample_out = (temp[0] + temp[1]) * 0.5;
                                }
                                return;
                            } else if channels > 2 {
                                let num_frames = data.len() / channels;
                                for f in 0..num_frames {
                                    let mut temp = [0.0f32; 2];
                                    m.render_stereo_f32(&mut temp, &table);
                                    let base = f * channels;
                                    data[base] = temp[0];
                                    data[base + 1] = temp[1];
                                    data[base + 2..base + channels].fill(0.0);
                                }
                                return;
                            }
                        }
                    }
                    data.fill(0.0);
                },
                err_fn,
                None,
            )
        }
        SampleFormat::F64 => {
            let mixer_clone = Arc::clone(ctx.mixer);
            let samples_clone = Arc::clone(ctx.samples_table);
            let cmd_rx_clone = Arc::clone(ctx.cmd_rx);
            ctx.device.build_output_stream(
                *config,
                move |data: &mut [f64], _: &cpal::OutputCallbackInfo| {
                    if let Ok(mut m) = mixer_clone.try_lock() {
                        while let Some(cmd) = cmd_rx_clone.try_pop() {
                            m.trigger_voice(cmd.sample_id as usize, cmd.volume);
                        }
                        if let Ok(table) = samples_clone.try_read() {
                            let num_frames = data.len().checked_div(channels).unwrap_or(0);
                            for f in 0..num_frames {
                                let mut temp = [0.0f32; 2];
                                m.render_stereo_f32(&mut temp, &table);
                                let base = f * channels;
                                if channels == 1 {
                                    data[base] = ((temp[0] + temp[1]) * 0.5) as f64;
                                } else if channels >= 2 {
                                    data[base] = temp[0] as f64;
                                    data[base + 1] = temp[1] as f64;
                                    data[base + 2..base + channels].fill(0.0);
                                }
                            }
                            return;
                        }
                    }
                    data.fill(0.0);
                },
                err_fn,
                None,
            )
        }
        SampleFormat::I32 => {
            let mixer_clone = Arc::clone(ctx.mixer);
            let samples_clone = Arc::clone(ctx.samples_table);
            let cmd_rx_clone = Arc::clone(ctx.cmd_rx);
            ctx.device.build_output_stream(
                *config,
                move |data: &mut [i32], _: &cpal::OutputCallbackInfo| {
                    if let Ok(mut m) = mixer_clone.try_lock() {
                        while let Some(cmd) = cmd_rx_clone.try_pop() {
                            m.trigger_voice(cmd.sample_id as usize, cmd.volume);
                        }
                        if let Ok(table) = samples_clone.try_read() {
                            let num_frames = data.len().checked_div(channels).unwrap_or(0);
                            for f in 0..num_frames {
                                let mut temp = [0.0f32; 2];
                                m.render_stereo_f32(&mut temp, &table);
                                let base = f * channels;
                                if channels == 1 {
                                    let mono = (temp[0] + temp[1]) * 0.5;
                                    data[base] = (mono as f64 * 2_147_483_647.0).round().clamp(-2_147_483_648.0, 2_147_483_647.0) as i32;
                                } else if channels >= 2 {
                                    data[base] = (temp[0] as f64 * 2_147_483_647.0).round().clamp(-2_147_483_648.0, 2_147_483_647.0) as i32;
                                    data[base + 1] = (temp[1] as f64 * 2_147_483_647.0).round().clamp(-2_147_483_648.0, 2_147_483_647.0) as i32;
                                    data[base + 2..base + channels].fill(0);
                                }
                            }
                            return;
                        }
                    }
                    data.fill(0);
                },
                err_fn,
                None,
            )
        }
        SampleFormat::I16 => {
            let mixer_clone = Arc::clone(ctx.mixer);
            let samples_clone = Arc::clone(ctx.samples_table);
            let cmd_rx_clone = Arc::clone(ctx.cmd_rx);
            ctx.device.build_output_stream(
                *config,
                move |data: &mut [i16], _: &cpal::OutputCallbackInfo| {
                    if let Ok(mut m) = mixer_clone.try_lock() {
                        while let Some(cmd) = cmd_rx_clone.try_pop() {
                            m.trigger_voice(cmd.sample_id as usize, cmd.volume);
                        }
                        if let Ok(table) = samples_clone.try_read() {
                            if channels == 2 {
                                m.render_stereo_i16(data, &table);
                                return;
                            } else if channels == 1 {
                                for sample_out in data.iter_mut() {
                                    let mut temp = [0i16; 2];
                                    m.render_stereo_i16(&mut temp, &table);
                                    *sample_out = ((temp[0] as i32 + temp[1] as i32) / 2) as i16;
                                }
                                return;
                            } else if channels > 2 {
                                let num_frames = data.len() / channels;
                                for f in 0..num_frames {
                                    let mut temp = [0i16; 2];
                                    m.render_stereo_i16(&mut temp, &table);
                                    let base = f * channels;
                                    data[base] = temp[0];
                                    data[base + 1] = temp[1];
                                    data[base + 2..base + channels].fill(0);
                                }
                                return;
                            }
                        }
                    }
                    data.fill(0);
                },
                err_fn,
                None,
            )
        }
        SampleFormat::U16 => {
            let mixer_clone = Arc::clone(ctx.mixer);
            let samples_clone = Arc::clone(ctx.samples_table);
            let cmd_rx_clone = Arc::clone(ctx.cmd_rx);
            ctx.device.build_output_stream(
                *config,
                move |data: &mut [u16], _: &cpal::OutputCallbackInfo| {
                    if let Ok(mut m) = mixer_clone.try_lock() {
                        while let Some(cmd) = cmd_rx_clone.try_pop() {
                            m.trigger_voice(cmd.sample_id as usize, cmd.volume);
                        }
                        if let Ok(table) = samples_clone.try_read() {
                            let mut temp_i16 = [0i16; 2];
                            let num_frames = data.len().checked_div(channels).unwrap_or(0);
                            for f in 0..num_frames {
                                m.render_stereo_i16(&mut temp_i16, &table);
                                let base = f * channels;
                                if channels == 1 {
                                    let mono = (temp_i16[0] as i32 + temp_i16[1] as i32) / 2;
                                    data[base] = (mono + 32768) as u16;
                                } else if channels >= 2 {
                                    data[base] = (temp_i16[0] as i32 + 32768) as u16;
                                    data[base + 1] = (temp_i16[1] as i32 + 32768) as u16;
                                    data[base + 2..base + channels].fill(32768);
                                }
                            }
                            return;
                        }
                    }
                    data.fill(32768);
                },
                err_fn,
                None,
            )
        }
        _ => {
            return Err(AudioError::Stream(format!(
                "Unsupported hardware sample format: {:?}",
                sample_format
            )));
        }
    };

    stream_res.map_err(|e| {
        AudioError::Stream(format!(
            "Failed to build CPAL stream (format={:?}): {}",
            sample_format, e
        ))
    })
}

fn create_cpal_stream(
    device: &cpal::Device,
    mixer: Arc<Mutex<AudioMixer>>,
    samples_table: Arc<RwLock<Vec<Option<Arc<SampleData>>>>>,
    cmd_rx: Arc<SpscConsumer<PlayCommand, COMMAND_QUEUE_CAPACITY>>,
    stream_healthy: Arc<AtomicBool>,
    rebuild_tx: &SyncSender<()>,
) -> Result<(cpal::Stream, u32, String), AudioError> {
    let default_config = match device.default_output_config() {
        Ok(cfg) => cfg,
        Err(e) => {
            let mut supported = device.supported_output_configs().map_err(|e2| {
                AudioError::Device(format!(
                    "Failed to query audio configs (default: {}, supported: {})",
                    e, e2
                ))
            })?;
            let first = supported.next();
            let chosen = first
                .into_iter()
                .chain(supported)
                .find(|c| c.channels() <= 2)
                .or(first)
                .ok_or_else(|| {
                    AudioError::Device("No supported output configurations found".to_string())
                })?;
            chosen.with_max_sample_rate()
        }
    };

    let sample_format = default_config.sample_format();
    let mut config: StreamConfig = default_config.config();
    let target_sample_rate = config.sample_rate;
    let channels = config.channels as usize;

    // Zero-lag low-latency buffer configuration for interactive typing audio.
    // On Bluetooth A2DP / sound servers, BufferSize::Default can be 4096-8192 frames (100-200ms lag).
    // Requesting a tight buffer (target 256 frames, ~5.3ms at 48kHz) forces PulseAudio/PipeWire
    // to minimize playback queue latency to < 10ms (real-time zero lag).
    let target_frames = 256u32;
    match default_config.buffer_size() {
        cpal::SupportedBufferSize::Range { min, max } => {
            let safe_frames = target_frames.clamp(*min, *max);
            config.buffer_size = cpal::BufferSize::Fixed(safe_frames);
            log_info!(
                "audio",
                "Configured low-latency buffer: {} frames (range: {} - {})",
                safe_frames,
                min,
                max
            );
        }
        cpal::SupportedBufferSize::Unknown => {
            config.buffer_size = cpal::BufferSize::Fixed(256);
            log_info!("audio", "Configured low-latency buffer: Fixed(256) frames");
        }
    }

    let device_name = device
        .description()
        .map(|d| d.name().to_string())
        .unwrap_or_else(|_| "Default Device".to_string());

    log_info!(
        "audio",
        "CPAL output device '{}' detected: format={:?}, rate={} Hz, channels={}, buffer={:?}",
        device_name,
        sample_format,
        target_sample_rate,
        channels,
        config.buffer_size
    );

    if let Ok(mut m) = mixer.lock() {
        m.set_sample_rate(target_sample_rate);
    }

    let build_ctx = StreamBuildContext {
        device,
        mixer: &mixer,
        samples_table: &samples_table,
        cmd_rx: &cmd_rx,
        stream_healthy: &stream_healthy,
        rebuild_tx,
    };

    let format_supported = matches!(
        sample_format,
        SampleFormat::F32
            | SampleFormat::F64
            | SampleFormat::I32
            | SampleFormat::I16
            | SampleFormat::U16
    );

    let stream = match build_stream_for_config(&build_ctx, &config, sample_format, channels) {
        Ok(s) => s,
        Err(_) if format_supported && !matches!(config.buffer_size, cpal::BufferSize::Default) => {
            config.buffer_size = cpal::BufferSize::Default;
            build_stream_for_config(&build_ctx, &config, sample_format, channels)?
        }
        Err(e) => return Err(e),
    };

    stream.play().map_err(|e| AudioError::Stream(format!("Failed to start CPAL stream: {}", e)))?;

    Ok((stream, target_sample_rate, device_name))
}

#[cfg(target_os = "linux")]
pub fn silence_alsa_logging() {
    unsafe extern "C" fn silent_alsa_handler(
        _file: *const std::ffi::c_char,
        _line: std::ffi::c_int,
        _function: *const std::ffi::c_char,
        _err: std::ffi::c_int,
        _fmt: *const std::ffi::c_char,
    ) {
        // Intentionally swallow ALSA diagnostic stderr logging to eliminate noisy pcm_dmix prints
    }

    unsafe extern "C" {
        fn snd_lib_error_set_handler(handler: *const ()) -> std::ffi::c_int;
    }

    unsafe {
        let _ = snd_lib_error_set_handler(silent_alsa_handler as *const ());
    }
}

#[cfg(not(target_os = "linux"))]
pub fn silence_alsa_logging() {}

/// Intelligently finds the best audio host and output device on the system.
/// Prioritizes modern sound servers (PulseAudio, PipeWire) over raw ALSA hardware.
/// Directly resolves host.default_output_device() as the Golden Source of Truth,
/// avoiding expensive/noisy hardware scans (e.g. pcm_dmix probes) during hot swapping.
pub fn find_best_output_device() -> Option<(cpal::Device, String)> {
    let mut candidate_hosts = Vec::new();

    // 1. Prioritize sound server backends (PulseAudio / PipeWire)
    for host_id in cpal::available_hosts() {
        let name = format!("{:?}", host_id).to_lowercase();
        if (name.contains("pulse") || name.contains("pipewire"))
            && let Ok(h) = cpal::host_from_id(host_id)
        {
            candidate_hosts.push(h);
        }
    }

    // 2. Add default host if not already in candidate list
    let default_host = cpal::default_host();
    if !candidate_hosts.iter().any(|h| h.id() == default_host.id()) {
        candidate_hosts.push(default_host);
    }

    // 3. Add any remaining available hosts
    for host_id in cpal::available_hosts() {
        if !candidate_hosts.iter().any(|h| h.id() == host_id)
            && let Ok(h) = cpal::host_from_id(host_id)
        {
            candidate_hosts.push(h);
        }
    }

    // Resolve default output device directly without invoking noisy pcm_dmix hardware probes
    for host in candidate_hosts {
        if let Some(default_dev) = host.default_output_device() {
            let default_name = default_dev
                .description()
                .ok()
                .map(|desc| desc.name().to_string())
                .unwrap_or_else(|| "Default Audio Device".to_string());
            return Some((default_dev, default_name));
        }
    }

    None
}

/// Initializes the hardware audio stream on a dedicated OS thread with an active supervisor loop.
/// Automatically recovers from device disconnections (e.g. Bluetooth A2DP / USB DAC reconnect)
/// and handles OS audio route transitions without blocking or crashing.
pub fn start_audio_stream(
    mixer: Arc<Mutex<AudioMixer>>,
    samples_table: Arc<RwLock<Vec<Option<Arc<SampleData>>>>>,
    raw_samples: Arc<RwLock<HashMap<String, SampleData>>>,
    sample_map: Arc<RwLock<HashMap<String, usize>>>,
    cmd_rx: Arc<SpscConsumer<PlayCommand, COMMAND_QUEUE_CAPACITY>>,
    stream_healthy: Arc<AtomicBool>,
    target_sample_rate: Arc<AtomicU32>,
) -> Result<(SyncSender<()>, SyncSender<()>), AudioError> {
    let (init_tx, init_rx) = channel();
    let (shutdown_tx, shutdown_rx) = sync_channel::<()>(1);
    let (rebuild_tx, rebuild_rx) = sync_channel::<()>(4);
    let rebuild_tx_return = rebuild_tx.clone();

    thread::Builder::new()
        .name("audio-runner".into())
        .spawn(move || {
            silence_alsa_logging();

            let initial_res = match find_best_output_device() {
                Some((device, _)) => create_cpal_stream(
                    &device,
                    Arc::clone(&mixer),
                    Arc::clone(&samples_table),
                    Arc::clone(&cmd_rx),
                    Arc::clone(&stream_healthy),
                    &rebuild_tx,
                ),
                None => Err(AudioError::Device("No output device available".to_string())),
            };

            let (mut current_stream, mut current_device_name) = match initial_res {
                Ok((stream, rate, name)) => {
                    target_sample_rate.store(rate, Ordering::Release);
                    stream_healthy.store(true, Ordering::Release);
                    let _ = init_tx.send(Ok(()));
                    (Some(stream), name)
                }
                Err(e) => {
                    let _ = init_tx.send(Err(e));
                    (None, String::new())
                }
            };

            // Audio Stream Supervisor Loop:
            // Auto-recovers from Bluetooth/DAC disconnects, route changes, or explicit rebuild triggers.
            // Instant wake-up (<0.1ms) via rebuild_rx, or periodic 500ms check for OS default sink transitions.
            loop {
                // Wait on rebuild_rx for instant wake-up (<0.1ms) on frontend rebuild event,
                // or timeout after 500ms to check for background OS default sink changes.
                let mut rebuild_requested = match rebuild_rx.recv_timeout(Duration::from_millis(500)) {
                    Ok(_) => true,
                    Err(RecvTimeoutError::Timeout) => false,
                    Err(RecvTimeoutError::Disconnected) => break,
                };

                // Drain any additional queued rebuild signals
                while rebuild_rx.try_recv().is_ok() {
                    rebuild_requested = true;
                }

                // Check shutdown signal non-blocking
                if shutdown_rx.try_recv().is_ok() {
                    break;
                }

                let is_unhealthy = !stream_healthy.load(Ordering::Acquire);
                let stream_missing = current_stream.is_none();

                let maybe_best = find_best_output_device();
                let device_changed = if let Some((_, ref new_name)) = maybe_best {
                    !new_name.is_empty() && new_name != &current_device_name
                } else {
                    false
                };

                if rebuild_requested || is_unhealthy || stream_missing || device_changed {
                    if is_unhealthy || stream_missing || device_changed {
                        current_stream = None;
                        stream_healthy.store(false, Ordering::Release);
                    }

                    if let Some((device, new_name)) = maybe_best
                        && (rebuild_requested || current_stream.is_none() || new_name != current_device_name)
                    {
                        current_stream = None;
                        stream_healthy.store(false, Ordering::Release);

                        match create_cpal_stream(
                            &device,
                            Arc::clone(&mixer),
                            Arc::clone(&samples_table),
                            Arc::clone(&cmd_rx),
                            Arc::clone(&stream_healthy),
                            &rebuild_tx,
                        ) {
                            Ok((new_stream, new_rate, new_device_name)) => {
                                log_info!(
                                    "audio",
                                    "Audio supervisor successfully migrated stream to '{}' (rate: {} Hz)",
                                    new_device_name,
                                    new_rate
                                );
                                let old_rate = target_sample_rate.swap(new_rate, Ordering::AcqRel);
                                if old_rate != new_rate {
                                    // Resample cached buffers outside samples_table.write() lock
                                    let mut resampled_updates: Vec<(usize, Arc<SampleData>)> = Vec::new();
                                    if let (Ok(raw_map), Ok(map)) = (raw_samples.read(), sample_map.read()) {
                                        resampled_updates.reserve(raw_map.len());
                                        for (id, raw) in raw_map.iter() {
                                            if let Some(&idx) = map.get(id) {
                                                let resampled = resample_stereo(raw.clone(), new_rate);
                                                resampled_updates.push((idx, Arc::new(resampled)));
                                            }
                                        }
                                    }
                                    if !resampled_updates.is_empty()
                                        && let Ok(mut table) = samples_table.write()
                                    {
                                        for (idx, sample_arc) in resampled_updates {
                                            if idx < table.len() {
                                                table[idx] = Some(sample_arc);
                                            }
                                        }
                                    }
                                }
                                current_stream = Some(new_stream);
                                current_device_name = new_device_name;
                                stream_healthy.store(true, Ordering::Release);
                            }
                            Err(e) => {
                                log_warn!("audio", "Audio supervisor stream rebuild attempt failed: {}", e);
                            }
                        }
                    }
                }
            }
        })
        .map_err(|e| AudioError::Internal(format!("Failed to spawn audio runner thread: {}", e)))?;

    init_rx
        .recv()
        .map_err(|_| AudioError::Internal("Audio runner thread dropped init channel".to_string()))??;

    Ok((shutdown_tx, rebuild_tx_return))
}

#[inline(always)]
pub fn pack_multichannel_f32(stereo: [f32; 2], channels: usize, out_frame: &mut [f32]) {
    if channels == 1 {
        out_frame[0] = (stereo[0] + stereo[1]) * 0.5;
    } else if channels >= 2 {
        out_frame[0] = stereo[0];
        out_frame[1] = stereo[1];
        for s in out_frame.iter_mut().take(channels).skip(2) {
            *s = 0.0;
        }
    }
}

#[inline(always)]
pub fn pack_multichannel_i16(stereo: [i16; 2], channels: usize, out_frame: &mut [i16]) {
    if channels == 1 {
        out_frame[0] = ((stereo[0] as i32 + stereo[1] as i32) / 2) as i16;
    } else if channels >= 2 {
        out_frame[0] = stereo[0];
        out_frame[1] = stereo[1];
        for s in out_frame.iter_mut().take(channels).skip(2) {
            *s = 0;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pack_multichannel_f32() {
        let stereo = [0.6, -0.4];
        let mut mono = [0.0f32; 1];
        pack_multichannel_f32(stereo, 1, &mut mono);
        assert!((mono[0] - 0.1).abs() < 1e-5);

        let mut surround = [0.0f32; 6];
        pack_multichannel_f32(stereo, 6, &mut surround);
        assert_eq!(surround[0], 0.6);
        assert_eq!(surround[1], -0.4);
        assert_eq!(surround[2..6], [0.0, 0.0, 0.0, 0.0]);
    }

    #[test]
    fn test_pack_multichannel_i16() {
        let stereo = [1000i16, -2000i16];
        let mut mono = [0i16; 1];
        pack_multichannel_i16(stereo, 1, &mut mono);
        assert_eq!(mono[0], -500);

        let mut surround = [0i16; 8];
        pack_multichannel_i16(stereo, 8, &mut surround);
        assert_eq!(surround[0], 1000);
        assert_eq!(surround[1], -2000);
        assert_eq!(surround[2..8], [0, 0, 0, 0, 0, 0]);
    }

    #[test]
    fn test_find_best_output_device_non_crashing() {
        // Must execute cleanly without panic on any host configuration
        let _ = find_best_output_device();
    }

    #[test]
    fn test_silence_alsa_logging_non_crashing() {
        silence_alsa_logging();
    }
}
