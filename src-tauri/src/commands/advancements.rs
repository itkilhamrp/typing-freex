use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::collect_rows;
use crate::db::manager::DatabaseManager;
use crate::db::migrate::chrono_now_iso;
use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AdvancementDto {
    pub advancement_id: String,
    pub category: String,
    pub rank: i32,
    pub unlocked: bool,
    pub unlocked_at: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AdvancementUpdateDto {
    pub advancement_id: String,
    pub unlocked: bool,
    pub unlocked_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AdvancementSeedDto {
    pub advancement_id: String,
    pub category: String,
    pub rank: i32,
}

#[tauri::command]
pub async fn advancement_list(
    manager: State<'_, DatabaseManager>,
) -> AppResult<Vec<AdvancementDto>> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        mgr.with_active_profile(|_uuid, conn| {
            let mut stmt = conn
                .prepare(
                    "SELECT advancement_id, category, rank, unlocked, unlocked_at, updated_at
                     FROM advancements
                     ORDER BY category, advancement_id",
                )
                .map_err(|e| AppError::Database(e.to_string()))?;

            let rows = stmt
                .query_map([], |row| {
                    let unlocked_int: i32 = row.get(3)?;
                    Ok(AdvancementDto {
                        advancement_id: row.get(0)?,
                        category: row.get(1)?,
                        rank: row.get(2)?,
                        unlocked: unlocked_int == 1,
                        unlocked_at: row.get(4)?,
                        updated_at: row.get(5)?,
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
pub async fn advancement_batch_upsert(
    manager: State<'_, DatabaseManager>,
    updates: Vec<AdvancementUpdateDto>,
) -> AppResult<()> {
    if updates.is_empty() {
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
                        "UPDATE advancements
                         SET unlocked = ?1,
                             unlocked_at = ?2,
                             updated_at = ?3
                         WHERE advancement_id = ?4",
                    )
                    .map_err(|e| AppError::Database(e.to_string()))?;

                for u in updates {
                    let unlocked_int = if u.unlocked { 1 } else { 0 };
                    stmt.execute(params![unlocked_int, u.unlocked_at, now, u.advancement_id])
                        .map_err(|e| {
                            AppError::Database(format!(
                                "Failed to update advancement {}: {}",
                                u.advancement_id, e
                            ))
                        })?;
                }
            }

            tx.commit()
                .map_err(|e| AppError::Database(format!("Failed to commit batch upsert: {}", e)))?;

            Ok(())
        })
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn advancement_seed(
    manager: State<'_, DatabaseManager>,
    definitions: Vec<AdvancementSeedDto>,
) -> AppResult<()> {
    if definitions.is_empty() {
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
                        "INSERT OR IGNORE INTO advancements (
                            advancement_id, category, rank, unlocked, unlocked_at, updated_at
                         ) VALUES (?1, ?2, ?3, 0, NULL, ?4)",
                    )
                    .map_err(|e| AppError::Database(e.to_string()))?;

                for def in definitions {
                    stmt.execute(params![def.advancement_id, def.category, def.rank, now])
                        .map_err(|e| {
                            AppError::Database(format!(
                                "Failed to seed advancement {}: {}",
                                def.advancement_id, e
                            ))
                        })?;
                }
            }

            tx.commit()
                .map_err(|e| AppError::Database(format!("Failed to commit seed: {}", e)))?;

            Ok(())
        })
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

