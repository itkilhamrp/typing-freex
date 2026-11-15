use std::path::Path;
use serde::{Deserialize, Serialize};

use crate::db::custom_text_repo::{self, CustomTextDetail};
use crate::db::manager::DatabaseManager;
use crate::error::{AppError, AppResult};
use super::reader::read_text_file;
use super::split::split_text;
use super::staging::{
    get_staged, reencode_staged, remove_staged, stage_text_bytes, ImportPickResult,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportFileResult {
    pub success: bool,
    pub path: String,
}

pub fn pick_and_stage(file_path: &str) -> AppResult<Option<ImportPickResult>> {
    let path = Path::new(file_path);
    let bytes = read_text_file(path)?;
    let filename = path
        .file_name()
        .and_then(|f| f.to_str())
        .unwrap_or("import.txt")
        .to_string();

    let res = stage_text_bytes(filename, bytes)?;
    Ok(Some(res))
}

pub fn reencode(staging_id: &str, encoding: &str) -> AppResult<ImportPickResult> {
    reencode_staged(staging_id, encoding)
}

pub fn commit_import(
    manager: &DatabaseManager,
    staging_id: &str,
    title: Option<String>,
    language: Option<String>,
    split_strategy: Option<String>,
) -> AppResult<Vec<CustomTextDetail>> {
    let staged = get_staged(staging_id)
        .ok_or_else(|| AppError::NotFound("Staged import expired or not found".to_string()))?;

    let base_title = title.unwrap_or(staged.filename);
    let strategy = split_strategy.unwrap_or_else(|| "none".to_string());
    let parts = split_text(&base_title, &staged.sanitized_text, &strategy, None);

    let mut committed = Vec::new();
    for part in parts {
        let detail = custom_text_repo::create(
            manager,
            part.title,
            part.body,
            language.clone(),
            Some("file_import".to_string()),
        )?;
        committed.push(detail);
    }

    remove_staged(staging_id);
    Ok(committed)
}

pub fn cancel_import(staging_id: &str) -> AppResult<()> {
    remove_staged(staging_id);
    Ok(())
}

pub fn export_text_body(manager: &DatabaseManager, id: &str) -> AppResult<String> {
    let detail = custom_text_repo::get(manager, id)?
        .ok_or_else(|| AppError::NotFound(format!("Text {} not found", id)))?;
    Ok(detail.body)
}

pub fn export_to_file(
    manager: &DatabaseManager,
    id: &str,
    destination_path: &str,
) -> AppResult<ExportFileResult> {
    let detail = custom_text_repo::get(manager, id)?
        .ok_or_else(|| AppError::NotFound(format!("Text {} not found", id)))?;

    // Normalize newlines to clean LF for standard cross-platform text files
    let clean_body = detail.body.replace("\r\n", "\n");

    if let Some(parent) = Path::new(destination_path).parent()
        && !parent.as_os_str().is_empty()
    {
        std::fs::create_dir_all(parent).map_err(|e| {
            AppError::Io(format!(
                "Failed to create parent directory for '{}': {}",
                destination_path, e
            ))
        })?;
    }

    std::fs::write(destination_path, clean_body.as_bytes()).map_err(|e| {
        AppError::Io(format!(
            "Failed to write file to '{}': {}",
            destination_path, e
        ))
    })?;

    Ok(ExportFileResult {
        success: true,
        path: destination_path.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    fn encode_utf16(text: &str, big_endian: bool) -> Vec<u8> {
        let mut bytes = if big_endian {
            vec![0xFE, 0xFF]
        } else {
            vec![0xFF, 0xFE]
        };
        for unit in text.encode_utf16() {
            let pair = if big_endian {
                unit.to_be_bytes()
            } else {
                unit.to_le_bytes()
            };
            bytes.extend_from_slice(&pair);
        }
        bytes
    }

    #[test]
    fn test_utf16le_and_utf16be_file_import_pipeline() {
        let dir = std::env::temp_dir().join(format!("tfrx_utf16_{}", Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let manager = DatabaseManager::new(dir.clone()).unwrap();

        for (label, big_endian, expected_enc) in [
            ("le", false, "UTF-16LE"),
            ("be", true, "UTF-16BE"),
        ] {
            let file_path = dir.join(format!("sample_{}.txt", label));
            let content = format!("Hello UTF-16 {} world!", label);
            let encoded = encode_utf16(&content, big_endian);
            std::fs::write(&file_path, encoded).unwrap();

            let staged = pick_and_stage(file_path.to_str().unwrap())
                .unwrap()
                .expect("staged result");
            assert_eq!(staged.detected_encoding, expected_enc);
            assert!(staged.preview_text.contains("Hello UTF-16"));

            let committed = commit_import(
                &manager,
                &staged.staging_id,
                Some(format!("UTF-16 {}", label)),
                Some("en".to_string()),
                None,
            )
            .unwrap();
            assert_eq!(committed.len(), 1);
            assert_eq!(committed[0].body, content);
        }

        let _ = std::fs::remove_dir_all(&dir);
    }
}
