use crate::audio::types::SampleData;

/// Resamples interleaved stereo f32 samples from source_rate to target_rate.
/// If source_rate == target_rate, returns the original SampleData unchanged.
pub fn resample_stereo(sample: SampleData, target_rate: u32) -> SampleData {
    if target_rate == 0 || sample.sample_rate == 0 || sample.sample_rate == target_rate || sample.samples.is_empty() {
        return sample;
    }

    let src_rate = sample.sample_rate as f64;
    let dst_rate = target_rate as f64;
    let ratio = src_rate / dst_rate;

    let in_frames = sample.samples.len() / 2;
    if in_frames == 0 {
        return sample;
    }

    let out_frames = ((in_frames as f64) / ratio).round().max(1.0) as usize;
    let mut out_samples = Vec::with_capacity(out_frames * 2);
    let max_frame = in_frames - 1;

    for i in 0..out_frames {
        let src_pos = i as f64 * ratio;
        let idx0 = src_pos.floor() as usize;
        let idx1 = (idx0 + 1).min(max_frame);
        let frac = (src_pos - idx0 as f64) as f32;

        let s0_l = sample.samples[idx0 * 2];
        let s0_r = sample.samples[idx0 * 2 + 1];
        let s1_l = sample.samples[idx1 * 2];
        let s1_r = sample.samples[idx1 * 2 + 1];

        let out_l = s0_l + (s1_l - s0_l) * frac;
        let out_r = s0_r + (s1_r - s0_r) * frac;

        out_samples.push(out_l);
        out_samples.push(out_r);
    }

    SampleData {
        sample_rate: target_rate,
        channels: 2,
        samples: out_samples,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resample_identity() {
        let original = SampleData {
            sample_rate: 48000,
            channels: 2,
            samples: vec![0.1, -0.1, 0.5, -0.5],
        };
        let resampled = resample_stereo(original.clone(), 48000);
        assert_eq!(resampled.sample_rate, 48000);
        assert_eq!(resampled.samples, original.samples);
    }

    #[test]
    fn test_resample_upsample() {
        let original = SampleData {
            sample_rate: 44100,
            channels: 2,
            samples: vec![0.0, 0.0, 1.0, 1.0], // 2 frames
        };
        let resampled = resample_stereo(original, 88200);
        assert_eq!(resampled.sample_rate, 88200);
        // Ratio is 0.5, 2 frames -> 4 frames (8 samples)
        assert_eq!(resampled.samples.len(), 8);
        assert!((resampled.samples[0] - 0.0).abs() < 1e-4);
        assert!((resampled.samples[6] - 1.0).abs() < 1e-4);
    }

    #[test]
    fn test_resample_downsample() {
        let original = SampleData {
            sample_rate: 48000,
            channels: 2,
            samples: vec![0.0, 0.0, 0.5, 0.5, 1.0, 1.0, 0.5, 0.5], // 4 frames
        };
        let resampled = resample_stereo(original, 24000);
        assert_eq!(resampled.sample_rate, 24000);
        // Ratio is 2.0, 4 frames -> 2 frames (4 samples)
        assert_eq!(resampled.samples.len(), 4);
    }

    #[test]
    fn test_resample_zero_target_rate_guard() {
        let original = SampleData {
            sample_rate: 48000,
            channels: 2,
            samples: vec![0.25, -0.25, 0.5, -0.5],
        };
        let resampled = resample_stereo(original.clone(), 0);
        assert_eq!(resampled.sample_rate, 48000);
        assert_eq!(resampled.samples, original.samples);
    }
}

