use crate::audio::types::{AudioError, SampleData};

/// Pure RIFF WAVE container parser.
/// Converts any standard PCM/Float RIFF WAVE into interleaved stereo f32 samples.
pub fn decode_wav(bytes: &[u8]) -> Result<SampleData, AudioError> {
    if bytes.len() < 44 {
        return Err(AudioError::Wav("Data too small to be a valid WAV file".to_string()));
    }

    // Check RIFF and WAVE magic numbers
    if &bytes[0..4] != b"RIFF" || &bytes[8..12] != b"WAVE" {
        return Err(AudioError::Wav("Invalid RIFF/WAVE header".to_string()));
    }

    let mut offset = 12;
    let mut audio_format: u16 = 0;
    let mut num_channels: u16 = 0;
    let mut sample_rate: u32 = 0;
    let mut bits_per_sample: u16 = 0;
    let mut data_start = 0;
    let mut data_len = 0;

    while offset + 8 <= bytes.len() {
        let chunk_id = &bytes[offset..offset + 4];
        let chunk_size = u32::from_le_bytes([
            bytes[offset + 4],
            bytes[offset + 5],
            bytes[offset + 6],
            bytes[offset + 7],
        ]) as usize;
        let chunk_data_offset = offset + 8;

        if chunk_id == b"fmt " {
            if chunk_size < 16 || chunk_data_offset + 16 > bytes.len() {
                return Err(AudioError::Wav("Malformed fmt chunk".to_string()));
            }
            audio_format = u16::from_le_bytes([bytes[chunk_data_offset], bytes[chunk_data_offset + 1]]);
            num_channels = u16::from_le_bytes([bytes[chunk_data_offset + 2], bytes[chunk_data_offset + 3]]);
            sample_rate = u32::from_le_bytes([
                bytes[chunk_data_offset + 4],
                bytes[chunk_data_offset + 5],
                bytes[chunk_data_offset + 6],
                bytes[chunk_data_offset + 7],
            ]);
            bits_per_sample = u16::from_le_bytes([bytes[chunk_data_offset + 14], bytes[chunk_data_offset + 15]]);

            // Handle WAVE_FORMAT_EXTENSIBLE (0xFFFE)
            if audio_format == 0xFFFE && chunk_size >= 40 && chunk_data_offset + 40 <= bytes.len() {
                audio_format = u16::from_le_bytes([bytes[chunk_data_offset + 24], bytes[chunk_data_offset + 25]]);
            }
        } else if chunk_id == b"data" {
            data_start = chunk_data_offset;
            data_len = chunk_size.min(bytes.len().saturating_sub(chunk_data_offset));
        }

        // Chunks in RIFF are padded to 2-byte boundaries
        let padded_chunk = match chunk_size.checked_add(chunk_size & 1) {
            Some(p) => p,
            None => break,
        };
        offset = match chunk_data_offset.checked_add(padded_chunk) {
            Some(next) => next,
            None => break,
        };
    }

    if data_start == 0 || data_len == 0 {
        return Err(AudioError::Wav("Missing or empty data chunk".to_string()));
    }
    if num_channels == 0 || sample_rate == 0 {
        return Err(AudioError::Wav("Missing or invalid fmt chunk".to_string()));
    }

    let raw_data = &bytes[data_start..data_start + data_len];
    let samples = decode_samples(raw_data, audio_format, num_channels, bits_per_sample)?;

    Ok(SampleData {
        sample_rate,
        channels: 2, // Always normalized to stereo
        samples,
    })
}

fn decode_samples(
    data: &[u8],
    audio_format: u16,
    num_channels: u16,
    bits_per_sample: u16,
) -> Result<Vec<f32>, AudioError> {
    let bytes_per_sample = (bits_per_sample / 8) as usize;
    if bytes_per_sample == 0 {
        return Err(AudioError::Wav("Invalid bits per sample (0)".to_string()));
    }

    let frame_size = bytes_per_sample * num_channels as usize;
    if frame_size == 0 {
        return Err(AudioError::Wav("Invalid frame size (0)".to_string()));
    }

    let total_frames = data.len() / frame_size;
    let mut stereo_samples = Vec::with_capacity(total_frames * 2);

    for frame_idx in 0..total_frames {
        let frame_start = frame_idx * frame_size;
        let left_sample = read_sample(data, frame_start, audio_format, bits_per_sample)?;
        let right_sample = if num_channels > 1 {
            read_sample(data, frame_start + bytes_per_sample, audio_format, bits_per_sample)?
        } else {
            left_sample
        };

        stereo_samples.push(left_sample);
        stereo_samples.push(right_sample);
    }

    Ok(stereo_samples)
}

#[inline(always)]
fn read_sample(data: &[u8], offset: usize, audio_format: u16, bits_per_sample: u16) -> Result<f32, AudioError> {
    match (audio_format, bits_per_sample) {
        // PCM 16-bit
        (1, 16) => {
            if offset + 2 > data.len() {
                return Ok(0.0);
            }
            let val = i16::from_le_bytes([data[offset], data[offset + 1]]);
            Ok(val as f32 / 32768.0)
        }
        // PCM 8-bit (unsigned, centered at 128)
        (1, 8) => {
            if offset >= data.len() {
                return Ok(0.0);
            }
            let val = data[offset] as f32;
            Ok((val - 128.0) / 128.0)
        }
        // PCM 24-bit
        (1, 24) => {
            if offset + 3 > data.len() {
                return Ok(0.0);
            }
            let b0 = data[offset] as u32;
            let b1 = data[offset + 1] as u32;
            let b2 = data[offset + 2] as u32;
            let combined = (b0 | (b1 << 8) | (b2 << 16)) as i32;
            // Sign-extend 24-bit to 32-bit
            let val = if combined & 0x800000 != 0 {
                combined | !0xFFFFFF
            } else {
                combined
            };
            Ok(val as f32 / 8388608.0)
        }
        // PCM 32-bit
        (1, 32) => {
            if offset + 4 > data.len() {
                return Ok(0.0);
            }
            let val = i32::from_le_bytes([data[offset], data[offset + 1], data[offset + 2], data[offset + 3]]);
            Ok(val as f32 / 2147483648.0)
        }
        // IEEE Float 32-bit
        (3, 32) => {
            if offset + 4 > data.len() {
                return Ok(0.0);
            }
            let val = f32::from_le_bytes([data[offset], data[offset + 1], data[offset + 2], data[offset + 3]]);
            Ok(val.clamp(-1.0, 1.0))
        }
        _ => Err(AudioError::Wav(format!(
            "Unsupported WAV format: format={}, bits={}",
            audio_format, bits_per_sample
        ))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_wav(
        audio_format: u16,
        channels: u16,
        sample_rate: u32,
        bits_per_sample: u16,
        sample_data: &[u8],
    ) -> Vec<u8> {
        let mut out = Vec::new();
        let byte_rate = sample_rate * (channels as u32) * (bits_per_sample as u32 / 8);
        let block_align = channels * (bits_per_sample / 8);
        let total_size = 36 + sample_data.len() as u32;

        out.extend_from_slice(b"RIFF");
        out.extend_from_slice(&total_size.to_le_bytes());
        out.extend_from_slice(b"WAVE");

        out.extend_from_slice(b"fmt ");
        out.extend_from_slice(&16u32.to_le_bytes());
        out.extend_from_slice(&audio_format.to_le_bytes());
        out.extend_from_slice(&channels.to_le_bytes());
        out.extend_from_slice(&sample_rate.to_le_bytes());
        out.extend_from_slice(&byte_rate.to_le_bytes());
        out.extend_from_slice(&block_align.to_le_bytes());
        out.extend_from_slice(&bits_per_sample.to_le_bytes());

        out.extend_from_slice(b"data");
        out.extend_from_slice(&(sample_data.len() as u32).to_le_bytes());
        out.extend_from_slice(sample_data);

        out
    }

    #[test]
    fn test_decode_16bit_mono_wav() {
        // 2 mono samples: 0, 16384 (0.5)
        let s0 = 0i16.to_le_bytes();
        let s1 = 16384i16.to_le_bytes();
        let raw = [s0[0], s0[1], s1[0], s1[1]];

        let wav_bytes = create_test_wav(1, 1, 44100, 16, &raw);
        let decoded = decode_wav(&wav_bytes).expect("Should decode mono 16-bit WAV");

        assert_eq!(decoded.sample_rate, 44100);
        assert_eq!(decoded.channels, 2);
        // Stereo expansion: 2 frames -> 4 samples
        assert_eq!(decoded.samples.len(), 4);
        assert!((decoded.samples[0] - 0.0).abs() < 1e-4);
        assert!((decoded.samples[1] - 0.0).abs() < 1e-4);
        assert!((decoded.samples[2] - 0.5).abs() < 1e-4);
        assert!((decoded.samples[3] - 0.5).abs() < 1e-4);
    }

    #[test]
    fn test_decode_16bit_stereo_wav() {
        let left = 16384i16.to_le_bytes();
        let right = (-16384i16).to_le_bytes();
        let raw = [left[0], left[1], right[0], right[1]];

        let wav_bytes = create_test_wav(1, 2, 48000, 16, &raw);
        let decoded = decode_wav(&wav_bytes).expect("Should decode stereo 16-bit WAV");

        assert_eq!(decoded.sample_rate, 48000);
        assert_eq!(decoded.samples.len(), 2);
        assert!((decoded.samples[0] - 0.5).abs() < 1e-4);
        assert!((decoded.samples[1] - (-0.5)).abs() < 1e-4);
    }

    #[test]
    fn test_decode_float32_wav() {
        let left = 0.75f32.to_le_bytes();
        let right = (-0.25f32).to_le_bytes();
        let mut raw = Vec::new();
        raw.extend_from_slice(&left);
        raw.extend_from_slice(&right);

        let wav_bytes = create_test_wav(3, 2, 48000, 32, &raw);
        let decoded = decode_wav(&wav_bytes).expect("Should decode 32-bit float WAV");

        assert_eq!(decoded.samples.len(), 2);
        assert!((decoded.samples[0] - 0.75).abs() < 1e-4);
        assert!((decoded.samples[1] - (-0.25)).abs() < 1e-4);
    }

    #[test]
    fn test_invalid_header_fails() {
        let corrupt = b"NOT_A_WAV_HEADER_DATA_STREAM_TOO_SHORT";
        assert!(decode_wav(corrupt).is_err());
    }

    #[test]
    fn test_malformed_chunk_size_overflow_safe() {
        let raw = [0i16.to_le_bytes(), 16384i16.to_le_bytes()].concat();
        let mut wav_bytes = create_test_wav(1, 1, 44100, 16, &raw);
        // Append a malformed trailing chunk claiming u32::MAX payload size
        wav_bytes.extend_from_slice(b"JUNK");
        wav_bytes.extend_from_slice(&u32::MAX.to_le_bytes());
        wav_bytes.extend_from_slice(&[0u8; 4]);

        let decoded = decode_wav(&wav_bytes).expect("Malformed trailing chunk must not panic or fail valid data");
        assert_eq!(decoded.sample_rate, 44100);
        assert_eq!(decoded.samples.len(), 4);
    }
}

