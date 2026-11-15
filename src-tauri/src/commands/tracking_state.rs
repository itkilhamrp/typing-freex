use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::collect_rows;
use crate::db::manager::DatabaseManager;
use crate::db::migrate::chrono_now_iso;
use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TrackingStateEntry {
    pub key: String,
    pub value: i64,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TrackingStateUpdateDto {
    pub key: String,
    pub value: i64,
}

#[tauri::command]
pub async fn tracking_state_load(
    manager: State<'_, DatabaseManager>,
) -> AppResult<Vec<TrackingStateEntry>> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        mgr.with_active_profile(|_uuid, conn| {
            let mut stmt = conn
                .prepare("SELECT key, value, updated_at FROM tracking_state ORDER BY key")
                .map_err(|e| AppError::Database(e.to_string()))?;

            let rows = stmt
                .query_map([], |row| {
                    Ok(TrackingStateEntry {
                        key: row.get(0)?,
                        value: row.get(1)?,
                        updated_at: row.get(2)?,
                    })
                })
                .map_err(|e| AppError::Database(e.to_string()))?;

            collect_rows(rows)
        })
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn tracking_state_save(
    manager: State<'_, DatabaseManager>,
    entries: Vec<TrackingStateUpdateDto>,
) -> AppResult<()> {
    if entries.is_empty() {
        return Ok(());
    }

    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let now = chrono_now_iso();
        mgr.with_active_profile_mut(|_uuid, conn| {
            let tx = conn
                .transaction()
                .map_err(|e| AppError::Database(format!("Failed to begin transaction: {}", e)))?;

            {
                let mut stmt = tx
                    .prepare(
                        "INSERT INTO tracking_state (key, value, updated_at)
                         VALUES (?1, ?2, ?3)
                         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
                    )
                    .map_err(|e| AppError::Database(e.to_string()))?;

                for item in entries {
                    stmt.execute(params![item.key, item.value, now]).map_err(|e| {
                        AppError::Database(format!("Failed to save tracking state {}: {}", item.key, e))
                    })?;
                }
            }

            tx.commit().map_err(|e| {
                AppError::Database(format!("Failed to commit tracking state save: {}", e))
            })?;

            Ok(())
        })
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

