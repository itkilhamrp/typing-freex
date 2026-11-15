use std::fs::{self, File};
use std::io::Read;
use std::path::Path;
use crate::error::{AppError, AppResult};
use super::sanitize::check_binary_rejection;

pub const MAX_TEXT_FILE_BYTES: u64 = 2 * 1024 * 1024; // 2 MiB cap (§4.8)

pub fn read_text_file(path: &Path) -> AppResult<Vec<u8>> {
    if !path.exists() || !path.is_file() {
        return Err(AppError::Validation("Target is not a valid regular file".to_string()));
    }

    let metadata = fs::metadata(path)
        .map_err(|e| AppError::Io(format!("Failed to read file metadata: {}", e)))?;

    if metadata.len() > MAX_TEXT_FILE_BYTES {
        return Err(AppError::Validation(format!(
            "File size ({} bytes) exceeds maximum text limit of 2 MiB",
            metadata.len()
        )));
    }

    let mut file = File::open(path)
        .map_err(|e| AppError::Io(format!("Failed to open file: {}", e)))?;

    let mut buffer = Vec::with_capacity(metadata.len() as usize);
    file.read_to_end(&mut buffer)
        .map_err(|e| AppError::Io(format!("Failed to read file contents: {}", e)))?;

    if !buffer.starts_with(&[0xFF, 0xFE]) && !buffer.starts_with(&[0xFE, 0xFF]) {
        check_binary_rejection(&buffer)?;
    }

    Ok(buffer)
}
