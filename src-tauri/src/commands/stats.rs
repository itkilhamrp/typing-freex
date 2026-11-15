use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::collect_rows;
use crate::db::manager::DatabaseManager;
use crate::domain::units::wpm_to_cpm;
use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatsSummary {
    pub total_tests: u64,
    pub total_time_seconds: f64,
    pub avg_wpm: f64,
    pub highest_wpm: f64,
    pub avg_accuracy: f64,
    pub avg_consistency: Option<f64>,
    pub total_words: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatPoint {
    pub timestamp: String,
    pub wpm: f64,
    pub raw_wpm: f64,
    pub accuracy: f64,
    pub consistency: Option<f64>,
    pub cpm: f64,
    pub raw_cpm: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyHeatmapEntry {
    pub key: String,
    pub total_presses: u64,
    pub errors: u64,
    pub error_rate: f64,
    pub avg_latency_ms: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalBest {
    pub mode: String,
    pub mode_variant: String,
    pub language: String,
    pub wpm: f64,
    pub cpm: f64,
    pub accuracy: f64,
    pub achieved_at: String,
    pub result_uuid: Option<String>,
    pub difficulty: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyActivity {
    pub date: String,
    pub tests_completed: u64,
    pub time_spent_seconds: f64,
    pub words_typed: u64,
    pub best_wpm: f64,
    pub avg_wpm: f64,
}

pub fn stats_summary_internal(
    manager: &DatabaseManager,
    range: Option<String>,
    mode: Option<String>,
) -> AppResult<StatsSummary> {
    manager.with_active_profile(|_uuid, conn| {
        let mut query = String::from(
            "SELECT
                COUNT(*),
                COALESCE(SUM(duration_seconds), 0.0),
                COALESCE(AVG(wpm), 0.0),
                COALESCE(MAX(wpm), 0.0),
                COALESCE(AVG(accuracy), 0.0),
                AVG(consistency),
                COALESCE(SUM(character_count), 0) / 5
            FROM test_result
            WHERE mode NOT IN ('zen', 'custom') AND is_completed = 1"
        );

        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(ref m) = mode
            && !m.is_empty()
            && m != "all"
        {
            query.push_str(" AND mode = ?");
            params_vec.push(Box::new(m.clone()));
        }

        if let Some(ref r) = range {
            match r.as_str() {
                "today" => query.push_str(" AND substr(completed_at, 1, 10) = date('now')"),
                "week" => query.push_str(" AND completed_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days')"),
                "month" => query.push_str(" AND completed_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days')"),
                _ => {}
            }
        }

        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();

        let row = conn.query_row(&query, params_refs.as_slice(), |row| {
            let total_tests: i64 = row.get(0)?;
            let total_time_seconds: f64 = row.get(1)?;
            let avg_wpm: f64 = row.get(2)?;
            let highest_wpm: f64 = row.get(3)?;
            let avg_accuracy: f64 = row.get(4)?;
            let avg_consistency: Option<f64> = row.get(5)?;
            let total_words: i64 = row.get(6)?;

            Ok(StatsSummary {
                total_tests: total_tests.max(0) as u64,
                total_time_seconds: (total_time_seconds * 100.0).round() / 100.0,
                avg_wpm: (avg_wpm * 10.0).round() / 10.0,
                highest_wpm: (highest_wpm * 10.0).round() / 10.0,
                avg_accuracy: (avg_accuracy * 10.0).round() / 10.0,
                avg_consistency: avg_consistency.map(|c| (c * 10.0).round() / 10.0),
                total_words: total_words.max(0) as u64,
            })
        })
        .map_err(|e| AppError::Database(format!("Failed to compute stats summary: {}", e)))?;

        Ok(row)
    })
}

pub fn stats_series_internal(
    manager: &DatabaseManager,
    limit: Option<u32>,
    bucket: Option<String>,
    mode: Option<String>,
) -> AppResult<Vec<StatPoint>> {
    let limit_val = limit.unwrap_or(50).min(500);

    manager.with_active_profile(|_uuid, conn| {
        let is_bucketed_day = bucket.as_deref() == Some("day");

        if is_bucketed_day {
            let mut inner_query = String::from(
                "SELECT
                    substr(completed_at, 1, 10) as bucket_date,
                    AVG(wpm) as avg_wpm,
                    AVG(raw_wpm) as avg_raw_wpm,
                    AVG(accuracy) as avg_acc,
                    AVG(consistency) as avg_cons
                FROM test_result
                WHERE mode NOT IN ('zen', 'custom') AND is_completed = 1"
            );
            let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

            if let Some(ref m) = mode
                && !m.is_empty()
                && m != "all"
            {
                inner_query.push_str(" AND mode = ?");
                params_vec.push(Box::new(m.clone()));
            }

            inner_query.push_str(" GROUP BY bucket_date ORDER BY bucket_date DESC LIMIT ?");
            params_vec.push(Box::new(limit_val));

            let query = format!(
                "SELECT bucket_date, avg_wpm, avg_raw_wpm, avg_acc, avg_cons FROM ({}) ORDER BY bucket_date ASC",
                inner_query
            );

            let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();
            let mut stmt = conn.prepare(&query).map_err(|e| AppError::Database(e.to_string()))?;
            let rows = stmt.query_map(params_refs.as_slice(), |row| {
                let timestamp: String = row.get(0)?;
                let wpm: f64 = row.get(1)?;
                let raw_wpm: f64 = row.get(2)?;
                let accuracy: f64 = row.get(3)?;
                let consistency: Option<f64> = row.get(4)?;

                Ok(StatPoint {
                    timestamp,
                    wpm: (wpm * 10.0).round() / 10.0,
                    raw_wpm: (raw_wpm * 10.0).round() / 10.0,
                    accuracy: (accuracy * 10.0).round() / 10.0,
                    consistency: consistency.map(|c| (c * 10.0).round() / 10.0),
                    cpm: (wpm_to_cpm(wpm) * 10.0).round() / 10.0,
                    raw_cpm: (wpm_to_cpm(raw_wpm) * 10.0).round() / 10.0,
                })
            })
            .map_err(|e| AppError::Database(e.to_string()))?;

            collect_rows(rows)
        } else {
            let mut inner_query = String::from(
                "SELECT completed_at, wpm, raw_wpm, accuracy, consistency
                 FROM test_result
                 WHERE mode NOT IN ('zen', 'custom') AND is_completed = 1"
            );
            let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

            if let Some(ref m) = mode
                && !m.is_empty()
                && m != "all"
            {
                inner_query.push_str(" AND mode = ?");
                params_vec.push(Box::new(m.clone()));
            }

            inner_query.push_str(" ORDER BY completed_at DESC LIMIT ?");
            params_vec.push(Box::new(limit_val));

            let query = format!(
                "SELECT completed_at, wpm, raw_wpm, accuracy, consistency FROM ({}) ORDER BY completed_at ASC",
                inner_query
            );

            let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();
            let mut stmt = conn.prepare(&query).map_err(|e| AppError::Database(e.to_string()))?;
            let rows = stmt.query_map(params_refs.as_slice(), |row| {
                let timestamp: String = row.get(0)?;
                let wpm: f64 = row.get(1)?;
                let raw_wpm: f64 = row.get(2)?;
                let accuracy: f64 = row.get(3)?;
                let consistency: Option<f64> = row.get(4)?;

                Ok(StatPoint {
                    timestamp,
                    wpm: (wpm * 10.0).round() / 10.0,
                    raw_wpm: (raw_wpm * 10.0).round() / 10.0,
                    accuracy: (accuracy * 10.0).round() / 10.0,
                    consistency: consistency.map(|c| (c * 10.0).round() / 10.0),
                    cpm: (wpm_to_cpm(wpm) * 10.0).round() / 10.0,
                    raw_cpm: (wpm_to_cpm(raw_wpm) * 10.0).round() / 10.0,
                })
            })
            .map_err(|e| AppError::Database(e.to_string()))?;

            collect_rows(rows)
        }
    })
}

pub fn stats_key_heatmap_internal(manager: &DatabaseManager) -> AppResult<Vec<KeyHeatmapEntry>> {
    manager.with_active_profile(|_uuid, conn| {
        let mut stmt = conn
            .prepare(
                "SELECT key_char, total_attempts, total_errors, total_latency_ms
                 FROM key_stat
                 ORDER BY total_attempts DESC"
            )
            .map_err(|e| AppError::Database(e.to_string()))?;

        let rows = stmt
            .query_map([], |row| {
                let key: String = row.get(0)?;
                let total_presses: i64 = row.get(1)?;
                let errors: i64 = row.get(2)?;
                let total_latency: i64 = row.get(3)?;

                let error_rate = if total_presses > 0 {
                    (errors as f64 / total_presses as f64) * 100.0
                } else {
                    0.0
                };

                let avg_latency_ms = if total_presses > 0 {
                    total_latency as f64 / total_presses as f64
                } else {
                    0.0
                };

                Ok(KeyHeatmapEntry {
                    key,
                    total_presses: total_presses.max(0) as u64,
                    errors: errors.max(0) as u64,
                    error_rate: (error_rate * 10.0).round() / 10.0,
                    avg_latency_ms: (avg_latency_ms * 10.0).round() / 10.0,
                })
            })
            .map_err(|e| AppError::Database(e.to_string()))?;

        collect_rows(rows)
    })
}

pub fn stats_personal_bests_internal(
    manager: &DatabaseManager,
    mode: Option<String>,
) -> AppResult<Vec<PersonalBest>> {
    manager.with_active_profile(|_uuid, conn| {
        let mut query = String::from(
            "WITH ranked AS (
                SELECT tr.mode, tr.mode_variant, tr.language, tr.wpm, tr.accuracy, tr.completed_at, tr.uuid,
                       COALESCE(json_extract(tr.payload_json, '$.config.difficulty'), 'normal') AS difficulty,
                       ROW_NUMBER() OVER (
                           PARTITION BY COALESCE(json_extract(tr.payload_json, '$.config.difficulty'), 'normal')
                           ORDER BY tr.wpm DESC, tr.accuracy DESC, tr.completed_at DESC
                       ) as rn
                FROM test_result tr
                WHERE tr.mode NOT IN ('zen', 'custom')
                  AND tr.is_completed = 1"
        );
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(ref m) = mode
            && !m.is_empty()
            && m != "all"
        {
            query.push_str(" AND tr.mode = ?");
            params_vec.push(Box::new(m.clone()));
        }

        query.push_str(
            ")
             SELECT mode, mode_variant, language, wpm, accuracy, completed_at, uuid, difficulty
             FROM ranked
             WHERE rn <= 3
             ORDER BY wpm DESC"
        );

        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();
        let mut stmt = conn.prepare(&query).map_err(|e| AppError::Database(e.to_string()))?;
        let rows = stmt.query_map(params_refs.as_slice(), |row| {
            let mode: String = row.get(0)?;
            let mode_variant: String = row.get(1)?;
            let language: String = row.get(2)?;
            let wpm: f64 = row.get(3)?;
            let accuracy: f64 = row.get(4)?;
            let achieved_at: String = row.get(5)?;
            let result_uuid: Option<String> = row.get(6)?;
            let difficulty: Option<String> = row.get(7)?;

            Ok(PersonalBest {
                mode,
                mode_variant,
                language,
                wpm: (wpm * 10.0).round() / 10.0,
                cpm: (wpm_to_cpm(wpm) * 10.0).round() / 10.0,
                accuracy: (accuracy * 10.0).round() / 10.0,
                achieved_at,
                result_uuid,
                difficulty,
            })
        })
        .map_err(|e| AppError::Database(e.to_string()))?;

        collect_rows(rows)
    })
}

pub fn stats_daily_activity_internal(
    manager: &DatabaseManager,
) -> AppResult<Vec<DailyActivity>> {
    manager.with_active_profile(|_uuid, conn| {
        let query = "SELECT
            substr(completed_at, 1, 10) AS date,
            COUNT(*),
            COALESCE(SUM(duration_seconds), 0.0),
            COALESCE(SUM(character_count), 0) / 5,
            COALESCE(MAX(wpm), 0.0),
            COALESCE(AVG(wpm), 0.0)
        FROM test_result
        WHERE mode NOT IN ('zen', 'custom')
          AND is_completed = 1
          AND completed_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-375 days')
        GROUP BY date
        ORDER BY date ASC";

        let mut stmt = conn.prepare(query).map_err(|e| AppError::Database(e.to_string()))?;
        let rows = stmt.query_map([], |row| {
            let date: String = row.get(0)?;
            let tests_completed: i64 = row.get(1)?;
            let time_spent_seconds: f64 = row.get(2)?;
            let words_typed: i64 = row.get(3)?;
            let best_wpm: f64 = row.get(4)?;
            let avg_wpm: f64 = row.get(5)?;

            Ok(DailyActivity {
                date,
                tests_completed: tests_completed.max(0) as u64,
                time_spent_seconds: (time_spent_seconds * 10.0).round() / 10.0,
                words_typed: words_typed.max(0) as u64,
                best_wpm: (best_wpm * 10.0).round() / 10.0,
                avg_wpm: (avg_wpm * 10.0).round() / 10.0,
            })
        })
        .map_err(|e| AppError::Database(e.to_string()))?;

        collect_rows(rows)
    })
}

// Tauri IPC Command wrappers
#[tauri::command]
pub async fn stats_summary(
    manager: State<'_, DatabaseManager>,
    profile_id: Option<String>,
    range: Option<String>,
    mode: Option<String>,
) -> AppResult<StatsSummary> {
    let _ = profile_id;
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || stats_summary_internal(&mgr, range, mode))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn stats_series(
    manager: State<'_, DatabaseManager>,
    profile_id: Option<String>,
    limit: Option<u32>,
    bucket: Option<String>,
    mode: Option<String>,
) -> AppResult<Vec<StatPoint>> {
    let _ = profile_id;
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || stats_series_internal(&mgr, limit, bucket, mode))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn stats_key_heatmap(
    manager: State<'_, DatabaseManager>,
    profile_id: Option<String>,
) -> AppResult<Vec<KeyHeatmapEntry>> {
    let _ = profile_id;
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || stats_key_heatmap_internal(&mgr))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn stats_personal_bests(
    manager: State<'_, DatabaseManager>,
    profile_id: Option<String>,
    mode: Option<String>,
) -> AppResult<Vec<PersonalBest>> {
    let _ = profile_id;
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || stats_personal_bests_internal(&mgr, mode))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn stats_daily_activity(
    manager: State<'_, DatabaseManager>,
    profile_id: Option<String>,
) -> AppResult<Vec<DailyActivity>> {
    let _ = profile_id;
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || stats_daily_activity_internal(&mgr))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use uuid::Uuid;
    use crate::commands::results::save_result_internal;
    use crate::domain::results::TestResultDto;

    fn temp_test_dir(name: &str) -> PathBuf {
        let p = std::env::temp_dir().join(format!("tfrx_stats_{}_{}", name, Uuid::new_v4()));
        let _ = fs::remove_dir_all(&p);
        p
    }

    #[test]
    fn test_stats_aggregation_and_series() {
        let base_dir = temp_test_dir("stats_test");
        let manager = DatabaseManager::new(base_dir).unwrap();
        manager.create_profile("Stats Tester", "stats-tester").unwrap();

        // Initially zero
        let summary = stats_summary_internal(&manager, None, None).unwrap();
        assert_eq!(summary.total_tests, 0);
        assert_eq!(summary.avg_wpm, 0.0);

        // Save two results with keyStats
        let payload1 = serde_json::json!({
            "keyStats": {
                "e": { "total": 10, "correct": 9, "errors": 1, "totalLatencyMs": 1200 },
                "t": { "total": 5, "correct": 5, "errors": 0, "totalLatencyMs": 500 }
            }
        }).to_string();

        let r1 = TestResultDto {
            uuid: "res-stat-1".to_string(),
            mode: "time".to_string(),
            mode_variant: "15".to_string(),
            language: "en".to_string(),
            wpm: 60.0,
            raw_wpm: 65.0,
            accuracy: 98.0,
            consistency: Some(85.0),
            duration_seconds: 15.0,
            character_count: 75,
            keystroke_count: 80,
            correct_keystrokes: 75,
            error_keystrokes: 2,
            completed_at: "2026-03-30T10:00:00Z".to_string(),
            is_completed: true,
            payload_json: payload1.clone(),
        };
        save_result_internal(&manager, r1).unwrap();

        let payload2 = serde_json::json!({
            "keyStats": {
                "e": { "total": 5, "correct": 3, "errors": 2, "totalLatencyMs": 800 }
            }
        }).to_string();

        let r2 = TestResultDto {
            uuid: "res-stat-2".to_string(),
            mode: "time".to_string(),
            mode_variant: "15".to_string(),
            language: "en".to_string(),
            wpm: 80.0,
            raw_wpm: 85.0,
            accuracy: 96.0,
            consistency: Some(90.0),
            duration_seconds: 15.0,
            character_count: 100,
            keystroke_count: 105,
            correct_keystrokes: 98,
            error_keystrokes: 4,
            completed_at: "2026-03-30T11:00:00Z".to_string(),
            is_completed: true,
            payload_json: payload2.clone(),
        };
        save_result_internal(&manager, r2).unwrap();

        // Check summary
        let summary2 = stats_summary_internal(&manager, None, None).unwrap();
        assert_eq!(summary2.total_tests, 2);
        assert_eq!(summary2.avg_wpm, 70.0);
        assert_eq!(summary2.highest_wpm, 80.0);
        assert_eq!(summary2.avg_accuracy, 97.0);

        // Check series
        let series = stats_series_internal(&manager, Some(10), None, None).unwrap();
        assert_eq!(series.len(), 2);
        assert_eq!(series[0].wpm, 60.0);
        assert_eq!(series[0].cpm, 300.0);
        assert_eq!(series[1].wpm, 80.0);
        assert_eq!(series[1].cpm, 400.0);

        // Check key heatmap
        let heatmap = stats_key_heatmap_internal(&manager).unwrap();
        let e_stat = heatmap.iter().find(|h| h.key == "e").unwrap();
        assert_eq!(e_stat.total_presses, 15);
        assert_eq!(e_stat.errors, 3);
        assert_eq!(e_stat.error_rate, 20.0);

        // Check personal bests (ranked top runs per difficulty)
        let pbs = stats_personal_bests_internal(&manager, None).unwrap();
        assert_eq!(pbs.len(), 2);
        assert_eq!(pbs[0].wpm, 80.0);
        assert_eq!(pbs[0].cpm, 400.0);
        assert_eq!(pbs[1].wpm, 60.0);
        assert_eq!(pbs[1].cpm, 300.0);

        // Test custom mode: must NOT enter analytics, but CAN enter history
        let r_custom = TestResultDto {
            uuid: "res-custom-1".to_string(),
            mode: "custom".to_string(),
            mode_variant: "infinity".to_string(),
            language: "en".to_string(),
            wpm: 120.0,
            raw_wpm: 125.0,
            accuracy: 99.0,
            consistency: Some(95.0),
            duration_seconds: 30.0,
            character_count: 200,
            keystroke_count: 205,
            correct_keystrokes: 200,
            error_keystrokes: 2,
            completed_at: "2026-03-30T12:00:00Z".to_string(),
            is_completed: true,
            payload_json: payload2,
        };
        let save_resp = save_result_internal(&manager, r_custom).unwrap();
        // Custom mode must not be flagged as personal best
        assert!(!save_resp.is_personal_best);

        // Summary must STILL be 2 (custom not counted)
        let summary3 = stats_summary_internal(&manager, None, None).unwrap();
        assert_eq!(summary3.total_tests, 2);

        // Series must STILL be 2 (custom not counted)
        let series3 = stats_series_internal(&manager, Some(10), None, None).unwrap();
        assert_eq!(series3.len(), 2);

        // Personal best must STILL be 2 with wpm 80 and 60 (custom not counted)
        let pbs3 = stats_personal_bests_internal(&manager, None).unwrap();
        assert_eq!(pbs3.len(), 2);
        assert_eq!(pbs3[0].wpm, 80.0);
        assert_eq!(pbs3[1].wpm, 60.0);

        // Check daily activity (custom mode should NOT be included, total 2 tests)
        let activity = stats_daily_activity_internal(&manager).unwrap();
        assert_eq!(activity.len(), 1);
        assert_eq!(activity[0].date, "2026-03-30");
        assert_eq!(activity[0].tests_completed, 2);
        assert_eq!(activity[0].best_wpm, 80.0);
        assert_eq!(activity[0].avg_wpm, 70.0);

        // History (list_results_internal) MUST include the custom mode result (total 3 results)
        let history = crate::commands::results::list_results_internal(&manager, None, None, None).unwrap();
        assert_eq!(history.len(), 3);
        assert!(history.iter().any(|h| h.mode == "custom"));

        // Incomplete / failed test (e.g. expert/master failure) must NEVER enter stats or history
        let r_failed = TestResultDto {
            uuid: "res-failed-1".to_string(),
            mode: "words".to_string(),
            mode_variant: "25".to_string(),
            language: "en".to_string(),
            wpm: 150.0,
            raw_wpm: 155.0,
            accuracy: 99.0,
            consistency: Some(95.0),
            duration_seconds: 15.0,
            character_count: 100,
            keystroke_count: 105,
            correct_keystrokes: 100,
            error_keystrokes: 1,
            completed_at: "2026-03-30T13:00:00Z".to_string(),
            is_completed: false,
            payload_json: payload1,
        };
        let _ = crate::commands::results::save_result_internal(&manager, r_failed).unwrap();

        // Summary, Series, Daily Activity, Personal Bests, and History counts must remain completely unchanged
        let summary_after_fail = stats_summary_internal(&manager, None, None).unwrap();
        assert_eq!(summary_after_fail.total_tests, 2);

        let series_after_fail = stats_series_internal(&manager, Some(10), None, None).unwrap();
        assert_eq!(series_after_fail.len(), 2);

        let pbs_after_fail = stats_personal_bests_internal(&manager, None).unwrap();
        assert_eq!(pbs_after_fail.len(), 2);

        let activity_after_fail = stats_daily_activity_internal(&manager).unwrap();
        assert_eq!(activity_after_fail[0].tests_completed, 2);

        let history_after_fail = crate::commands::results::list_results_internal(&manager, None, None, None).unwrap();
        assert_eq!(history_after_fail.len(), 3);
    }

    #[test]
    fn test_stats_series_latest_n_and_iso_range_filter() {
        let base_dir = temp_test_dir("series_range");
        let manager = DatabaseManager::new(base_dir.clone()).unwrap();
        manager.create_profile("Series Tester", "series-tester").unwrap();

        let payload = serde_json::json!({ "wpmHistory": [], "keyStats": [] }).to_string();
        let today_iso = crate::db::migrate::chrono_now_iso();
        let samples = [
            ("2025-01-01T10:00:00.000Z", 50.0),
            ("2025-01-02T10:00:00.000Z", 60.0),
            ("2025-01-03T10:00:00.000Z", 70.0),
            ("2025-01-04T10:00:00.000Z", 80.0),
            (today_iso.as_str(), 90.0),
        ];

        for (ts, wpm) in samples {
            let dto = TestResultDto {
                uuid: Uuid::new_v4().to_string(),
                mode: "time".to_string(),
                mode_variant: "15".to_string(),
                language: "en".to_string(),
                wpm,
                raw_wpm: wpm + 2.0,
                accuracy: 98.0,
                consistency: Some(92.0),
                duration_seconds: 15.0,
                character_count: 100,
                keystroke_count: 102,
                correct_keystrokes: 100,
                error_keystrokes: 2,
                completed_at: ts.to_string(),
                is_completed: true,
                payload_json: payload.clone(),
            };
            let _ = save_result_internal(&manager, dto).unwrap();
        }

        // Raw series with limit=3 must return latest 3 in ascending chronological order
        let raw_latest = stats_series_internal(&manager, Some(3), None, Some("time".to_string())).unwrap();
        assert_eq!(raw_latest.len(), 3);
        let raw_wpms: Vec<f64> = raw_latest.iter().map(|p| p.wpm).collect();
        assert_eq!(raw_wpms, vec![70.0, 80.0, 90.0]);

        // Daily bucketed series with limit=3 must return latest 3 days in ascending chronological order
        let day_latest =
            stats_series_internal(&manager, Some(3), Some("day".to_string()), Some("time".to_string()))
                .unwrap();
        assert_eq!(day_latest.len(), 3);
        let day_wpms: Vec<f64> = day_latest.iter().map(|p| p.wpm).collect();
        assert_eq!(day_wpms, vec![70.0, 80.0, 90.0]);

        // ISO-8601 'T' timestamp matches "today", "week", and "month" range filters while excluding 2025 rows
        for range in ["today", "week", "month"] {
            let s = stats_summary_internal(&manager, Some(range.to_string()), None).unwrap();
            assert_eq!(s.total_tests, 1, "Range '{}' should include only today's ISO result", range);
            assert_eq!(s.highest_wpm, 90.0);
        }

        let _ = fs::remove_dir_all(&base_dir);
    }
}
