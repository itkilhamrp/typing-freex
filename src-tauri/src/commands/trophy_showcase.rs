use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::collect_rows;
use crate::db::manager::DatabaseManager;
use crate::db::migrate::chrono_now_iso;
use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TrophyShowcaseDto {
    pub slot: i32,
    pub item_id: Option<String>,
    pub item_type: Option<String>,
    pub pinned_at: Option<String>,
}

#[tauri::command]
pub async fn trophy_showcase_get(
    manager: State<'_, DatabaseManager>,
) -> AppResult<Vec<TrophyShowcaseDto>> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        mgr.with_active_profile(|_uuid, conn| {
            let mut slots_map = std::collections::HashMap::new();

            let mut stmt = conn
                .prepare("SELECT slot, item_id, item_type, pinned_at FROM trophy_showcase ORDER BY slot")
                .map_err(|e| AppError::Database(e.to_string()))?;

            let rows = stmt
                .query_map([], |row| {
                    Ok(TrophyShowcaseDto {
                        slot: row.get(0)?,
                        item_id: row.get(1)?,
                        item_type: row.get(2)?,
                        pinned_at: row.get(3)?,
                    })
                })
                .map_err(|e| AppError::Database(e.to_string()))?;

            let items = collect_rows(rows)?;
            for item in items {
                slots_map.insert(item.slot, item);
            }

            let mut result = Vec::with_capacity(7);
            for slot in 1..=7 {
                if let Some(entry) = slots_map.remove(&slot) {
                    result.push(entry);
                } else {
                    result.push(TrophyShowcaseDto {
                        slot,
                        item_id: None,
                        item_type: None,
                        pinned_at: None,
                    });
                }
            }

            Ok(result)
        })
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn trophy_showcase_set(
    manager: State<'_, DatabaseManager>,
    slot: i32,
    item_id: Option<String>,
    item_type: Option<String>,
) -> AppResult<()> {
    if !(1..=7).contains(&slot) {
        return Err(AppError::Validation("Slot must be between 1 and 7".to_string()));
    }

    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let now = chrono_now_iso();
        mgr.with_active_profile_mut(|_uuid, conn| {
            let tx = conn
                .transaction()
                .map_err(|e| AppError::Database(e.to_string()))?;

            match (item_id, item_type) {
                (Some(ref id), Some(ref itype)) => {
                    let is_unlocked: bool = match itype.as_str() {
                        "achievement" => tx
                            .query_row(
                                "SELECT (unlocked = 1 OR tier > 0) FROM achievements WHERE achievement_id = ?1",
                                params![id],
                                |row| row.get(0),
                            )
                            .unwrap_or(false),
                        "advancement" => tx
                            .query_row(
                                "SELECT (unlocked = 1) FROM advancements WHERE advancement_id = ?1",
                                params![id],
                                |row| row.get(0),
                            )
                            .unwrap_or(false),
                        _ => {
                            return Err(AppError::Validation(format!(
                                "Invalid item_type '{}': must be 'achievement' or 'advancement'",
                                itype
                            )));
                        }
                    };

                    if !is_unlocked {
                        return Err(AppError::Validation(
                            "Cannot pin a locked trophy to showcase".to_string(),
                        ));
                    }

                    // If this trophy is pinned in another slot, unpin it first to prevent duplicates
                    tx.execute(
                        "DELETE FROM trophy_showcase WHERE item_id = ?1 AND slot != ?2",
                        params![id, slot],
                    )
                    .map_err(|e| AppError::Database(e.to_string()))?;

                    tx.execute(
                        "INSERT INTO trophy_showcase (slot, item_id, item_type, pinned_at)
                         VALUES (?1, ?2, ?3, ?4)
                         ON CONFLICT(slot) DO UPDATE SET item_id = excluded.item_id, item_type = excluded.item_type, pinned_at = excluded.pinned_at",
                        params![slot, id, itype, now],
                    )
                    .map_err(|e| AppError::Database(e.to_string()))?;
                }
                (None, None) => {
                    tx.execute("DELETE FROM trophy_showcase WHERE slot = ?1", params![slot])
                        .map_err(|e| AppError::Database(e.to_string()))?;
                }
                (Some(_), None) | (None, Some(_)) => {
                    return Err(AppError::Validation(
                        "Both item_id and item_type must be provided together or both omitted"
                            .to_string(),
                    ));
                }
            }

            tx.commit()
                .map_err(|e| AppError::Database(e.to_string()))?;
            Ok(())
        })
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

