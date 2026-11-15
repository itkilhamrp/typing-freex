use unicode_normalization::UnicodeNormalization;
use serde::{Deserialize, Serialize};
use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileDto {
    pub uuid: String,
    pub name: String,
    pub slug: String,
    pub created_at: String,
    pub last_active_at: String,
    pub is_active: bool,
}

pub fn validate_display_name(raw: &str) -> Result<String, AppError> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err(AppError::Validation("Profile name cannot be empty".to_string()));
    }

    // Unicode NFC normalization
    let nfc: String = trimmed.nfc().collect();

    // Check character length (1 to 32 characters)
    let char_count = nfc.chars().count();
    if !(1..=32).contains(&char_count) {
        return Err(AppError::Validation(format!(
            "Profile name length must be between 1 and 32 characters (got {})",
            char_count
        )));
    }

    // Must not contain control characters
    for ch in nfc.chars() {
        if ch.is_control() {
            return Err(AppError::Validation("Profile name cannot contain control characters".to_string()));
        }
    }

    Ok(nfc)
}

pub fn generate_slug(name: &str) -> Result<String, AppError> {
    let validated = validate_display_name(name)?;
    // NFKD decomposition to fold diacritics into base ASCII where possible
    let nfkd: String = validated.nfkd().collect();

    let mut slug = String::new();
    let mut prev_dash = false;

    for ch in nfkd.chars() {
        if ch.is_ascii_alphanumeric() {
            slug.push(ch.to_ascii_lowercase());
            prev_dash = false;
        } else if (ch == ' ' || ch == '-' || ch == '_') && !prev_dash && !slug.is_empty() {
            slug.push('-');
            prev_dash = true;
        }
    }

    // Trim trailing dash
    while slug.ends_with('-') {
        slug.pop();
    }

    if slug.is_empty() {
        slug = "profile".to_string();
    }

    // Cap at 32 chars
    if slug.len() > 32 {
        slug.truncate(32);
        while slug.ends_with('-') {
            slug.pop();
        }
    }

    Ok(slug)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_display_name() {
        assert_eq!(validate_display_name("  John Doe  ").unwrap(), "John Doe");
        assert!(validate_display_name("").is_err());
        assert!(validate_display_name("   ").is_err());
        assert!(validate_display_name(&"a".repeat(33)).is_err());
        assert!(validate_display_name("Hello\0World").is_err());
        assert!(validate_display_name("Hello\nWorld").is_err());
    }

    #[test]
    fn test_generate_slug() {
        assert_eq!(generate_slug("John Doe").unwrap(), "john-doe");
        assert_eq!(generate_slug("Café Racer").unwrap(), "cafe-racer");
        assert_eq!(generate_slug("---A---B---").unwrap(), "a-b");
        assert_eq!(generate_slug("!!!").unwrap(), "profile");
    }
}
