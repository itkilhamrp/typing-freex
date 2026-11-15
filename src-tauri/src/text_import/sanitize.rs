use sha2::{Digest, Sha256};
use unicode_normalization::UnicodeNormalization;
use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TextStats {
    pub char_count: usize,
    pub word_count: usize,
    pub line_count: usize,
    pub sha256_hash: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TextIssue {
    UntypeableChar(char),
    SmartPunctuation,
    ExoticSpace,
    TabCharacter,
    MultipleSpaces,
    TrailingWhitespace,
    LongWord(String),
    ControlCharStripped,
}

impl TextIssue {
    pub fn to_code(&self) -> String {
        match self {
            TextIssue::UntypeableChar(c) => format!("UNTYPEABLE_CHAR:{}", c),
            TextIssue::SmartPunctuation => "SMART_PUNCTUATION".to_string(),
            TextIssue::ExoticSpace => "EXOTIC_SPACE".to_string(),
            TextIssue::TabCharacter => "TAB_CHARACTER".to_string(),
            TextIssue::MultipleSpaces => "MULTIPLE_SPACES".to_string(),
            TextIssue::TrailingWhitespace => "TRAILING_WHITESPACE".to_string(),
            TextIssue::LongWord(w) => format!("LONG_WORD:{}", w),
            TextIssue::ControlCharStripped => "CONTROL_CHAR".to_string(),
        }
    }
}

pub fn check_binary_rejection(raw: &[u8]) -> AppResult<()> {
    if raw.contains(&0) {
        return Err(AppError::Validation(
            "File contains NUL bytes and appears to be a binary file".to_string(),
        ));
    }

    // Check control character density
    let non_printable = raw
        .iter()
        .filter(|&&b| b < 32 && b != b'\n' && b != b'\r' && b != b'\t')
        .count();

    if !raw.is_empty() && (non_printable as f64 / raw.len() as f64) > 0.02 {
        return Err(AppError::Validation(
            "File contains high density of control characters and appears to be binary".to_string(),
        ));
    }

    Ok(())
}

pub fn sanitize_text(input: &str) -> (String, Vec<TextIssue>, TextStats) {
    let mut issues = Vec::new();
    let mut control_stripped = false;

    // 1. Line break normalization
    let normalized_nl = input.replace("\r\n", "\n").replace('\r', "\n");

    // 2. NFC normalization and character filtering
    let mut filtered = String::with_capacity(normalized_nl.len());

    for ch in normalized_nl.nfc() {
        // Strip bidi override control chars
        if ('\u{202A}'..='\u{202E}').contains(&ch)
            || ('\u{2066}'..='\u{2069}').contains(&ch)
            || ch == '\u{200E}'
            || ch == '\u{200F}'
        {
            control_stripped = true;
            continue;
        }

        // ASCII control chars except \n and \t
        if (ch as u32) < 32 && ch != '\n' && ch != '\t' {
            control_stripped = true;
            continue;
        }

        filtered.push(ch);
    }

    if control_stripped {
        issues.push(TextIssue::ControlCharStripped);
    }

    // 3. Issue detection
    let mut has_smart_punct = false;
    let mut has_exotic_space = false;
    let mut has_tab = false;

    for ch in filtered.chars() {
        if "“”‘’—–…".contains(ch) {
            has_smart_punct = true;
        }
        if ch == '\u{00A0}' || ch == '\u{200B}' || ch == '\u{FEFF}' {
            has_exotic_space = true;
        }
        if ch == '\t' {
            has_tab = true;
        }
    }

    if has_smart_punct {
        issues.push(TextIssue::SmartPunctuation);
    }
    if has_exotic_space {
        issues.push(TextIssue::ExoticSpace);
    }
    if has_tab {
        issues.push(TextIssue::TabCharacter);
    }

    if filtered.contains("  ") {
        issues.push(TextIssue::MultipleSpaces);
    }

    let mut has_trailing_ws = false;
    for line in filtered.lines() {
        if line.ends_with(' ') || line.ends_with('\t') {
            has_trailing_ws = true;
            break;
        }
    }
    if has_trailing_ws {
        issues.push(TextIssue::TrailingWhitespace);
    }

    // Check long words
    for word in filtered.split_whitespace() {
        if word.chars().count() > 30 {
            issues.push(TextIssue::LongWord(word.to_string()));
            break;
        }
    }

    // Compute stats
    let char_count = filtered.chars().count();
    let word_count = filtered.split_whitespace().count();
    let line_count = filtered.lines().count().max(1);

    let mut hasher = Sha256::new();
    hasher.update(filtered.as_bytes());
    let sha256_hash = format!("{:x}", hasher.finalize());

    let stats = TextStats {
        char_count,
        word_count,
        line_count,
        sha256_hash,
    };

    (filtered, issues, stats)
}

pub fn fix_safe_issues(text: &str) -> String {
    let mut s = text
        .replace('\u{FEFF}', "")
        .replace(['“', '”'], "\"")
        .replace(['‘', '’'], "'")
        .replace(['—', '–'], "-")
        .replace('…', "...")
        .replace('\u{00A0}', " ")
        .replace('\u{200B}', "")
        .replace('\t', "  ");

    // Clean trailing whitespace on lines
    let mut cleaned_lines = Vec::new();
    for line in s.lines() {
        cleaned_lines.push(line.trim_end());
    }
    s = cleaned_lines.join("\n");

    // Collapse multiple consecutive spaces (except newlines)
    while s.contains("  ") {
        s = s.replace("  ", " ");
    }

    s
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitization_and_stats() {
        let input = "Hello\r\nWorld!  This is a typing test.\u{202E}hidden";
        let (sanitized, issues, stats) = sanitize_text(input);

        assert_eq!(sanitized, "Hello\nWorld!  This is a typing test.hidden");
        assert!(issues.contains(&TextIssue::ControlCharStripped));
        assert!(issues.contains(&TextIssue::MultipleSpaces));
        assert_eq!(stats.line_count, 2);
        assert_eq!(stats.word_count, 7);
    }

    #[test]
    fn test_fix_safe_issues() {
        let input = "“Smart quotes” and ‘apostrophe’—dash\u{00A0}space";
        let fixed = fix_safe_issues(input);
        assert_eq!(fixed, "\"Smart quotes\" and 'apostrophe'-dash space");
    }

    #[test]
    fn test_binary_rejection() {
        let binary_data = vec![0x48, 0x65, 0x6C, 0x6C, 0x00, 0x6F];
        assert!(check_binary_rejection(&binary_data).is_err());
    }

    #[test]
    fn test_conformance_vectors() {
        let json_str = include_str!("../../../tests/vectors/text-tools/sanitization.json");
        let vectors: Vec<serde_json::Value> = serde_json::from_str(json_str).unwrap();

        for v in vectors {
            let input = v["input"].as_str().unwrap();
            let expected_sanitized = v["expected_sanitized"].as_str().unwrap();
            let (sanitized, _, _) = sanitize_text(input);
            assert_eq!(sanitized, expected_sanitized, "Failed on vector: {}", v["name"]);
        }
    }
}
