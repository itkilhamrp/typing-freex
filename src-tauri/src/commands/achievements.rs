use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::collect_rows;
use crate::db::manager::DatabaseManager;
use crate::db::migrate::chrono_now_iso;
use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AchievementDto {
    pub achievement_id: String,
    pub category: String,
    pub current_value: i64,
    pub target_value: i64,
    pub tier: i32,
    pub unlocked: bool,
    pub unlocked_at: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AchievementUpdateDto {
    pub achievement_id: String,
    pub current_value: i64,
    pub target_value: i64,
    pub tier: i32,
    pub unlocked: bool,
    pub unlocked_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AchievementSeedDto {
    pub achievement_id: String,
    pub category: String,
    pub target_value: i64,
    pub tier: i32,
}

#[tauri::command]
pub async fn achievement_list(
    manager: State<'_, DatabaseManager>,
) -> AppResult<Vec<AchievementDto>> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        mgr.with_active_profile(|_uuid, conn| {
            let mut stmt = conn
                .prepare(
                    "SELECT achievement_id, category, current_value, target_value, tier, unlocked, unlocked_at, updated_at
                     FROM achievements
                     ORDER BY category, achievement_id",
                )
                .map_err(|e| AppError::Database(e.to_string()))?;

            let rows = stmt
                .query_map([], |row| {
                    let unlocked_int: i32 = row.get(5)?;
                    Ok(AchievementDto {
                        achievement_id: row.get(0)?,
                        category: row.get(1)?,
                        current_value: row.get(2)?,
                        target_value: row.get(3)?,
                        tier: row.get(4)?,
                        unlocked: unlocked_int == 1,
                        unlocked_at: row.get(6)?,
                        updated_at: row.get(7)?,
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
pub async fn achievement_batch_upsert(
    manager: State<'_, DatabaseManager>,
    updates: Vec<AchievementUpdateDto>,
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
                        "UPDATE achievements
                         SET current_value = ?1,
                             target_value = ?2,
                             tier = ?3,
                             unlocked = ?4,
                             unlocked_at = ?5,
                             updated_at = ?6
                         WHERE achievement_id = ?7",
                    )
                    .map_err(|e| AppError::Database(e.to_string()))?;

                for u in updates {
                    let unlocked_int = if u.unlocked { 1 } else { 0 };
                    stmt.execute(params![
                        u.current_value,
                        u.target_value,
                        u.tier,
                        unlocked_int,
                        u.unlocked_at,
                        now,
                        u.achievement_id,
                    ])
                    .map_err(|e| {
                        AppError::Database(format!(
                            "Failed to update achievement {}: {}",
                            u.achievement_id, e
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
pub async fn achievement_seed(
    manager: State<'_, DatabaseManager>,
    definitions: Vec<AchievementSeedDto>,
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
                        "INSERT OR IGNORE INTO achievements (
                            achievement_id, category, current_value, target_value, tier, unlocked, unlocked_at, updated_at
                         ) VALUES (?1, ?2, 0, ?3, ?4, 0, NULL, ?5)",
                    )
                    .map_err(|e| AppError::Database(e.to_string()))?;

                for def in definitions {
                    stmt.execute(params![
                        def.achievement_id,
                        def.category,
                        def.target_value,
                        def.tier,
                        now,
                    ])
                    .map_err(|e| {
                        AppError::Database(format!(
                            "Failed to seed achievement {}: {}",
                            def.achievement_id, e
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
