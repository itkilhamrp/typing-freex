use encoding_rs::{Encoding, ISO_8859_15, WINDOWS_1252, UTF_8};
use crate::error::{AppError, AppResult};

#[derive(Debug, Clone)]
pub struct DecodedText {
    pub text: String,
    pub encoding: String,
    pub had_replacements: bool,
}

fn reject_decoded_nul(text: &str) -> AppResult<()> {
    if text.contains('\0') {
        return Err(AppError::Validation(
            "File contains NUL bytes and appears to be a binary file".to_string(),
        ));
    }
    Ok(())
}

pub fn detect_and_decode(raw: &[u8]) -> AppResult<DecodedText> {
    // 1. Check for BOM
    if raw.starts_with(&[0xEF, 0xBB, 0xBF]) {
        let (cow, _, had_errors) = UTF_8.decode(&raw[3..]);
        let text = cow.into_owned();
        reject_decoded_nul(&text)?;
        return Ok(DecodedText {
            text,
            encoding: "UTF-8 (BOM)".to_string(),
            had_replacements: had_errors,
        });
    }

    if raw.starts_with(&[0xFF, 0xFE]) {
        let (cow, _, had_errors) = encoding_rs::UTF_16LE.decode(&raw[2..]);
        let text = cow.into_owned();
        reject_decoded_nul(&text)?;
        return Ok(DecodedText {
            text,
            encoding: "UTF-16LE".to_string(),
            had_replacements: had_errors,
        });
    }

    if raw.starts_with(&[0xFE, 0xFF]) {
        let (cow, _, had_errors) = encoding_rs::UTF_16BE.decode(&raw[2..]);
        let text = cow.into_owned();
        reject_decoded_nul(&text)?;
        return Ok(DecodedText {
            text,
            encoding: "UTF-16BE".to_string(),
            had_replacements: had_errors,
        });
    }

    // 2. Strict UTF-8 validation
    match std::str::from_utf8(raw) {
        Ok(valid_str) => {
            reject_decoded_nul(valid_str)?;
            Ok(DecodedText {
                text: valid_str.to_string(),
                encoding: "UTF-8".to_string(),
                had_replacements: false,
            })
        }
        Err(_) => {
            // 3. Fallback to Windows-1252 (Latin-1 superset)
            let (cow, _, had_errors) = WINDOWS_1252.decode(raw);
            let text = cow.into_owned();
            reject_decoded_nul(&text)?;
            Ok(DecodedText {
                text,
                encoding: "Windows-1252".to_string(),
                had_replacements: had_errors,
            })
        }
    }
}

pub fn decode_with_encoding(raw: &[u8], encoding_label: &str) -> AppResult<DecodedText> {
    let enc: &'static Encoding = match encoding_label.to_lowercase().as_str() {
        "utf-8" | "utf8" => UTF_8,
        "windows-1252" | "cp1252" | "iso-8859-1" => WINDOWS_1252,
        "iso-8859-15" => ISO_8859_15,
        "utf-16le" => encoding_rs::UTF_16LE,
        "utf-16be" => encoding_rs::UTF_16BE,
        _ => {
            return Err(AppError::Validation(format!(
                "Unsupported encoding '{}'",
                encoding_label
            )));
        }
    };

    let (cow, _, had_errors) = enc.decode(raw);
    let text = cow.into_owned();
    reject_decoded_nul(&text)?;
    Ok(DecodedText {
        text,
        encoding: enc.name().to_string(),
        had_replacements: had_errors,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_utf8_detection() {
        let text = "Hello world typing test!";
        let decoded = detect_and_decode(text.as_bytes()).unwrap();
        assert_eq!(decoded.encoding, "UTF-8");
        assert_eq!(decoded.text, text);
    }

    #[test]
    fn test_utf8_bom_detection() {
        let mut bytes = vec![0xEF, 0xBB, 0xBF];
        bytes.extend_from_slice("With BOM".as_bytes());
        let decoded = detect_and_decode(&bytes).unwrap();
        assert_eq!(decoded.encoding, "UTF-8 (BOM)");
        assert_eq!(decoded.text, "With BOM");
    }

    #[test]
    fn test_windows_1252_fallback() {
        // 0x93 and 0x94 are smart quotes in windows-1252 (invalid in raw utf-8)
        let bytes = vec![0x93, b'H', b'i', 0x94];
        let decoded = detect_and_decode(&bytes).unwrap();
        assert_eq!(decoded.encoding, "Windows-1252");
    }
}
