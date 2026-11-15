use crate::error::AppError;

pub const ALLOWED_SETTING_KEYS: &[&str] = &[
    "ui.theme",
    "ui.locale",
    "test.target_language",
    "test.quote_language",
    "test.speed_unit",
    "test.caret_style",
    "test.backspace_through_words",
    "test.strict_space",
    "test.forgiving_accuracy",
    "test.stop_on_error",
    "test.blur_behavior",
    "ui.hand_guide.enabled",
    "ui.hand_guide.highlight_target",
    "ui.hand_guide.size",
    "ui.sidebar_collapsed",
    "app.first_run_done",
    "test.font_size",
    "test.visible_lines",
    "test.arena_width",
    "test.smooth_caret",
    "test.highlight_active_word",
    "test.show_live_stats",
    "history.filter.enabled",
    "history.filter.min_speed",
    "history.filter.min_accuracy",
    "sound.enabled",
    "sound.click_pack",
    "sound.error_pack",
    "sound.volume",
    "sound.warning_seconds",
];

fn validate_warning_seconds(value: &str) -> Result<(), AppError> {
    if !["1", "3", "5", "10"].contains(&value) {
        return Err(AppError::Validation(format!(
            "Invalid sound.warning_seconds value '{}'. Must be 1, 3, 5, or 10.",
            value
        )));
    }
    Ok(())
}

pub fn validate_setting(key: &str, value: &str) -> Result<(), AppError> {
    if !ALLOWED_SETTING_KEYS.contains(&key) {
        return Err(AppError::Validation(format!(
            "Setting key '{}' is not recognized or allowed",
            key
        )));
    }

    match key {
        "ui.theme" => {
            if !["system", "light", "dark"].contains(&value) {
                return Err(AppError::Validation(format!(
                    "Invalid ui.theme value '{}'. Must be system, light, or dark.",
                    value
                )));
            }
        }
        "ui.locale" => {
            if !["en", "id"].contains(&value) {
                return Err(AppError::Validation(format!(
                    "Invalid {} value '{}'. Supported: en, id.",
                    key, value
                )));
            }
        }
        "test.target_language" | "test.quote_language" => {
            let valid_len = (2..=32).contains(&value.len());
            let valid_chars = value
                .chars()
                .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_' || c == '-');
            if !valid_len || !valid_chars {
                return Err(AppError::Validation(format!(
                    "Invalid {} value '{}'. Must be 2-32 lowercase alphanumeric/underscore/hyphen characters.",
                    key, value
                )));
            }
        }
        "test.speed_unit" => {
            if !["wpm", "cpm"].contains(&value) {
                return Err(AppError::Validation(format!(
                    "Invalid test.speed_unit value '{}'. Must be wpm or cpm.",
                    value
                )));
            }
        }
        "test.caret_style" => {
            if !["line", "block", "underline", "outline"].contains(&value) {
                return Err(AppError::Validation(format!(
                    "Invalid test.caret_style value '{}'.",
                    value
                )));
            }
        }
        "test.backspace_through_words"
        | "test.strict_space"
        | "test.forgiving_accuracy"
        | "ui.hand_guide.enabled"
        | "ui.hand_guide.highlight_target"
        | "ui.sidebar_collapsed"
        | "app.first_run_done"
        | "test.smooth_caret"
        | "test.highlight_active_word"
        | "test.show_live_stats"
        | "history.filter.enabled" => {
            if !["true", "false"].contains(&value) {
                return Err(AppError::Validation(format!(
                    "Invalid boolean value '{}' for key '{}'",
                    value, key
                )));
            }
        }
        "history.filter.min_speed" => {
            match value.parse::<f64>() {
                Ok(n) if (0.0..=300.0).contains(&n) => {}
                _ => {
                    return Err(AppError::Validation(format!(
                        "Invalid history.filter.min_speed value '{}'. Must be a number between 0 and 300.",
                        value
                    )));
                }
            }
        }
        "history.filter.min_accuracy" => {
            match value.parse::<f64>() {
                Ok(n) if (0.0..=100.0).contains(&n) => {}
                _ => {
                    return Err(AppError::Validation(format!(
                        "Invalid history.filter.min_accuracy value '{}'. Must be a number between 0 and 100.",
                        value
                    )));
                }
            }
        }
        "test.stop_on_error" => {
            if !["off", "word", "letter"].contains(&value) {
                return Err(AppError::Validation(format!(
                    "Invalid test.stop_on_error value '{}'.",
                    value
                )));
            }
        }
        "test.blur_behavior" => {
            if !["pause", "continue", "cancel", "off"].contains(&value) {
                return Err(AppError::Validation(format!(
                    "Invalid test.blur_behavior value '{}'.",
                    value
                )));
            }
        }
        "ui.hand_guide.size" => {
            if !["auto", "small", "medium", "large"].contains(&value) {
                return Err(AppError::Validation(format!(
                    "Invalid ui.hand_guide.size value '{}'.",
                    value
                )));
            }
        }
        "test.font_size" => {
            if !["xs", "sm", "md", "lg", "xl"].contains(&value) {
                return Err(AppError::Validation(format!(
                    "Invalid test.font_size value '{}'.",
                    value
                )));
            }
        }
        "test.visible_lines" => {
            match value.parse::<u32>() {
                Ok(n) if (1..=5).contains(&n) => {}
                _ => {
                    return Err(AppError::Validation(format!(
                        "Invalid test.visible_lines value '{}'. Must be an integer between 1 and 5.",
                        value
                    )));
                }
            }
        }
        "test.arena_width" => {
            if !["sm", "md", "lg", "xl"].contains(&value) {
                return Err(AppError::Validation(format!(
                    "Invalid test.arena_width value '{}'.",
                    value
                )));
            }
        }
        "sound.enabled" => {
            if !["true", "false"].contains(&value) {
                return Err(AppError::Validation(format!(
                    "Invalid boolean value '{}' for key '{}'",
                    value, key
                )));
            }
        }
        "sound.volume" => {
            match value.parse::<f64>() {
                Ok(n) if (0.0..=2.0).contains(&n) => {}
                _ => {
                    return Err(AppError::Validation(format!(
                        "Invalid sound.volume value '{}'. Must be a number between 0 and 2.0.",
                        value
                    )));
                }
            }
        }
        "sound.click_pack" | "sound.error_pack" => {
            if value.trim().is_empty() || value.len() > 64 {
                return Err(AppError::Validation(format!(
                    "Invalid {} value '{}'.",
                    key, value
                )));
            }
        }
        "sound.warning_seconds" => validate_warning_seconds(value)?,
        _ => {}
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_setting_validation() {
        assert!(validate_setting("ui.theme", "dark").is_ok());
        assert!(validate_setting("ui.theme", "neon").is_err());
        assert!(validate_setting("test.speed_unit", "cpm").is_ok());
        assert!(validate_setting("test.speed_unit", "mph").is_err());
        assert!(validate_setting("test.target_language", "id").is_ok());
        assert!(validate_setting("test.target_language", "en").is_ok());
        assert!(validate_setting("test.target_language", "fr").is_ok());
        assert!(validate_setting("test.target_language", "invalid lang!").is_err());
        assert!(validate_setting("ui.locale", "fr").is_err());
        assert!(validate_setting("test.forgiving_accuracy", "true").is_ok());
        assert!(validate_setting("test.forgiving_accuracy", "false").is_ok());
        assert!(validate_setting("test.forgiving_accuracy", "invalid").is_err());
        assert!(validate_setting("ui.sidebar_collapsed", "true").is_ok());
        assert!(validate_setting("test.font_size", "md").is_ok());
        assert!(validate_setting("test.font_size", "2xl").is_err());
        assert!(validate_setting("test.visible_lines", "3").is_ok());
        assert!(validate_setting("test.visible_lines", "5").is_ok());
        assert!(validate_setting("test.visible_lines", "6").is_err());
        assert!(validate_setting("test.arena_width", "lg").is_ok());
        assert!(validate_setting("test.arena_width", "fluid").is_err());
        assert!(validate_setting("test.smooth_caret", "true").is_ok());
        assert!(validate_setting("test.highlight_active_word", "false").is_ok());
        assert!(validate_setting("test.show_live_stats", "true").is_ok());
        assert!(validate_setting("test.quote_language", "en").is_ok());
        assert!(validate_setting("history.filter.enabled", "true").is_ok());
        assert!(validate_setting("history.filter.enabled", "false").is_ok());
        assert!(validate_setting("history.filter.enabled", "invalid").is_err());
        assert!(validate_setting("history.filter.min_speed", "0").is_ok());
        assert!(validate_setting("history.filter.min_speed", "120.5").is_ok());
        assert!(validate_setting("history.filter.min_speed", "300").is_ok());
        assert!(validate_setting("history.filter.min_speed", "301").is_err());
        assert!(validate_setting("history.filter.min_speed", "-1").is_err());
        assert!(validate_setting("history.filter.min_accuracy", "0").is_ok());
        assert!(validate_setting("history.filter.min_accuracy", "95.5").is_ok());
        assert!(validate_setting("history.filter.min_accuracy", "100").is_ok());
        assert!(validate_setting("history.filter.min_accuracy", "101").is_err());
        assert!(validate_setting("history.filter.min_accuracy", "-5").is_err());
        assert!(validate_setting("sound.volume", "0.0").is_ok());
        assert!(validate_setting("sound.volume", "1.5").is_ok());
        assert!(validate_setting("sound.volume", "2.0").is_ok());
        assert!(validate_setting("sound.volume", "2.1").is_err());
        assert!(validate_setting("sound.volume", "-0.1").is_err());
        assert!(validate_setting("sound.enabled", "true").is_ok());
        assert!(validate_setting("sound.click_pack", "nk-creams").is_ok());
        assert!(validate_setting("sound.warning_seconds", "3").is_ok());
        assert!(validate_setting("unknown.key", "true").is_err());
    }
}
