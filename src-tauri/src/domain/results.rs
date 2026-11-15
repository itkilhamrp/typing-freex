use serde::{Deserialize, Serialize};
use crate::error::AppError;

pub const MAX_PAYLOAD_BYTES: usize = 512 * 1024; // 512 KiB

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResultDto {
    pub uuid: String,
    pub mode: String,
    pub mode_variant: String,
    pub language: String,
    pub wpm: f64,
    pub raw_wpm: f64,
    pub accuracy: f64,
    pub consistency: Option<f64>,
    pub duration_seconds: f64,
    pub character_count: i64,
    pub keystroke_count: i64,
    pub correct_keystrokes: i64,
    pub error_keystrokes: i64,
    pub completed_at: String,
    pub is_completed: bool,
    pub payload_json: String,
}

pub fn validate_test_result(r: &TestResultDto) -> Result<(), AppError> {
    if r.uuid.trim().is_empty() {
        return Err(AppError::Validation("Result UUID cannot be empty".to_string()));
    }

    if !["time", "words", "quote", "tech", "zen", "custom"].contains(&r.mode.as_str()) {
        return Err(AppError::Validation(format!("Invalid mode '{}'", r.mode)));
    }

    if !r.wpm.is_finite() || !(0.0..=500.0).contains(&r.wpm) {
        return Err(AppError::Validation(format!("WPM out of range: {}", r.wpm)));
    }

    if !r.raw_wpm.is_finite() || !(0.0..=600.0).contains(&r.raw_wpm) {
        return Err(AppError::Validation(format!("Raw WPM out of range: {}", r.raw_wpm)));
    }

    if !r.accuracy.is_finite() || !(0.0..=100.0).contains(&r.accuracy) {
        return Err(AppError::Validation(format!("Accuracy out of range: {}", r.accuracy)));
    }

    if let Some(cons) = r.consistency
        && (!cons.is_finite() || !(0.0..=100.0).contains(&cons))
    {
        return Err(AppError::Validation(format!("Consistency out of range: {}", cons)));
    }

    if !r.duration_seconds.is_finite() || r.duration_seconds <= 0.0 || r.duration_seconds > 86400.0 {
        return Err(AppError::Validation(format!("Duration out of range: {}", r.duration_seconds)));
    }

    // Size limit check on payload_json (≤ 512 KiB)
    if r.payload_json.len() > MAX_PAYLOAD_BYTES {
        return Err(AppError::Validation(format!(
            "Payload size exceeds 512 KiB limit (got {} bytes)",
            r.payload_json.len()
        )));
    }

    // Must be valid JSON
    if serde_json::from_str::<serde_json::Value>(&r.payload_json).is_err() {
        return Err(AppError::Validation("payload_json is not valid JSON".to_string()));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_test_result() {
        let valid = TestResultDto {
            uuid: "res-123".to_string(),
            mode: "words".to_string(),
            mode_variant: "25".to_string(),
            language: "en".to_string(),
            wpm: 80.0,
            raw_wpm: 85.0,
            accuracy: 98.0,
            consistency: Some(85.0),
            duration_seconds: 18.5,
            character_count: 120,
            keystroke_count: 130,
            correct_keystrokes: 125,
            error_keystrokes: 5,
            completed_at: "2026-03-30T10:00:00Z".to_string(),
            is_completed: true,
            payload_json: "{}".to_string(),
        };

        assert!(validate_test_result(&valid).is_ok());

        let mut tech_mode = valid.clone();
        tech_mode.mode = "tech".to_string();
        tech_mode.mode_variant = "short".to_string();
        tech_mode.language = "docker".to_string();
        assert!(validate_test_result(&tech_mode).is_ok());

        let mut invalid_mode = valid.clone();
        invalid_mode.mode = "invalid_mode".to_string();
        assert!(validate_test_result(&invalid_mode).is_err());

        let mut invalid_wpm = valid.clone();
        invalid_wpm.wpm = -10.0;
        assert!(validate_test_result(&invalid_wpm).is_err());

        let mut invalid_json = valid.clone();
        invalid_json.payload_json = "not a json".to_string();
        assert!(validate_test_result(&invalid_json).is_err());
    }
}
