use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use super::encoding::{decode_with_encoding, detect_and_decode};
use super::sanitize::{sanitize_text, TextStats};

pub const STAGING_TTL: Duration = Duration::from_secs(300); // 5 minutes

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportPickResult {
    pub staging_id: String,
    pub filename: String,
    pub detected_encoding: String,
    pub preview_text: String,
    pub total_chars: usize,
    pub total_words: usize,
    pub issues: Vec<String>,
}

#[derive(Clone)]
pub struct StagedText {
    pub staging_id: String,
    pub raw_bytes: Vec<u8>,
    pub filename: String,
    pub encoding: String,
    pub sanitized_text: String,
    pub stats: TextStats,
    pub issues: Vec<String>,
    pub created_at: Instant,
}

static STAGED_TEXTS: Lazy<Arc<Mutex<HashMap<String, StagedText>>>> =
    Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

pub const MAX_STAGED_ENTRIES: usize = 32;

fn prune_expired() {
    let mut reg = STAGED_TEXTS.lock().unwrap_or_else(|e| e.into_inner());
    let now = Instant::now();
    reg.retain(|_, v| now.duration_since(v.created_at) <= STAGING_TTL);
}

pub fn stage_text_bytes(filename: String, raw_bytes: Vec<u8>) -> AppResult<ImportPickResult> {
    prune_expired();

    let decoded = detect_and_decode(&raw_bytes)?;
    let (sanitized, issues, stats) = sanitize_text(&decoded.text);

    let staging_id = Uuid::new_v4().to_string();
    let issue_codes: Vec<String> = issues.iter().map(|i| i.to_code()).collect();

    // Preview up to 2000 chars
    let preview_text: String = sanitized.chars().take(2000).collect();

    let staged = StagedText {
        staging_id: staging_id.clone(),
        raw_bytes,
        filename: filename.clone(),
        encoding: decoded.encoding.clone(),
        sanitized_text: sanitized,
        stats: stats.clone(),
        issues: issue_codes.clone(),
        created_at: Instant::now(),
    };

    let mut reg = STAGED_TEXTS.lock().unwrap_or_else(|e| e.into_inner());
    while reg.len() >= MAX_STAGED_ENTRIES {
        if let Some(oldest_key) = reg
            .iter()
            .min_by_key(|(_, v)| v.created_at)
            .map(|(k, _)| k.clone())
        {
            reg.remove(&oldest_key);
        } else {
            break;
        }
    }
    reg.insert(staging_id.clone(), staged);

    Ok(ImportPickResult {
        staging_id,
        filename,
        detected_encoding: decoded.encoding,
        preview_text,
        total_chars: stats.char_count,
        total_words: stats.word_count,
        issues: issue_codes,
    })
}

pub fn reencode_staged(staging_id: &str, encoding: &str) -> AppResult<ImportPickResult> {
    prune_expired();

    let mut reg = STAGED_TEXTS.lock().unwrap_or_else(|e| e.into_inner());
    let staged = reg
        .get_mut(staging_id)
        .ok_or_else(|| AppError::NotFound("Staged text import expired or not found".to_string()))?;

    let decoded = decode_with_encoding(&staged.raw_bytes, encoding)?;
    let (sanitized, issues, stats) = sanitize_text(&decoded.text);
    let issue_codes: Vec<String> = issues.iter().map(|i| i.to_code()).collect();
    let preview_text: String = sanitized.chars().take(2000).collect();

    staged.encoding = decoded.encoding.clone();
    staged.sanitized_text = sanitized;
    staged.stats = stats.clone();
    staged.issues = issue_codes.clone();
    staged.created_at = Instant::now();

    Ok(ImportPickResult {
        staging_id: staged.staging_id.clone(),
        filename: staged.filename.clone(),
        detected_encoding: decoded.encoding,
        preview_text,
        total_chars: stats.char_count,
        total_words: stats.word_count,
        issues: issue_codes,
    })
}

pub fn get_staged(staging_id: &str) -> Option<StagedText> {
    prune_expired();
    let reg = STAGED_TEXTS.lock().unwrap_or_else(|e| e.into_inner());
    reg.get(staging_id).cloned()
}

pub fn remove_staged(staging_id: &str) -> Option<StagedText> {
    let mut reg = STAGED_TEXTS.lock().unwrap_or_else(|e| e.into_inner());
    reg.remove(staging_id)
}
