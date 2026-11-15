use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
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

#[derive(Debug, Serialize, Clone)]
struct OutputQuote {
    pub id: String,
    pub text: String,
    pub source: String,
    pub length: usize,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
struct QuoteManifestEntry {
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

#[derive(Debug, Deserialize)]
struct RawWordlistPack {
    pub id: String,
    #[serde(default)]
    pub items: Option<Vec<String>>,
    #[serde(default)]
    pub packed: Option<String>,
}

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

fn build_bundle_for_entry(lang_dir: &Path, specific_file: Option<&str>, lang_code: &str) -> Vec<OutputQuote> {
    let mut files = Vec::new();
    collect_json_files(lang_dir, &mut files);
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
                let id = item.id.unwrap_or_else(|| format!("{}-{}", lang_code, quotes.len()));
                quotes.push(OutputQuote {
                    id,
                    text,
                    source,
                    length,
                });
            }
        }
    }
    quotes
}

fn decode_pack_words(pack: &RawWordlistPack) -> Vec<String> {
    if let Some(ref packed) = pack.packed {
        packed
            .lines()
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
            .collect()
    } else if let Some(ref items) = pack.items {
        items.clone()
    } else {
        Vec::new()
    }
}

fn build_wordlists_bundle(languages_dir: &Path) -> HashMap<String, Vec<String>> {
    let mut map = HashMap::new();
    let mut files = Vec::new();
    collect_json_files(languages_dir, &mut files);

    for file in files {
        if file.file_name().and_then(|s| s.to_str()) == Some("_list.json") {
            continue;
        }
        if let Ok(content) = fs::read_to_string(&file)
            && let Ok(pack) = serde_json::from_str::<RawWordlistPack>(&content)
        {
            let words = decode_pack_words(&pack);
            map.insert(pack.id.clone(), words);
        }
    }

    // Insert legacy aliases for backwards compatibility
    if let Some(en_words) = map.get("english_1k").cloned() {
        map.insert("en".to_string(), en_words);
    }
    if let Some(id_words) = map.get("indonesian_1k").cloned() {
        map.insert("id".to_string(), id_words);
    }

    map
}

fn main() {
    println!("cargo:rerun-if-changed=../content-packs/quotes");
    println!("cargo:rerun-if-changed=../content-packs/wordlists");

    let out_dir = env::var("OUT_DIR").unwrap();

    // 1. Quotes bundles driven by _list.json
    let base_quotes_dir = Path::new("../content-packs/quotes");
    let quotes_manifest_path = base_quotes_dir.join("_list.json");

    let quotes_manifest_content = if quotes_manifest_path.exists() {
        fs::read_to_string(&quotes_manifest_path).unwrap_or_else(|_| "[]".to_string())
    } else {
        "[]".to_string()
    };
    fs::write(
        Path::new(&out_dir).join("quotes_manifest.json"),
        &quotes_manifest_content,
    )
    .unwrap();

    let manifest_entries: Vec<QuoteManifestEntry> =
        serde_json::from_str(&quotes_manifest_content).unwrap_or_default();

    let mut quotes_bundle_map: HashMap<String, Vec<OutputQuote>> = HashMap::new();

    for entry in &manifest_entries {
        let lang_dir = base_quotes_dir.join(&entry.folder);
        let quotes = build_bundle_for_entry(&lang_dir, entry.file.as_deref(), &entry.code.to_lowercase());

        // Index by code
        quotes_bundle_map.insert(entry.code.to_lowercase(), quotes.clone());
        if entry.file.is_none() {
            quotes_bundle_map.insert(entry.folder.to_lowercase(), quotes.clone());
        }

        for alias in &entry.aliases {
            quotes_bundle_map.insert(alias.to_lowercase(), quotes.clone());
        }

        // Backward compatibility individual files
        if entry.code == "english" {
            let en_json = serde_json::to_string(&quotes).unwrap();
            fs::write(Path::new(&out_dir).join("en_quotes_bundle.json"), en_json).unwrap();
        } else if entry.code == "indonesian" {
            let id_json = serde_json::to_string(&quotes).unwrap();
            fs::write(Path::new(&out_dir).join("id_quotes_bundle.json"), id_json).unwrap();
        }
    }

    let quotes_bundle_json = serde_json::to_string(&quotes_bundle_map).unwrap();
    fs::write(
        Path::new(&out_dir).join("quotes_bundle.json"),
        quotes_bundle_json,
    )
    .unwrap();

    // 2. Languages manifest & wordlists bundle
    let languages_dir = Path::new("../content-packs/wordlists/languages");
    let manifest_path = languages_dir.join("_list.json");

    let manifest_content = if manifest_path.exists() {
        fs::read_to_string(&manifest_path).unwrap_or_else(|_| "[]".to_string())
    } else {
        "[]".to_string()
    };
    fs::write(
        Path::new(&out_dir).join("languages_manifest.json"),
        manifest_content,
    )
    .unwrap();

    let wordlists_map = build_wordlists_bundle(languages_dir);
    let wordlists_json = serde_json::to_string(&wordlists_map).unwrap();
    fs::write(
        Path::new(&out_dir).join("wordlists_bundle.json"),
        wordlists_json,
    )
    .unwrap();

    tauri_build::build()
}
