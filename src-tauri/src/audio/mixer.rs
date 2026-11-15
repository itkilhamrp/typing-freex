use std::sync::Arc;
use crate::audio::types::SampleData;

pub const MAX_VOICES: usize = 64;

#[derive(Debug, Clone, Copy, Default)]
pub struct Voice {
    pub active: bool,
    pub sample_idx: usize,
    pub cursor: usize,
    pub volume: f32,
}

pub struct AudioMixer {
    voices: [Voice; MAX_VOICES],
    pub master_volume: f32,
    pub keep_alive_frames_remaining: usize,
    pub keep_alive_duration_frames: usize,
    rng_state: u32,
}

impl Default for AudioMixer {
    fn default() -> Self {
        Self::new()
    }
}

impl AudioMixer {
    pub fn new() -> Self {
        let default_keep_alive = 48_000 * 30;
        Self {
            voices: [Voice::default(); MAX_VOICES],
            master_volume: 1.0,
            keep_alive_frames_remaining: default_keep_alive, // 30 seconds pre-warm keep-alive for Bluetooth A2DP / DACs
            keep_alive_duration_frames: default_keep_alive,
            rng_state: 0x12345678,
        }
    }

    pub fn set_sample_rate(&mut self, sample_rate: u32) {
        let frames = (sample_rate.max(8_000) as usize).saturating_mul(30);
        self.keep_alive_duration_frames = frames;
        if self.keep_alive_frames_remaining > 0 {
            self.keep_alive_frames_remaining = frames;
        }
    }

    /// Trigger a new voice. If all voices are busy, steals the voice closest to finishing.
    pub fn trigger_voice(&mut self, sample_idx: usize, volume: f32) {
        let clamped_vol = volume.clamp(0.0, 2.0);
        if clamped_vol <= 0.0 {
            return;
        }

        // Arm keep-alive dither for ~30 seconds at current hardware sample rate to prevent
        // Bluetooth A2DP sinks and external DACs from sleeping on idle pauses between typing.
        self.keep_alive_frames_remaining = self.keep_alive_duration_frames;

        // 1. Look for an inactive voice
        for voice in self.voices.iter_mut() {
            if !voice.active {
                *voice = Voice {
                    active: true,
                    sample_idx,
                    cursor: 0,
                    volume: clamped_vol,
                };
                return;
            }
        }

        // 2. Steal the oldest / furthest-along voice
        let mut steal_idx = 0;
        let mut max_cursor = 0;
        for (i, voice) in self.voices.iter().enumerate() {
            if voice.cursor > max_cursor {
                max_cursor = voice.cursor;
                steal_idx = i;
            }
        }

        self.voices[steal_idx] = Voice {
            active: true,
            sample_idx,
            cursor: 0,
            volume: clamped_vol,
        };
    }

    /// Renders interleaved stereo frames directly into f32 hardware output without heap allocation.
    pub fn render_stereo(&mut self, output: &mut [f32], samples_table: &[Option<Arc<SampleData>>]) {
        self.render_stereo_f32(output, samples_table);
    }

    /// Renders interleaved stereo frames directly into f32 hardware output without heap allocation.
    pub fn render_stereo_f32(&mut self, output: &mut [f32], samples_table: &[Option<Arc<SampleData>>]) {
        let total_frames = output.len() / 2;
        if total_frames == 0 {
            return;
        }

        for frame_idx in 0..total_frames {
            let out_idx = frame_idx * 2;
            let mut sum_l = 0.0f32;
            let mut sum_r = 0.0f32;
            let mut active_count = 0usize;

            for voice in self.voices.iter_mut() {
                if !voice.active {
                    continue;
                }

                if let Some(Some(sample)) = samples_table.get(voice.sample_idx) {
                    let s_len = sample.samples.len();
                    if voice.cursor + 1 < s_len {
                        let sample_l = sample.samples[voice.cursor];
                        let sample_r = sample.samples[voice.cursor + 1];
                        sum_l += sample_l * voice.volume;
                        sum_r += sample_r * voice.volume;
                        voice.cursor += 2;
                        active_count += 1;
                    } else {
                        voice.active = false;
                    }
                } else {
                    voice.active = false;
                }
            }

            if active_count > 0 {
                // Polyphonic equal-power scaling prevents clipping during high-speed typing bursts
                let poly_scale = 1.0 / (1.0 + (active_count.saturating_sub(1) as f32) * 0.45).sqrt();
                let effective_master = self.master_volume * poly_scale;

                let mixed_l = sum_l * effective_master;
                let mixed_r = sum_r * effective_master;

                // Rational soft-limiter: x / (1.0 + |x|) gives clean tube-like saturation without digital clipping
                output[out_idx] = soft_clip(mixed_l);
                output[out_idx + 1] = soft_clip(mixed_r);
            } else if self.keep_alive_frames_remaining > 0 {
                self.keep_alive_frames_remaining = self.keep_alive_frames_remaining.saturating_sub(1);
                let dither_l = self.next_tpdf_dither();
                let dither_r = self.next_tpdf_dither();
                output[out_idx] = dither_l;
                output[out_idx + 1] = dither_r;
            } else {
                output[out_idx] = 0.0;
                output[out_idx + 1] = 0.0;
            }
        }
    }

    /// Renders interleaved stereo frames directly into i16 hardware output without heap allocation.
    pub fn render_stereo_i16(&mut self, output: &mut [i16], samples_table: &[Option<Arc<SampleData>>]) {
        let total_frames = output.len() / 2;
        if total_frames == 0 {
            return;
        }

        for frame_idx in 0..total_frames {
            let out_idx = frame_idx * 2;
            let mut sum_l = 0.0f32;
            let mut sum_r = 0.0f32;
            let mut active_count = 0usize;

            for voice in self.voices.iter_mut() {
                if !voice.active {
                    continue;
                }

                if let Some(Some(sample)) = samples_table.get(voice.sample_idx) {
                    let s_len = sample.samples.len();
                    if voice.cursor + 1 < s_len {
                        let sample_l = sample.samples[voice.cursor];
                        let sample_r = sample.samples[voice.cursor + 1];
                        sum_l += sample_l * voice.volume;
                        sum_r += sample_r * voice.volume;
                        voice.cursor += 2;
                        active_count += 1;
                    } else {
                        voice.active = false;
                    }
                } else {
                    voice.active = false;
                }
            }

            if active_count > 0 {
                let poly_scale = 1.0 / (1.0 + (active_count.saturating_sub(1) as f32) * 0.45).sqrt();
                let effective_master = self.master_volume * poly_scale;

                let mixed_l = sum_l * effective_master;
                let mixed_r = sum_r * effective_master;

                output[out_idx] = (soft_clip(mixed_l) * 32767.0).round().clamp(-32768.0, 32767.0) as i16;
                output[out_idx + 1] = (soft_clip(mixed_r) * 32767.0).round().clamp(-32768.0, 32767.0) as i16;
            } else if self.keep_alive_frames_remaining > 0 {
                self.keep_alive_frames_remaining = self.keep_alive_frames_remaining.saturating_sub(1);
                let dither_l = self.next_tpdf_dither();
                let dither_r = self.next_tpdf_dither();
                output[out_idx] = (dither_l * 32767.0).round().clamp(-32768.0, 32767.0) as i16;
                output[out_idx + 1] = (dither_r * 32767.0).round().clamp(-32768.0, 32767.0) as i16;
            } else {
                output[out_idx] = 0;
                output[out_idx + 1] = 0;
            }
        }
    }

    /// Fast, non-blocking zero-allocation pseudo-random sub-audible TPDF noise generator (~ -85 dBFS / ±1.8 LSB).
    /// Keeps Bluetooth A2DP sinks and external DACs active and unmuted.
    #[inline(always)]
    pub fn next_tpdf_dither(&mut self) -> f32 {
        let mut x = self.rng_state;
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        self.rng_state = x;
        let r1 = ((x as i32) as f32) / 4294967296.0;

        let y = x.wrapping_mul(1664525).wrapping_add(1013904223);
        self.rng_state = y;
        let r2 = ((y as i32) as f32) / 4294967296.0;

        // Triangular Probability Density Function (sum of 2 independent uniform randoms, ±0.000055 -> ~±1.8 LSB in i16)
        (r1 + r2) * 0.000055
    }

    pub fn set_master_volume(&mut self, volume: f32) {
        self.master_volume = volume.clamp(0.0, 2.0);
    }

    pub fn stop_all(&mut self) {
        for voice in self.voices.iter_mut() {
            voice.active = false;
        }
        self.keep_alive_frames_remaining = 0;
    }
}

#[inline(always)]
fn soft_clip(x: f32) -> f32 {
    const KNEE: f32 = 0.8;
    const HEADROOM: f32 = 1.0 - KNEE;
    let abs_x = x.abs();
    if abs_x <= KNEE {
        x
    } else {
        let excess = abs_x - KNEE;
        let saturated = KNEE + excess / (1.0 + excess / HEADROOM);
        saturated.copysign(x).clamp(-1.0, 1.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mixer_single_voice_f32() {
        let mut mixer = AudioMixer::new();
        let sample = Arc::new(SampleData {
            sample_rate: 48000,
            channels: 2,
            samples: vec![0.5, -0.5, 0.8, -0.8], // 2 frames
        });
        let table = vec![Some(sample)];

        mixer.trigger_voice(0, 1.0);

        let mut output = [0.0f32; 4];
        mixer.render_stereo_f32(&mut output, &table);

        assert!((output[0] - 0.5).abs() < 1e-4);
        assert!((output[1] - (-0.5)).abs() < 1e-4);
        assert!((output[2] - 0.8).abs() < 1e-4);
        assert!((output[3] - (-0.8)).abs() < 1e-4);

        // Next render contains sub-audible TPDF keep-alive dither (< -80 dBFS) to keep Bluetooth A2DP awake
        let mut next_output = [0.0f32; 4];
        mixer.render_stereo_f32(&mut next_output, &table);
        for &s in &next_output {
            assert!(s.abs() < 1e-4);
        }

        // When stop_all is called, all voices and keep-alive dither stop
        mixer.stop_all();
        let mut silent_output = [0.0f32; 4];
        mixer.render_stereo_f32(&mut silent_output, &table);
        assert_eq!(silent_output, [0.0, 0.0, 0.0, 0.0]);
    }

    #[test]
    fn test_mixer_single_voice_i16() {
        let mut mixer = AudioMixer::new();
        let sample = Arc::new(SampleData {
            sample_rate: 48000,
            channels: 2,
            samples: vec![0.5, -0.5], // 1 frame
        });
        let table = vec![Some(sample)];

        mixer.trigger_voice(0, 1.0);

        let mut output = [0i16; 2];
        mixer.render_stereo_i16(&mut output, &table);

        assert!((output[0] - 16383).abs() <= 2);
        assert!((output[1] - (-16383)).abs() <= 2);
    }

    #[test]
    fn test_mixer_voice_stealing() {
        let mut mixer = AudioMixer::new();
        let sample = Arc::new(SampleData {
            sample_rate: 48000,
            channels: 2,
            samples: vec![0.1; 100],
        });
        let table = vec![Some(sample)];

        // Fill all 64 voices
        for _ in 0..MAX_VOICES {
            mixer.trigger_voice(0, 1.0);
        }

        // Advance mixer slightly
        let mut out = [0.0f32; 20];
        mixer.render_stereo(&mut out, &table);

        // Trigger 65th voice (must steal without panic)
        mixer.trigger_voice(0, 1.0);

        let active_count = mixer.voices.iter().filter(|v| v.active).count();
        assert_eq!(active_count, MAX_VOICES);
    }

    #[test]
    fn test_mixer_tpdf_dither_amplitude() {
        let mut mixer = AudioMixer::new();
        for _ in 0..1000 {
            let dither = mixer.next_tpdf_dither();
            assert!(dither.abs() < 1e-4, "Dither must remain strictly sub-audible (< -80 dBFS)");
        }
    }

    #[test]
    fn test_mixer_volume_boost_2x() {
        let mut mixer = AudioMixer::new();
        let sample = Arc::new(SampleData {
            sample_rate: 48000,
            channels: 2,
            samples: vec![0.3, -0.3], // 1 frame
        });
        let table = vec![Some(sample)];

        // Boost voice volume to 2.0 (200%)
        mixer.trigger_voice(0, 2.0);

        let mut output = [0.0f32; 2];
        mixer.render_stereo_f32(&mut output, &table);

        // 0.3 * 2.0 = 0.6. With soft_clip(0.6) = 0.6 (since |0.6| <= 1.0)
        assert!((output[0] - 0.6).abs() < 1e-4);
        assert!((output[1] - (-0.6)).abs() < 1e-4);
    }

    #[test]
    fn test_mixer_soft_clip_safety() {
        let mut mixer = AudioMixer::new();
        let sample = Arc::new(SampleData {
            sample_rate: 48000,
            channels: 2,
            samples: vec![0.9, -0.9], // 1 frame
        });
        let table = vec![Some(sample)];

        // 0.9 * 2.0 = 1.8. soft_clip(1.8) = 1.8 / 2.8 * 1.5 = ~0.9642
        mixer.trigger_voice(0, 2.0);

        let mut output = [0.0f32; 2];
        mixer.render_stereo_f32(&mut output, &table);

        assert!(output[0] <= 1.0 && output[0] > 0.9);
        assert!(output[1] >= -1.0 && output[1] < -0.9);
    }

    #[test]
    fn test_soft_clip_continuity_and_monotonicity() {
        let mut prev = soft_clip(0.0);
        assert!((prev - 0.0).abs() < f32::EPSILON);

        for step in 1..=300 {
            let x = step as f32 * 0.01;
            let curr = soft_clip(x);
            assert!(curr >= prev, "soft_clip must be monotonically non-decreasing at x={x}");
            assert!((curr - prev) < 0.02, "soft_clip must not exhibit step jumps at x={x}");
            assert!(curr <= 1.0, "soft_clip must never exceed 1.0 at x={x}");
            assert!(
                (soft_clip(-x) + curr).abs() < 1e-6,
                "soft_clip must be odd-symmetric at x={x}"
            );
            prev = curr;
        }
    }

    #[test]
    fn test_render_stereo_i16_tpdf_dither_nonzero_rate() {
        let mut mixer = AudioMixer::new();
        let table = Vec::new();
        let mut output = vec![0i16; 9600]; // 4800 stereo frames in keep-alive state
        mixer.render_stereo_i16(&mut output, &table);

        let nonzero = output.iter().filter(|&&s| s != 0).count();
        let max_abs = output.iter().map(|&s| s.unsigned_abs()).max().unwrap_or(0);
        assert!(
            nonzero * 2 > output.len(),
            "Expected >50% non-zero 16-bit TPDF dither samples, got {nonzero}/{}",
            output.len()
        );
        assert!(max_abs <= 4, "TPDF dither must stay sub-audible (max_abs={max_abs})");
    }
}
