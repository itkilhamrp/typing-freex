use std::collections::HashMap;
use tauri::State;
use rusqlite::params;
use crate::db::manager::DatabaseManager;
use crate::db::migrate::chrono_now_iso;
use crate::db::registry::{get_app_setting, set_app_setting};
use crate::domain::settings::validate_setting;
use crate::error::{AppError, AppResult};

pub fn settings_get_internal(
    manager: &DatabaseManager,
    keys: &[String],
) -> AppResult<HashMap<String, String>> {
    let mut results = HashMap::new();

    for key in keys {
        if key.starts_with("app.") {
            let val_opt = manager.with_registry(|conn| get_app_setting(conn, key))?;
            if let Some(val) = val_opt {
                results.insert(key.clone(), val);
            }
        } else {
            // Profile-level setting with graceful fallback
            let val_opt = manager.with_active_profile(|_uuid, conn| {
                let mut stmt = conn
                    .prepare("SELECT value FROM setting WHERE key = ?1")
                    .map_err(|e| AppError::Database(e.to_string()))?;
                let val: Option<String> = stmt.query_row([key], |row| row.get(0)).ok();
                Ok(val)
            }).unwrap_or(None);

            if let Some(val) = val_opt {
                results.insert(key.clone(), val);
            } else if key == "ui.theme" || key == "ui.locale" {
                // Global UI setting fallback from registry app_setting
                if let Ok(Some(global_val)) = manager.with_registry(|conn| get_app_setting(conn, key)) {
                    results.insert(key.clone(), global_val);
                }
            }
        }
    }

    Ok(results)
}

pub fn settings_set_internal(
    manager: &DatabaseManager,
    entries: &HashMap<String, String>,
) -> AppResult<()> {
    // 1. Validate all entries upfront before modifying any database state
    for (key, value) in entries {
        validate_setting(key, value)?;
    }

    let now = chrono_now_iso();

    // 2. Write global/fallback settings to registry
    for (key, value) in entries {
        if key.starts_with("app.") || key == "ui.theme" || key == "ui.locale" {
            manager.with_registry(|conn| set_app_setting(conn, key, value))?;
        }
    }

    // 3. Write profile-scoped settings atomically in a single transaction
    let profile_entries: Vec<(&String, &String)> = entries
        .iter()
        .filter(|(k, _)| !k.starts_with("app."))
        .collect();

    if !profile_entries.is_empty() {
        let res = manager.with_active_profile_mut(|_uuid, conn| {
            let tx = conn
                .transaction()
                .map_err(|e| AppError::Database(format!("Failed to begin settings transaction: {}", e)))?;

            for (key, value) in &profile_entries {
                tx.execute(
                    "INSERT INTO setting (key, value, updated_at) VALUES (?1, ?2, ?3)
                     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
                    params![key, value, now],
                )
                .map_err(|e| AppError::Database(format!("Failed to save setting {}: {}", key, e)))?;
            }

            tx.commit()
                .map_err(|e| AppError::Database(format!("Failed to commit settings transaction: {}", e)))?;
            Ok(())
        });

        if let Err(err) = res {
            let only_global_ui = profile_entries
                .iter()
                .all(|(k, _)| *k == "ui.theme" || *k == "ui.locale");
            match err {
                AppError::NotFound(_) if only_global_ui => {}
                other => return Err(other),
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn settings_get(
    manager: State<'_, DatabaseManager>,
    keys: Vec<String>,
) -> AppResult<HashMap<String, String>> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || settings_get_internal(&mgr, &keys))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn settings_set(
    manager: State<'_, DatabaseManager>,
    entries: HashMap<String, String>,
) -> AppResult<()> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || settings_set_internal(&mgr, &entries))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use uuid::Uuid;

    fn temp_test_dir(name: &str) -> PathBuf {
        let p = std::env::temp_dir().join(format!("tfrx_set_{}_{}", name, Uuid::new_v4()));
        let _ = fs::remove_dir_all(&p);
        p
    }

    #[test]
    fn test_theme_and_locale_persistence_with_fallback() {
        let base_dir = temp_test_dir("theme_persistence");
        let manager = DatabaseManager::new(base_dir.clone()).unwrap();

        // 1. Setting ui.theme before any profile exists still writes to app_setting fallback
        let mut map = HashMap::new();
        map.insert("ui.theme".to_string(), "light".to_string());
        map.insert("ui.locale".to_string(), "id".to_string());
        settings_set_internal(&manager, &map).unwrap();

        // 2. Getting ui.theme succeeds via app_setting fallback
        let retrieved = settings_get_internal(
            &manager,
            &["ui.theme".to_string(), "ui.locale".to_string()],
        ).unwrap();
        assert_eq!(retrieved.get("ui.theme").map(|s| s.as_str()), Some("light"));
        assert_eq!(retrieved.get("ui.locale").map(|s| s.as_str()), Some("id"));

        // 3. Create active profile and update theme to dark
        manager.create_profile("Alice", "alice").unwrap();
        let mut map2 = HashMap::new();
        map2.insert("ui.theme".to_string(), "dark".to_string());
        settings_set_internal(&manager, &map2).unwrap();

        let retrieved2 = settings_get_internal(
            &manager,
            &["ui.theme".to_string()],
        ).unwrap();
        assert_eq!(retrieved2.get("ui.theme").map(|s| s.as_str()), Some("dark"));

        let _ = fs::remove_dir_all(&base_dir);
    }

    #[test]
    fn test_profile_scoped_setting_isolation() {
        let base_dir = temp_test_dir("profile_scoped_settings");
        let manager = DatabaseManager::new(base_dir.clone()).unwrap();

        // 1. Create two profiles: Alice and Bob
        let alice = manager.create_profile("Alice", "alice").unwrap();
        let bob = manager.create_profile("Bob", "bob").unwrap();

        // 2. Switch to Alice and set test.forgiving_accuracy to true
        manager.switch_profile(&alice.uuid).unwrap();
        let mut map_alice = HashMap::new();
        map_alice.insert("test.forgiving_accuracy".to_string(), "true".to_string());
        settings_set_internal(&manager, &map_alice).unwrap();

        let retrieved_alice = settings_get_internal(
            &manager,
            &["test.forgiving_accuracy".to_string()],
        ).unwrap();
        assert_eq!(retrieved_alice.get("test.forgiving_accuracy").map(|s| s.as_str()), Some("true"));

        // 3. Switch to Bob and verify Bob does not inherit Alice's test.forgiving_accuracy
        manager.switch_profile(&bob.uuid).unwrap();
        let retrieved_bob = settings_get_internal(
            &manager,
            &["test.forgiving_accuracy".to_string()],
        ).unwrap();
        assert_eq!(retrieved_bob.get("test.forgiving_accuracy"), None);

        // 4. Bob sets it to false
        let mut map_bob = HashMap::new();
        map_bob.insert("test.forgiving_accuracy".to_string(), "false".to_string());
        settings_set_internal(&manager, &map_bob).unwrap();

        let retrieved_bob2 = settings_get_internal(
            &manager,
            &["test.forgiving_accuracy".to_string()],
        ).unwrap();
        assert_eq!(retrieved_bob2.get("test.forgiving_accuracy").map(|s| s.as_str()), Some("false"));

        // 5. Switch back to Alice and verify Alice is still true (completely isolated)
        manager.switch_profile(&alice.uuid).unwrap();
        let retrieved_alice2 = settings_get_internal(
            &manager,
            &["test.forgiving_accuracy".to_string()],
        ).unwrap();
        assert_eq!(retrieved_alice2.get("test.forgiving_accuracy").map(|s| s.as_str()), Some("true"));

        let _ = fs::remove_dir_all(&base_dir);
    }
}
