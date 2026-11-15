use crate::error::AppError;

const MAGIC_HEADER: &[u8; 5] = b"TFZC1"; // Typing FreeX Z-Compress Version 1
const ESCAPE_BYTE: u8 = 0xFF;
const TAG_LITERAL_ESCAPE: u8 = 0x00;
const TAG_RLE: u8 = 0x01;
const TAG_LZ_MATCH: u8 = 0x02;

const MIN_RLE_RUN: usize = 4;
const MAX_RLE_RUN: usize = 255;
const MIN_LZ_MATCH: usize = 4;
const MAX_LZ_MATCH: usize = 255;
const MAX_LZ_WINDOW: usize = 4096;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompressionResult {
    pub data: String,
    pub is_compressed: bool,
}

/// Compress input text using dual-phase LZ-RLE algorithm.
/// If compression does not reduce payload size, original plaintext is retained.
pub fn compress_text(input: &str) -> CompressionResult {
    let raw_bytes = input.as_bytes();
    if raw_bytes.len() < 32 {
        return CompressionResult {
            data: input.to_string(),
            is_compressed: false,
        };
    }

    let compressed_bytes = compress_bytes(raw_bytes);
    let encoded = base64_encode(&compressed_bytes);

    if encoded.len() < input.len() {
        CompressionResult {
            data: encoded,
            is_compressed: true,
        }
    } else {
        CompressionResult {
            data: input.to_string(),
            is_compressed: false,
        }
    }
}

/// Decompress payload string. If `is_compressed` is false, returns original string as-is.
pub fn decompress_text(data: &str, is_compressed: bool) -> Result<String, AppError> {
    if !is_compressed {
        return Ok(data.to_string());
    }

    let decoded_bytes = base64_decode(data)
        .map_err(|e| AppError::Validation(format!("Corrupt compressed data: base64 decode failed: {}", e)))?;

    let decompressed_bytes = decompress_bytes(&decoded_bytes)?;
    String::from_utf8(decompressed_bytes)
        .map_err(|e| AppError::Validation(format!("Corrupt compressed data: invalid UTF-8: {}", e)))
}

fn compress_bytes(input: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(input.len());
    out.extend_from_slice(MAGIC_HEADER);

    let mut i = 0;
    let n = input.len();

    while i < n {
        // 1. Check for Run-Length (consecutive duplicate characters)
        let mut rle_len = 1;
        while i + rle_len < n && rle_len < MAX_RLE_RUN && input[i + rle_len] == input[i] {
            rle_len += 1;
        }

        if rle_len >= MIN_RLE_RUN {
            out.push(ESCAPE_BYTE);
            out.push(TAG_RLE);
            out.push(rle_len as u8);
            out.push(input[i]);
            i += rle_len;
            continue;
        }

        // 2. Check for LZ match in sliding window (duplicate phrases/tokens)
        let window_start = i.saturating_sub(MAX_LZ_WINDOW);
        let mut best_match_len = 0;
        let mut best_match_dist = 0;

        if i + MIN_LZ_MATCH <= n {
            let max_possible = (n - i).min(MAX_LZ_MATCH);
            for w in window_start..i {
                let mut match_len = 0;
                while match_len < max_possible && input[w + match_len] == input[i + match_len] {
                    match_len += 1;
                }
                if match_len >= MIN_LZ_MATCH && match_len > best_match_len {
                    best_match_len = match_len;
                    best_match_dist = i - w;
                    if match_len == max_possible {
                        break;
                    }
                }
            }
        }

        if best_match_len >= MIN_LZ_MATCH && best_match_dist <= MAX_LZ_WINDOW {
            out.push(ESCAPE_BYTE);
            out.push(TAG_LZ_MATCH);
            out.push((best_match_dist >> 8) as u8);
            out.push((best_match_dist & 0xFF) as u8);
            out.push(best_match_len as u8);
            i += best_match_len;
            continue;
        }

        // 3. Literal byte
        let b = input[i];
        if b == ESCAPE_BYTE {
            out.push(ESCAPE_BYTE);
            out.push(TAG_LITERAL_ESCAPE);
        } else {
            out.push(b);
        }
        i += 1;
    }

    out
}

fn decompress_bytes(input: &[u8]) -> Result<Vec<u8>, AppError> {
    if input.len() < MAGIC_HEADER.len() || &input[..MAGIC_HEADER.len()] != MAGIC_HEADER {
        return Err(AppError::Validation("Invalid magic header for compressed text".to_string()));
    }

    let mut out = Vec::new();
    let mut i = MAGIC_HEADER.len();
    let n = input.len();

    while i < n {
        let b = input[i];
        if b != ESCAPE_BYTE {
            out.push(b);
            i += 1;
            continue;
        }

        i += 1;
        if i >= n {
            return Err(AppError::Validation("Unexpected end of compressed stream after escape byte".to_string()));
        }

        let tag = input[i];
        i += 1;

        match tag {
            TAG_LITERAL_ESCAPE => {
                out.push(ESCAPE_BYTE);
            }
            TAG_RLE => {
                if i + 1 >= n {
                    return Err(AppError::Validation("Truncated RLE token in compressed stream".to_string()));
                }
                let run_len = input[i] as usize;
                let val = input[i + 1];
                i += 2;
                out.resize(out.len() + run_len, val);
            }
            TAG_LZ_MATCH => {
                if i + 2 >= n {
                    return Err(AppError::Validation("Truncated LZ match token in compressed stream".to_string()));
                }
                let dist = ((input[i] as usize) << 8) | (input[i + 1] as usize);
                let match_len = input[i + 2] as usize;
                i += 3;

                if dist == 0 || dist > out.len() {
                    return Err(AppError::Validation(format!(
                        "Invalid back-reference distance {} (current buffer len {})",
                        dist,
                        out.len()
                    )));
                }

                for _ in 0..match_len {
                    let source_idx = out.len() - dist;
                    let copied_byte = out[source_idx];
                    out.push(copied_byte);
                }
            }
            other => {
                return Err(AppError::Validation(format!(
                    "Unrecognized escape tag 0x{:02X} in compressed stream",
                    other
                )));
            }
        }
    }

    Ok(out)
}

// Minimal, zero-dependency, constant-time Base64 encoder/decoder for binary payloads
const BASE64_ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

fn base64_encode(data: &[u8]) -> String {
    let mut result = String::with_capacity(data.len().div_ceil(3) * 4);
    let mut i = 0;
    while i < data.len() {
        let b0 = data[i] as u32;
        let b1 = if i + 1 < data.len() { data[i + 1] as u32 } else { 0 };
        let b2 = if i + 2 < data.len() { data[i + 2] as u32 } else { 0 };

        let triple = (b0 << 16) | (b1 << 8) | b2;

        result.push(BASE64_ALPHABET[((triple >> 18) & 0x3F) as usize] as char);
        result.push(BASE64_ALPHABET[((triple >> 12) & 0x3F) as usize] as char);

        if i + 1 < data.len() {
            result.push(BASE64_ALPHABET[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }

        if i + 2 < data.len() {
            result.push(BASE64_ALPHABET[(triple & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }

        i += 3;
    }
    result
}

fn base64_decode(input: &str) -> Result<Vec<u8>, &'static str> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }

    let mut lut = [255u8; 256];
    for (idx, &c) in BASE64_ALPHABET.iter().enumerate() {
        lut[c as usize] = idx as u8;
    }

    let bytes = trimmed.as_bytes();
    let mut result = Vec::with_capacity(bytes.len() * 3 / 4);

    let mut buf = 0u32;
    let mut bits = 0;

    for &b in bytes {
        if b == b'=' || b == b'\r' || b == b'\n' || b == b' ' {
            continue;
        }
        let val = lut[b as usize];
        if val == 255 {
            return Err("Invalid Base64 character");
        }
        buf = (buf << 6) | (val as u32);
        bits += 6;

        if bits >= 8 {
            bits -= 8;
            result.push(((buf >> bits) & 0xFF) as u8);
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rle_repeated_characters() {
        let text = "a".repeat(100);
        let res = compress_text(&text);
        assert!(res.is_compressed);
        assert!(res.data.len() < text.len());

        let restored = decompress_text(&res.data, res.is_compressed).unwrap();
        assert_eq!(restored, text);
    }

    #[test]
    fn test_lz_repeated_phrases() {
        let sentence = "The quick brown fox jumps over the lazy dog. ";
        let text = sentence.repeat(10);
        let res = compress_text(&text);
        assert!(res.is_compressed);
        assert!(res.data.len() < text.len());

        let restored = decompress_text(&res.data, res.is_compressed).unwrap();
        assert_eq!(restored, text);
    }

    #[test]
    fn test_unicode_and_indonesian_preservation() {
        let text = "Halo dunia! Ini adalah contoh teks latihan mengetik dengan bahasa Indonesia yang diulang-ulang. "
            .repeat(8);
        let res = compress_text(&text);
        assert!(res.is_compressed);

        let restored = decompress_text(&res.data, res.is_compressed).unwrap();
        assert_eq!(restored, text);
    }

    #[test]
    fn test_short_text_remains_raw() {
        let short_text = "Hello world";
        let res = compress_text(short_text);
        assert!(!res.is_compressed);
        assert_eq!(res.data, short_text);

        let restored = decompress_text(&res.data, res.is_compressed).unwrap();
        assert_eq!(restored, short_text);
    }

    #[test]
    fn test_base64_roundtrip() {
        let original = b"Binary \x00\xFF\xAA\x55 payload test with 12345";
        let encoded = base64_encode(original);
        let decoded = base64_decode(&encoded).unwrap();
        assert_eq!(decoded, original);
    }
}
