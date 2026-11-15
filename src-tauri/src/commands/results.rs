use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::collect_rows;
use crate::db::manager::DatabaseManager;
use crate::domain::results::{validate_test_result, TestResultDto};
use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveResultResponse {
    pub id: i64,
    pub uuid: String,
    pub is_personal_best: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResultSummaryDto {
    pub id: i64,
    pub uuid: String,
    pub mode: String,
    pub mode_variant: String,
    pub language: String,
    pub wpm: f64,
    pub raw_wpm: f64,
    pub accuracy: f64,
    pub consistency: Option<f64>,
    pub duration_seconds: f64,
    pub completed_at: String,
    pub difficulty: Option<String>,
}

pub fn save_result_internal(
    manager: &DatabaseManager,
    result: TestResultDto,
) -> AppResult<SaveResultResponse> {
    if result.mode == "zen" {
        return Err(AppError::Validation("Zen mode results are free typing and excluded from persistence".to_string()));
    }

    if !result.is_completed {
        return Ok(SaveResultResponse {
            id: 0,
            uuid: result.uuid,
            is_personal_best: false,
        });
    }

    validate_test_result(&result)?;

    manager.with_active_profile_mut(|_uuid, conn| {
        let tx = conn
            .transaction()
            .map_err(|e| AppError::Database(e.to_string()))?;

        // 1. Insert into test_result
        tx.execute(
            "INSERT INTO test_result (
                uuid, mode, mode_variant, language, wpm, raw_wpm, accuracy, consistency,
                duration_seconds, character_count, keystroke_count, correct_keystrokes,
                error_keystrokes, completed_at, is_completed, payload_json, payload_version
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, 1)",
            params![
                result.uuid,
                result.mode,
                result.mode_variant,
                result.language,
                result.wpm,
                result.raw_wpm,
                result.accuracy,
                result.consistency,
                result.duration_seconds,
                result.character_count,
                result.keystroke_count,
                result.correct_keystrokes,
                result.error_keystrokes,
                result.completed_at,
                if result.is_completed { 1 } else { 0 },
                result.payload_json,
            ],
        )
        .map_err(|e| AppError::Database(format!("Failed to insert test_result: {}", e)))?;

        let result_id = tx.last_insert_rowid();

        // 2. Check personal_best status if test was completed and is an analytics mode
        let mut is_pb = false;
        let is_analytics_mode = result.mode != "custom";
        let parsed_payload = if is_analytics_mode {
            serde_json::from_str::<serde_json::Value>(&result.payload_json).ok()
        } else {
            None
        };

        if is_analytics_mode && result.is_completed {
            let difficulty: String = parsed_payload
                .as_ref()
                .and_then(|v| {
                    v.get("config")
                        .and_then(|c| c.get("difficulty"))
                        .and_then(|d| d.as_str().map(String::from))
                })
                .unwrap_or_else(|| "normal".to_string());

            let prev_best_wpm: Option<f64> = tx
                .query_row(
                    "SELECT MAX(wpm) FROM test_result
                     WHERE mode = ?1 AND mode_variant = ?2 AND language = ?3
                       AND COALESCE(json_extract(payload_json, '$.config.difficulty'), 'normal') = ?4
                       AND is_completed = 1 AND id != ?5",
                    params![result.mode, result.mode_variant, result.language, difficulty, result_id],
                    |row| row.get(0),
                )
                .ok();

            if prev_best_wpm.is_none_or(|best| result.wpm > best) {
                is_pb = true;
            }
        }

        // 3. Update key_stat from payload_json keyStats
        if is_analytics_mode
            && let Some(ref val) = parsed_payload
            && let Some(key_stats) = val.get("keyStats").and_then(|k| k.as_object())
        {
            for (k, stat) in key_stats {
                let total = stat.get("total").and_then(|v| v.as_i64()).unwrap_or(0);
                let errors = stat.get("errors").and_then(|v| v.as_i64()).unwrap_or(0);
                let latency = stat.get("totalLatencyMs").and_then(|v| v.as_i64()).unwrap_or(0);
                if total > 0 {
                    tx.execute(
                        "INSERT INTO key_stat (key_char, total_attempts, total_errors, total_latency_ms, updated_at)
                         VALUES (?1, ?2, ?3, ?4, ?5)
                         ON CONFLICT(key_char) DO UPDATE SET
                            total_attempts = key_stat.total_attempts + excluded.total_attempts,
                            total_errors = key_stat.total_errors + excluded.total_errors,
                            total_latency_ms = key_stat.total_latency_ms + excluded.total_latency_ms,
                            updated_at = excluded.updated_at",
                        params![k, total, errors, latency, result.completed_at],
                    )
                    .map_err(|e| AppError::Database(format!("Failed to update key_stat: {}", e)))?;
                }
            }
        }

        tx.commit()
            .map_err(|e| AppError::Database(format!("Failed to commit result_save: {}", e)))?;

        Ok(SaveResultResponse {
            id: result_id,
            uuid: result.uuid,
            is_personal_best: is_pb,
        })
    })
}

#[tauri::command]
pub async fn result_save(
    manager: State<'_, DatabaseManager>,
    result: TestResultDto,
) -> AppResult<SaveResultResponse> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || save_result_internal(&mgr, result))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

pub fn list_results_internal(
    manager: &DatabaseManager,
    limit: Option<u32>,
    offset: Option<u32>,
    mode: Option<String>,
) -> AppResult<Vec<ResultSummaryDto>> {
    let limit_val = limit.unwrap_or(50).min(200);
    let offset_val = offset.unwrap_or(0);

    manager.with_active_profile(|_uuid, conn| {
        let mut sql = "SELECT id, uuid, mode, mode_variant, language, wpm, raw_wpm, accuracy, consistency, duration_seconds, completed_at, json_extract(payload_json, '$.config.difficulty') FROM test_result WHERE mode != 'zen' AND is_completed = 1".to_string();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(m) = mode
            && !m.is_empty()
            && m != "all"
        {
            sql.push_str(" AND mode = ?1");
            params_vec.push(Box::new(m));
        }

        sql.push_str(&format!(
            " ORDER BY completed_at DESC LIMIT {} OFFSET {}",
            limit_val, offset_val
        ));

        let params_slice: Vec<&dyn rusqlite::ToSql> =
            params_vec.iter().map(|b| b.as_ref()).collect();
        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| AppError::Database(e.to_string()))?;

        let rows = stmt
            .query_map(params_slice.as_slice(), |row| {
                Ok(ResultSummaryDto {
                    id: row.get(0)?,
                    uuid: row.get(1)?,
                    mode: row.get(2)?,
                    mode_variant: row.get(3)?,
                    language: row.get(4)?,
                    wpm: row.get(5)?,
                    raw_wpm: row.get(6)?,
                    accuracy: row.get(7)?,
                    consistency: row.get(8)?,
                    duration_seconds: row.get(9)?,
                    completed_at: row.get(10)?,
                    difficulty: row.get(11)?,
                })
            })
            .map_err(|e| AppError::Database(e.to_string()))?;

        collect_rows(rows)
    })
}

#[tauri::command]
pub async fn result_list(
    manager: State<'_, DatabaseManager>,
    limit: Option<u32>,
    offset: Option<u32>,
    mode: Option<String>,
) -> AppResult<Vec<ResultSummaryDto>> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || list_results_internal(&mgr, limit, offset, mode))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn result_get(
    manager: State<'_, DatabaseManager>,
    uuid: String,
) -> AppResult<Option<TestResultDto>> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        mgr.with_active_profile(|_p_uuid, conn| {
            let mut stmt = conn
                .prepare(
                    "SELECT uuid, mode, mode_variant, language, wpm, raw_wpm, accuracy, consistency,
                            duration_seconds, character_count, keystroke_count, correct_keystrokes,
                            error_keystrokes, completed_at, is_completed, payload_json
                     FROM test_result WHERE uuid = ?1",
                )
                .map_err(|e| AppError::Database(e.to_string()))?;

            let result = stmt
                .query_row([&uuid], |row| {
                    let is_comp_i: i64 = row.get(14)?;
                    Ok(TestResultDto {
                        uuid: row.get(0)?,
                        mode: row.get(1)?,
                        mode_variant: row.get(2)?,
                        language: row.get(3)?,
                        wpm: row.get(4)?,
                        raw_wpm: row.get(5)?,
                        accuracy: row.get(6)?,
                        consistency: row.get(7)?,
                        duration_seconds: row.get(8)?,
                        character_count: row.get(9)?,
                        keystroke_count: row.get(10)?,
                        correct_keystrokes: row.get(11)?,
                        error_keystrokes: row.get(12)?,
                        completed_at: row.get(13)?,
                        is_completed: is_comp_i == 1,
                        payload_json: row.get(15)?,
                    })
                })
                .ok();

            Ok(result)
        })
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn result_delete(
    manager: State<'_, DatabaseManager>,
    uuids: Vec<String>,
) -> AppResult<()> {
    if uuids.is_empty() {
        return Ok(());
    }
    if uuids.len() > 500 {
        return Err(AppError::Validation(
            "Cannot delete more than 500 results at once".to_string(),
        ));
    }

    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        mgr.with_active_profile_mut(|_p_uuid, conn| {
            let tx = conn
                .transaction()
                .map_err(|e| AppError::Database(e.to_string()))?;
            for u in uuids {
                tx.execute("DELETE FROM test_result WHERE uuid = ?1", [&u])
                    .map_err(|e| AppError::Database(e.to_string()))?;
            }
            tx.commit()
                .map_err(|e| AppError::Database(e.to_string()))?;
            Ok(())
        })
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use std::time::Instant;
    use uuid::Uuid;

    fn temp_test_dir(name: &str) -> PathBuf {
        let p = std::env::temp_dir().join(format!("tfrx_res_{}_{}", name, Uuid::new_v4()));
        let _ = fs::remove_dir_all(&p);
        p
    }

    #[test]
    fn test_result_save_sla_and_aggregates() {
        let base_dir = temp_test_dir("save_sla");
        let manager = DatabaseManager::new(base_dir.clone()).unwrap();
        manager.create_profile("Tester", "tester").unwrap();

        let result1 = TestResultDto {
            uuid: "res-001".to_string(),
            mode: "words".to_string(),
            mode_variant: "25".to_string(),
            language: "en".to_string(),
            wpm: 75.0,
            raw_wpm: 80.0,
            accuracy: 98.0,
            consistency: Some(85.0),
            duration_seconds: 20.0,
            character_count: 125,
            keystroke_count: 130,
            correct_keystrokes: 125,
            error_keystrokes: 5,
            completed_at: "2026-03-30T10:00:00Z".to_string(),
            is_completed: true,
            payload_json: "{}".to_string(),
        };

        // Measure result_save latency (NFR-PERF-012: <= 20ms)
        let start = Instant::now();
        let save_resp = save_result_internal(&manager, result1).unwrap();
        let duration = start.elapsed();

        assert_eq!(save_resp.uuid, "res-001");
        assert!(save_resp.is_personal_best);
        assert!(duration.as_millis() <= 20, "result_save exceeded 20ms budget: {:?}", duration);

        // Verify aggregates computed from test_result via stats summary
        let summary = crate::commands::stats::stats_summary_internal(&manager, None, None).unwrap();
        assert_eq!(summary.total_tests, 1);
        assert_eq!(summary.total_words, 25);
        assert_eq!(summary.highest_wpm, 75.0);

        // Save second result with higher WPM -> new PB
        let result2 = TestResultDto {
            uuid: "res-002".to_string(),
            mode: "words".to_string(),
            mode_variant: "25".to_string(),
            language: "en".to_string(),
            wpm: 90.0,
            raw_wpm: 95.0,
            accuracy: 99.0,
            consistency: Some(88.0),
            duration_seconds: 16.0,
            character_count: 125,
            keystroke_count: 128,
            correct_keystrokes: 125,
            error_keystrokes: 3,
            completed_at: "2026-03-30T10:05:00Z".to_string(),
            is_completed: true,
            payload_json: "{}".to_string(),
        };

        let save_resp2 = save_result_internal(&manager, result2).unwrap();
        assert!(save_resp2.is_personal_best);

        // Verify list returns both results ordered by completed_at desc
        let list = list_results_internal(&manager, None, None, None).unwrap();
        assert_eq!(list.len(), 2);
        assert_eq!(list[0].uuid, "res-002");
        assert_eq!(list[1].uuid, "res-001");

        // Verify zen mode result save is rejected
        let zen_result = TestResultDto {
            uuid: "res-zen".to_string(),
            mode: "zen".to_string(),
            mode_variant: "".to_string(),
            language: "en".to_string(),
            wpm: 120.0,
            raw_wpm: 120.0,
            accuracy: 100.0,
            consistency: None,
            duration_seconds: 30.0,
            character_count: 200,
            keystroke_count: 200,
            correct_keystrokes: 200,
            error_keystrokes: 0,
            completed_at: "2026-03-30T10:10:00Z".to_string(),
            is_completed: true,
            payload_json: "{}".to_string(),
        };
        assert!(save_result_internal(&manager, zen_result).is_err());

        // Verify incomplete / failed test result save is a no-op and never saved to db or history
        let incomplete_result = TestResultDto {
            uuid: "res-failed".to_string(),
            mode: "words".to_string(),
            mode_variant: "25".to_string(),
            language: "en".to_string(),
            wpm: 60.0,
            raw_wpm: 65.0,
            accuracy: 90.0,
            consistency: Some(80.0),
            duration_seconds: 10.0,
            character_count: 50,
            keystroke_count: 55,
            correct_keystrokes: 50,
            error_keystrokes: 5,
            completed_at: "2026-03-30T10:15:00Z".to_string(),
            is_completed: false,
            payload_json: "{}".to_string(),
        };
        let save_incomplete_resp = save_result_internal(&manager, incomplete_result).unwrap();
        assert_eq!(save_incomplete_resp.id, 0);
        assert!(!save_incomplete_resp.is_personal_best);

        let list_after_failed = list_results_internal(&manager, None, None, None).unwrap();
        assert_eq!(list_after_failed.len(), 2);

        let _ = fs::remove_dir_all(&base_dir);
    }

    #[test]
    fn test_tech_mode_result_save_and_history_filtering() {
        let base_dir = temp_test_dir("tech_mode");
        let manager = DatabaseManager::new(base_dir.clone()).unwrap();
        manager.create_profile("Techie", "techie").unwrap();

        let tech_result = TestResultDto {
            uuid: "res-tech-001".to_string(),
            mode: "tech".to_string(),
            mode_variant: "short".to_string(),
            language: "docker".to_string(),
            wpm: 68.0,
            raw_wpm: 72.0,
            accuracy: 97.5,
            consistency: Some(82.0),
            duration_seconds: 14.5,
            character_count: 85,
            keystroke_count: 90,
            correct_keystrokes: 85,
            error_keystrokes: 5,
            completed_at: "2026-03-30T11:00:00Z".to_string(),
            is_completed: true,
            payload_json: "{}".to_string(),
        };

        // 1. Must successfully save into database
        let save_resp = save_result_internal(&manager, tech_result).unwrap();
        assert_eq!(save_resp.uuid, "res-tech-001");
        assert!(save_resp.is_personal_best);

        // 2. Querying history with mode: Some("tech") returns exactly this result
        let tech_list = list_results_internal(&manager, None, None, Some("tech".to_string())).unwrap();
        assert_eq!(tech_list.len(), 1);
        assert_eq!(tech_list[0].uuid, "res-tech-001");
        assert_eq!(tech_list[0].mode, "tech");
        assert_eq!(tech_list[0].mode_variant, "short");
        assert_eq!(tech_list[0].language, "docker");

        // 3. Querying history with mode: Some("quote") returns 0 results (proper isolation)
        let quote_list = list_results_internal(&manager, None, None, Some("quote".to_string())).unwrap();
        assert_eq!(quote_list.len(), 0);

        // 4. Querying history with mode: None / "all" returns the tech result
        let all_list = list_results_internal(&manager, None, None, None).unwrap();
        assert_eq!(all_list.len(), 1);
        assert_eq!(all_list[0].uuid, "res-tech-001");

        let _ = fs::remove_dir_all(&base_dir);
    }
}
