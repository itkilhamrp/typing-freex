use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanguageInfo {
    pub code: String,
    pub name: String,
    pub wordlist_available: bool,
    pub quotes_available: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuoteItem {
    pub id: String,
    pub text: String,
    pub source: String,
    pub length: usize,
}

#[derive(Debug, Deserialize)]
struct WordlistPack {
    items: Option<Vec<String>>,
    packed: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RawQuote {
    pub text: String,
    pub source: String,
    #[serde(default)]
    pub id: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum QuoteFileContent {
    Array(Vec<RawQuote>),
    Object { items: Vec<RawQuote> },
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct WordlistVariantDef {
    pub id: String,
    pub name: String,
    pub size: usize,
    pub file: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LanguageManifestEntry {
    pub code: String,
    pub name: String,
    #[serde(rename = "nativeName", default)]
    pub native_name: String,
    #[serde(default)]
    pub flag: String,
    #[serde(default)]
    pub variants: Vec<WordlistVariantDef>,
    #[serde(default)]
    pub default: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct QuoteManifestEntry {
    pub code: String,
    pub folder: String,
    pub name: String,
    #[serde(rename = "nativeName", default)]
    pub native_name: String,
    #[serde(default)]
    pub flag: String,
    #[serde(default)]
    pub aliases: Vec<String>,
    #[serde(default)]
    pub file: Option<String>,
}

const LANGUAGES_MANIFEST_BUNDLE: &str = include_str!(concat!(env!("OUT_DIR"), "/languages_manifest.json"));
const WORDLISTS_BUNDLE: &str = include_str!(concat!(env!("OUT_DIR"), "/wordlists_bundle.json"));
const QUOTES_MANIFEST_BUNDLE: &str = include_str!(concat!(env!("OUT_DIR"), "/quotes_manifest.json"));
const QUOTES_BUNDLE: &str = include_str!(concat!(env!("OUT_DIR"), "/quotes_bundle.json"));

static CACHED_LANGUAGES_MANIFEST: once_cell::sync::Lazy<Vec<LanguageManifestEntry>> =
    once_cell::sync::Lazy::new(|| {
        serde_json::from_str(LANGUAGES_MANIFEST_BUNDLE).unwrap_or_default()
    });

static CACHED_QUOTES_MANIFEST: once_cell::sync::Lazy<Vec<QuoteManifestEntry>> =
    once_cell::sync::Lazy::new(|| {
        serde_json::from_str(QUOTES_MANIFEST_BUNDLE).unwrap_or_default()
    });

static CACHED_WORDLISTS_BUNDLE: once_cell::sync::Lazy<HashMap<String, Vec<String>>> =
    once_cell::sync::Lazy::new(|| serde_json::from_str(WORDLISTS_BUNDLE).unwrap_or_default());

static CACHED_QUOTES_BUNDLE: once_cell::sync::Lazy<HashMap<String, Vec<QuoteItem>>> =
    once_cell::sync::Lazy::new(|| serde_json::from_str(QUOTES_BUNDLE).unwrap_or_default());

fn collect_json_files(dir: &Path, files: &mut Vec<PathBuf>) {
    if let Ok(entries) = fs::read_dir(dir) {
        let mut sorted_entries: Vec<_> = entries.flatten().collect();
        sorted_entries.sort_by_key(|e| e.path());
        for entry in sorted_entries {
            let path = entry.path();
            if path.is_dir() {
                collect_json_files(&path, files);
            } else if path.extension().and_then(|s| s.to_str()) == Some("json") {
                files.push(path);
            }
        }
    }
}

fn load_quotes_from_dir(dir: &Path, lang: &str, specific_file: Option<&str>) -> Option<Vec<QuoteItem>> {
    if !dir.exists() || !dir.is_dir() {
        return None;
    }
    let mut files = Vec::new();
    collect_json_files(dir, &mut files);
    if files.is_empty() {
        return None;
    }
    files.sort();

    let mut quotes = Vec::new();
    for file in files {
        if let Some(target) = specific_file
            && file.file_name().and_then(|s| s.to_str()) != Some(target)
        {
            continue;
        }
        if let Ok(content) = fs::read_to_string(&file) {
            let items: Vec<RawQuote> = match serde_json::from_str::<QuoteFileContent>(&content) {
                Ok(QuoteFileContent::Array(arr)) => arr,
                Ok(QuoteFileContent::Object { items }) => items,
                Err(_) => continue,
            };

            for item in items {
                let text = item.text.trim().to_string();
                let source = item.source.trim().to_string();
                if text.is_empty() || source.is_empty() {
                    continue;
                }
                let length = text.chars().count();
                let id = item.id.unwrap_or_else(|| format!("{}-{}", lang, quotes.len()));
                quotes.push(QuoteItem {
                    id,
                    text,
                    source,
                    length,
                });
            }
        }
    }
    if quotes.is_empty() {
        None
    } else {
        Some(quotes)
    }
}

fn load_quotes_manifest() -> Vec<QuoteManifestEntry> {
    let candidate_paths = [
        "content-packs/quotes/_list.json",
        "../content-packs/quotes/_list.json",
        "../../content-packs/quotes/_list.json",
    ];

    for candidate in &candidate_paths {
        if let Ok(content) = fs::read_to_string(candidate)
            && let Ok(manifest) = serde_json::from_str::<Vec<QuoteManifestEntry>>(&content)
        {
            return manifest;
        }
    }

    CACHED_QUOTES_MANIFEST.clone()
}

fn get_quotes_for_lang(language: &str) -> Vec<QuoteItem> {
    let normalized = language.trim().to_lowercase();
    let manifest = load_quotes_manifest();

    // 1. Find entry matching code, folder, or aliases
    let mut resolved_folder: Option<String> = None;
    let mut resolved_code: Option<String> = None;
    let mut resolved_file: Option<String> = None;

    for entry in &manifest {
        if entry.code.to_lowercase() == normalized
            || (entry.file.is_none() && entry.folder.to_lowercase() == normalized)
            || entry.aliases.iter().any(|a| a.to_lowercase() == normalized)
        {
            resolved_folder = Some(entry.folder.clone());
            resolved_code = Some(entry.code.clone());
            resolved_file = entry.file.clone();
            break;
        }
    }

    // 2. Try loading directly from disk if resolved
    if let Some(folder) = resolved_folder {
        let candidate_paths = [
            format!("content-packs/quotes/{}", folder),
            format!("../content-packs/quotes/{}", folder),
            format!("../../content-packs/quotes/{}", folder),
        ];

        for candidate in &candidate_paths {
            let p = Path::new(candidate);
            if let Some(quotes) = load_quotes_from_dir(p, resolved_code.as_deref().unwrap_or("quote"), resolved_file.as_deref()) {
                return quotes;
            }
        }
    }

    // 3. Fallback to cached embedded quotes bundle map
    let bundle_map = &*CACHED_QUOTES_BUNDLE;

    if let Some(quotes) = bundle_map.get(&normalized) {
        return quotes.clone();
    }
    if let Some(ref code) = resolved_code
        && let Some(quotes) = bundle_map.get(&code.to_lowercase())
    {
        return quotes.clone();
    }

    if let Some(quotes) = bundle_map.get("english") {
        return quotes.clone();
    }

    Vec::new()
}

fn load_languages_manifest() -> Vec<LanguageManifestEntry> {
    let candidate_paths = [
        "content-packs/wordlists/languages/_list.json",
        "../content-packs/wordlists/languages/_list.json",
        "../../content-packs/wordlists/languages/_list.json",
    ];

    for candidate in &candidate_paths {
        if let Ok(content) = fs::read_to_string(candidate)
            && let Ok(entries) = serde_json::from_str::<Vec<LanguageManifestEntry>>(&content)
        {
            return entries;
        }
    }

    CACHED_LANGUAGES_MANIFEST.clone()
}

fn content_list_languages_internal() -> AppResult<Vec<LanguageInfo>> {
    let manifest = load_languages_manifest();
    let quotes_manifest = load_quotes_manifest();
    let languages = manifest
        .into_iter()
        .map(|entry| {
            let has_quotes = quotes_manifest.iter().any(|q| {
                q.code.eq_ignore_ascii_case(&entry.code)
                    || q.aliases
                        .iter()
                        .any(|a| a.eq_ignore_ascii_case(&entry.code))
            });
            LanguageInfo {
                code: entry.code,
                name: entry.name,
                wordlist_available: !entry.variants.is_empty(),
                quotes_available: has_quotes,
            }
        })
        .collect();

    Ok(languages)
}

#[tauri::command]
pub async fn content_list_languages() -> AppResult<Vec<LanguageInfo>> {
    tauri::async_runtime::spawn_blocking(content_list_languages_internal)
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn content_get_wordlist(
    language: String,
    tier: Option<String>,
) -> AppResult<Vec<String>> {
    tauri::async_runtime::spawn_blocking(move || content_get_wordlist_internal(language, tier))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

fn content_get_wordlist_internal(language: String, tier: Option<String>) -> AppResult<Vec<String>> {
    let normalized = language.trim().to_lowercase();
    let tier_norm = tier
        .as_deref()
        .map(|t| t.trim().to_lowercase())
        .filter(|t| !t.is_empty());
    let manifest = load_languages_manifest();

    // 1. Resolve target file from manifest (respecting optional tier variant)
    let mut resolved_folder: Option<String> = None;
    let mut resolved_filename: Option<String> = None;

    for lang in &manifest {
        if lang.code.to_lowercase() == normalized {
            resolved_folder = Some(lang.code.clone());
            if let Some(ref t) = tier_norm
                && let Some(v) = lang.variants.iter().find(|v| {
                    v.id.to_lowercase() == *t
                        || v.id.to_lowercase() == format!("{}_{}", normalized, t)
                        || v.name.to_lowercase() == *t
                })
            {
                resolved_filename = Some(v.file.clone());
            }
            if resolved_filename.is_none() {
                if let Some(v) = lang.variants.iter().find(|v| v.id == lang.default) {
                    resolved_filename = Some(v.file.clone());
                } else if let Some(first) = lang.variants.first() {
                    resolved_filename = Some(first.file.clone());
                }
            }
            break;
        }

        for v in &lang.variants {
            if v.id.to_lowercase() == normalized {
                resolved_folder = Some(lang.code.clone());
                resolved_filename = Some(v.file.clone());
                break;
            }
        }
        if resolved_filename.is_some() {
            break;
        }
    }

    // 2. Try loading directly from disk if resolved
    if let (Some(folder), Some(file)) = (resolved_folder, resolved_filename) {
        let candidate_paths = [
            format!("content-packs/wordlists/languages/{}/{}", folder, file),
            format!("../content-packs/wordlists/languages/{}/{}", folder, file),
            format!("../../content-packs/wordlists/languages/{}/{}", folder, file),
        ];

        for p in &candidate_paths {
            if let Ok(content) = fs::read_to_string(p)
                && let Ok(pack) = serde_json::from_str::<WordlistPack>(&content)
            {
                if let Some(packed) = pack.packed {
                    return Ok(packed
                        .lines()
                        .map(|s| s.trim())
                        .filter(|s| !s.is_empty())
                        .map(|s| s.to_string())
                        .collect());
                } else if let Some(items) = pack.items {
                    return Ok(items);
                }
            }
        }
    }

    // 3. Fallback to cached embedded bundle map
    let bundle_map = &*CACHED_WORDLISTS_BUNDLE;

    if let Some(ref t) = tier_norm
        && let Some(words) = bundle_map
            .get(t)
            .or_else(|| bundle_map.get(&format!("{}_{}", normalized, t)))
    {
        return Ok(words.clone());
    }

    if let Some(words) = bundle_map.get(&normalized) {
        return Ok(words.clone());
    }

    // Legacy short-code aliases
    if normalized == "en"
        && let Some(words) = bundle_map.get("english_1k").or_else(|| bundle_map.get("english"))
    {
        return Ok(words.clone());
    }
    if normalized == "id"
        && let Some(words) = bundle_map.get("indonesian_1k").or_else(|| bundle_map.get("indonesian"))
    {
        return Ok(words.clone());
    }

    // Final fallback
    if let Some(words) = bundle_map.get("english_1k").or_else(|| bundle_map.get("english")) {
        return Ok(words.clone());
    }

    Ok(vec![])
}

#[tauri::command]
pub async fn content_get_quotes(
    language: String,
    length: Option<String>,
) -> AppResult<Vec<QuoteItem>> {
    tauri::async_runtime::spawn_blocking(move || content_get_quotes_internal(language, length))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

fn content_get_quotes_internal(language: String, length: Option<String>) -> AppResult<Vec<QuoteItem>> {
    let quotes = get_quotes_for_lang(&language);

    let items = if let Some(filter) = length {
        if filter.is_empty() || filter == "all" {
            quotes
        } else {
            quotes
                .into_iter()
                .filter(|q| match filter.as_str() {
                    "short" => q.length <= 100,
                    "medium" => q.length > 100 && q.length <= 250,
                    "long" => q.length > 250 && q.length <= 600,
                    "thicc" => q.length > 600,
                    _ => true,
                })
                .collect()
        }
    } else {
        quotes
    };

    Ok(items)
}
