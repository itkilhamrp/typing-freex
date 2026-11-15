use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use rusqlite::Connection;
use uuid::Uuid;
use crate::error::AppError;
use super::migrate::run_migrations;
use super::registry::{
    create_profile, delete_profile, get_active_profile_uuid, get_profile,
    init_registry, list_profiles, rename_profile, resolve_unique_slug, set_active_profile_uuid,
    ProfileRecord,
};

pub struct ActiveProfileConnection {
    pub uuid: String,
    pub conn: Connection,
}

#[derive(Clone)]
pub struct DatabaseManager {
    base_dir: PathBuf,
    registry_conn: Arc<Mutex<Connection>>,
    active_profile: Arc<Mutex<Option<ActiveProfileConnection>>>,
}

const REGISTRY_LOCK_ERR: &str = "Failed to acquire registry lock";
const PROFILE_LOCK_ERR: &str = "Failed to acquire active profile lock";

impl DatabaseManager {
    pub fn new(base_dir: PathBuf) -> Result<Self, AppError> {
        // Ensure standard directory layout (§3.2)
        fs::create_dir_all(base_dir.join("profiles"))
            .map_err(|e| AppError::Io(format!("Failed to create profiles dir: {}", e)))?;
        fs::create_dir_all(base_dir.join("backups"))
            .map_err(|e| AppError::Io(format!("Failed to create backups dir: {}", e)))?;
        fs::create_dir_all(base_dir.join("content_cache"))
            .map_err(|e| AppError::Io(format!("Failed to create content_cache dir: {}", e)))?;
        fs::create_dir_all(base_dir.join("temp"))
            .map_err(|e| AppError::Io(format!("Failed to create temp dir: {}", e)))?;

        // Initialize registry.db
        let registry_path = base_dir.join("registry.db");
        let mut reg_conn = Connection::open(&registry_path)
            .map_err(|e| AppError::Database(format!("Failed to open registry.db: {}", e)))?;
        init_registry(&mut reg_conn)?;

        // Try to load active profile if one was recorded
        let active_uuid = get_active_profile_uuid(&reg_conn)?;
        let mut active_conn_opt = None;

        if let Some(uuid) = active_uuid {
            let db_path = profile_db_path(&base_dir, &uuid);
            if db_path.exists()
                && let Ok(mut p_conn) = Connection::open(&db_path)
                && run_migrations(&mut p_conn).is_ok()
            {
                active_conn_opt = Some(ActiveProfileConnection {
                    uuid,
                    conn: p_conn,
                });
            }
        }

        if active_conn_opt.is_none()
            && let Ok(existing_profiles) = list_profiles(&reg_conn)
            && let Some(first_profile) = existing_profiles.first()
        {
            let db_path = profile_db_path(&base_dir, &first_profile.uuid);
            if db_path.exists()
                && let Ok(mut p_conn) = Connection::open(&db_path)
                && run_migrations(&mut p_conn).is_ok()
            {
                let _ = set_active_profile_uuid(&reg_conn, &first_profile.uuid);
                active_conn_opt = Some(ActiveProfileConnection {
                    uuid: first_profile.uuid.clone(),
                    conn: p_conn,
                });
            }
        }

        Ok(Self {
            base_dir,
            registry_conn: Arc::new(Mutex::new(reg_conn)),
            active_profile: Arc::new(Mutex::new(active_conn_opt)),
        })
    }

    pub fn app_data_dir(&self) -> &PathBuf {
        &self.base_dir
    }

    pub fn register_existing_profile(&self, record: &ProfileRecord) -> Result<(), AppError> {
        let reg = self
            .registry_conn
            .lock()
            .map_err(|_| AppError::Internal(REGISTRY_LOCK_ERR.to_string()))?;
        create_profile(&reg, &record.uuid, &record.name, &record.slug, &record.db_path)?;
        Ok(())
    }

    pub fn resolve_unique_slug(&self, base_slug: &str) -> Result<String, AppError> {
        let reg = self
            .registry_conn
            .lock()
            .map_err(|_| AppError::Internal(REGISTRY_LOCK_ERR.to_string()))?;
        resolve_unique_slug(&reg, base_slug)
    }

    pub fn with_registry<F, R>(&self, f: F) -> Result<R, AppError>
    where
        F: FnOnce(&Connection) -> Result<R, AppError>,
    {
        let conn = self
            .registry_conn
            .lock()
            .map_err(|_| AppError::Internal(REGISTRY_LOCK_ERR.to_string()))?;
        f(&conn)
    }

    pub fn with_registry_mut<F, R>(&self, f: F) -> Result<R, AppError>
    where
        F: FnOnce(&mut Connection) -> Result<R, AppError>,
    {
        let mut conn = self
            .registry_conn
            .lock()
            .map_err(|_| AppError::Internal(REGISTRY_LOCK_ERR.to_string()))?;
        f(&mut conn)
    }

    pub fn with_active_profile<F, R>(&self, f: F) -> Result<R, AppError>
    where
        F: FnOnce(&str, &Connection) -> Result<R, AppError>,
    {
        let active_guard = self
            .active_profile
            .lock()
            .map_err(|_| AppError::Internal(PROFILE_LOCK_ERR.to_string()))?;

        match active_guard.as_ref() {
            Some(active) => f(&active.uuid, &active.conn),
            None => Err(AppError::NotFound("No active profile selected".to_string())),
        }
    }

    pub fn with_active_profile_mut<F, R>(&self, f: F) -> Result<R, AppError>
    where
        F: FnOnce(&str, &mut Connection) -> Result<R, AppError>,
    {
        let mut active_guard = self
            .active_profile
            .lock()
            .map_err(|_| AppError::Internal(PROFILE_LOCK_ERR.to_string()))?;

        match active_guard.as_mut() {
            Some(active) => f(&active.uuid, &mut active.conn),
            None => Err(AppError::NotFound("No active profile selected".to_string())),
        }
    }

    pub fn get_active_profile(&self) -> Result<Option<ProfileRecord>, AppError> {
        let active_uuid = {
            let active_guard = self
                .active_profile
                .lock()
                .map_err(|_| AppError::Internal(PROFILE_LOCK_ERR.to_string()))?;
            active_guard.as_ref().map(|a| a.uuid.clone())
        };

        if let Some(uuid) = active_uuid {
            let reg = self
                .registry_conn
                .lock()
                .map_err(|_| AppError::Internal(REGISTRY_LOCK_ERR.to_string()))?;
            get_profile(&reg, &uuid)
        } else {
            Ok(None)
        }
    }

    pub fn list_profiles(&self) -> Result<Vec<ProfileRecord>, AppError> {
        let reg = self
            .registry_conn
            .lock()
            .map_err(|_| AppError::Internal(REGISTRY_LOCK_ERR.to_string()))?;
        list_profiles(&reg)
    }

    pub fn create_profile(&self, name: &str, slug: &str) -> Result<ProfileRecord, AppError> {
        let uuid = Uuid::new_v4().to_string();
        let profile_dir = self.base_dir.join("profiles").join(&uuid);
        fs::create_dir_all(&profile_dir)
            .map_err(|e| AppError::Io(format!("Failed to create profile dir: {}", e)))?;

        let db_file_path = profile_dir.join("typing_freex.db");
        let mut p_conn = match Connection::open(&db_file_path) {
            Ok(conn) => conn,
            Err(e) => {
                let _ = fs::remove_dir_all(&profile_dir);
                return Err(AppError::Database(format!(
                    "Failed to create profile database: {}",
                    e
                )));
            }
        };

        if let Err(e) = run_migrations(&mut p_conn) {
            drop(p_conn);
            let _ = fs::remove_dir_all(&profile_dir);
            return Err(e);
        }

        if let Err(e) = p_conn.execute(
            "INSERT INTO profile_meta (key, value) VALUES ('uuid', ?1), ('name', ?2), ('slug', ?3)",
            rusqlite::params![&uuid, name, slug],
        ) {
            drop(p_conn);
            let _ = fs::remove_dir_all(&profile_dir);
            return Err(AppError::Database(format!(
                "Failed to write profile_meta: {}",
                e
            )));
        }

        let rel_path = format!("profiles/{}/typing_freex.db", uuid);
        let reg = match self.registry_conn.lock() {
            Ok(g) => g,
            Err(_) => {
                drop(p_conn);
                let _ = fs::remove_dir_all(&profile_dir);
                return Err(AppError::Internal(REGISTRY_LOCK_ERR.to_string()));
            }
        };

        let record = match create_profile(&reg, &uuid, name, slug, &rel_path) {
            Ok(rec) => rec,
            Err(e) => {
                drop(reg);
                drop(p_conn);
                let _ = fs::remove_dir_all(&profile_dir);
                return Err(e);
            }
        };

        // If no active profile currently exists, activate this one
        let mut active_guard = self
            .active_profile
            .lock()
            .map_err(|_| AppError::Internal(PROFILE_LOCK_ERR.to_string()))?;

        if active_guard.is_none() {
            set_active_profile_uuid(&reg, &uuid)?;
            *active_guard = Some(ActiveProfileConnection {
                uuid,
                conn: p_conn,
            });
        }

        Ok(record)
    }

    pub fn switch_profile(&self, target_uuid: &str) -> Result<ProfileRecord, AppError> {
        let reg = self
            .registry_conn
            .lock()
            .map_err(|_| AppError::Internal(REGISTRY_LOCK_ERR.to_string()))?;

        let profile = get_profile(&reg, target_uuid)?
            .ok_or_else(|| AppError::NotFound(format!("Profile {} not found", target_uuid)))?;

        let mut active_guard = self
            .active_profile
            .lock()
            .map_err(|_| AppError::Internal(PROFILE_LOCK_ERR.to_string()))?;

        // 1. Checkpoint WAL on old connection before closing
        if let Some(ref current) = *active_guard {
            let _ = current.conn.execute_batch("PRAGMA wal_checkpoint(PASSIVE);");
        }

        // 2. Open new profile database and verify migrations
        let db_path = profile_db_path(&self.base_dir, target_uuid);
        let mut target_conn = Connection::open(&db_path)
            .map_err(|e| AppError::Database(format!("Failed to open profile database: {}", e)))?;

        run_migrations(&mut target_conn)?;

        // 3. Update registry active_profile pointer
        set_active_profile_uuid(&reg, target_uuid)?;

        // 4. Swap active connection
        *active_guard = Some(ActiveProfileConnection {
            uuid: target_uuid.to_string(),
            conn: target_conn,
        });

        Ok(profile)
    }

    pub fn rename_profile(&self, uuid: &str, new_name: &str) -> Result<(), AppError> {
        {
            let reg = self
                .registry_conn
                .lock()
                .map_err(|_| AppError::Internal(REGISTRY_LOCK_ERR.to_string()))?;
            rename_profile(&reg, uuid, new_name)?;
        }

        // Synchronize profile_meta ('name') in the profile database
        let active_guard = self
            .active_profile
            .lock()
            .map_err(|_| AppError::Internal(PROFILE_LOCK_ERR.to_string()))?;

        if let Some(ref active) = *active_guard
            && active.uuid == uuid
        {
            active
                .conn
                .execute(
                    "INSERT INTO profile_meta (key, value) VALUES ('name', ?1)
                     ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                    [new_name],
                )
                .map_err(|e| {
                    AppError::Database(format!("Failed to update profile_meta name: {}", e))
                })?;
            return Ok(());
        }
        drop(active_guard);

        let db_path = profile_db_path(&self.base_dir, uuid);
        if db_path.exists()
            && let Ok(conn) = Connection::open(&db_path)
        {
            let _ = super::migrate::configure_connection(&conn);
            let _ = conn.execute(
                "INSERT INTO profile_meta (key, value) VALUES ('name', ?1)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                [new_name],
            );
        }

        Ok(())
    }

    pub fn delete_profile(&self, uuid: &str) -> Result<(), AppError> {
        let reg = self
            .registry_conn
            .lock()
            .map_err(|_| AppError::Internal(REGISTRY_LOCK_ERR.to_string()))?;

        let mut active_guard = self
            .active_profile
            .lock()
            .map_err(|_| AppError::Internal(PROFILE_LOCK_ERR.to_string()))?;

        // Delete from registry first (while holding locks in canonical registry -> active_profile order)
        delete_profile(&reg, uuid)?;

        // If the active profile is being deleted, checkpoint and close its connection before removing dir
        if let Some(ref current) = *active_guard
            && current.uuid == uuid
        {
            let _ = current.conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");
            *active_guard = None;
        }
        drop(active_guard);
        drop(reg);

        // Remove disk directory
        let profile_dir = self.base_dir.join("profiles").join(uuid);
        if profile_dir.exists() {
            let _ = fs::remove_dir_all(&profile_dir);
        }

        Ok(())
    }
}

impl Drop for DatabaseManager {
    fn drop(&mut self) {
        if let Ok(active_guard) = self.active_profile.lock()
            && let Some(ref active) = *active_guard
        {
            let _ = active.conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");
        }
        if let Ok(reg) = self.registry_conn.lock() {
            let _ = reg.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");
        }
    }
}

fn profile_db_path(base_dir: &Path, uuid: &str) -> PathBuf {
    base_dir.join("profiles").join(uuid).join("typing_freex.db")
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Instant;

    fn temp_test_dir(name: &str) -> PathBuf {
        let p = std::env::temp_dir().join(format!("tfrx_test_{}_{}", name, Uuid::new_v4()));
        let _ = fs::remove_dir_all(&p);
        p
    }

    #[test]
    fn test_db_manager_profile_lifecycle_and_switching_sla() {
        let base_dir = temp_test_dir("manager");
        let manager = DatabaseManager::new(base_dir.clone()).unwrap();

        // 1. Create two profiles
        let p1 = manager.create_profile("Alice", "alice").unwrap();
        let p2 = manager.create_profile("Bob", "bob").unwrap();

        // First created becomes active automatically
        let active = manager.get_active_profile().unwrap().unwrap();
        assert_eq!(active.uuid, p1.uuid);

        // 2. Switch to Bob and verify latency (NFR-PERF-013: ≤ 150ms p95)
        let start = Instant::now();
        let switched = manager.switch_profile(&p2.uuid).unwrap();
        let switch_duration = start.elapsed();
        assert_eq!(switched.uuid, p2.uuid);
        assert!(switch_duration.as_millis() < 150, "Profile switch took {:?}", switch_duration);

        // Verify active is now Bob
        let active2 = manager.get_active_profile().unwrap().unwrap();
        assert_eq!(active2.uuid, p2.uuid);

        // 3. Rename Bob to Bobby
        manager.rename_profile(&p2.uuid, "Bobby").unwrap();
        let list = manager.list_profiles().unwrap();
        assert_eq!(list.iter().find(|p| p.uuid == p2.uuid).unwrap().name, "Bobby");

        // 4. Delete Alice
        manager.delete_profile(&p1.uuid).unwrap();
        let list_after = manager.list_profiles().unwrap();
        assert_eq!(list_after.len(), 1);

        // Cleanup test directory
        let _ = fs::remove_dir_all(&base_dir);
    }

    #[test]
    fn test_concurrent_profile_operations_no_abba_deadlock() {
        let base_dir = temp_test_dir("concurrent_abba");
        let manager = DatabaseManager::new(base_dir.clone()).unwrap();

        let p1 = manager.create_profile("Alice", "alice").unwrap();
        let p2 = manager.create_profile("Bob", "bob").unwrap();

        std::thread::scope(|s| {
            s.spawn(|| {
                for _ in 0..20 {
                    let active = manager.get_active_profile().unwrap();
                    assert!(active.is_some());
                    let list = manager.list_profiles().unwrap();
                    assert_eq!(list.len(), 2);
                }
            });

            s.spawn(|| {
                for i in 0..20 {
                    let target = if i % 2 == 0 { &p1.uuid } else { &p2.uuid };
                    let switched = manager.switch_profile(target).unwrap();
                    assert_eq!(switched.uuid, *target);
                }
            });

            s.spawn(|| {
                for i in 0..20 {
                    manager
                        .rename_profile(&p1.uuid, &format!("Alice {}", i))
                        .unwrap();
                }
            });

            s.spawn(|| {
                for _ in 0..20 {
                    let count: i64 = manager
                        .with_active_profile(|_uuid, conn| {
                            conn.query_row("SELECT COUNT(*) FROM test_result", [], |r| r.get(0))
                                .map_err(|e| AppError::Database(e.to_string()))
                        })
                        .unwrap();
                    assert_eq!(count, 0);
                }
            });
        });

        let final_list = manager.list_profiles().unwrap();
        assert_eq!(final_list.len(), 2);
        assert!(manager.get_active_profile().unwrap().is_some());

        let _ = fs::remove_dir_all(&base_dir);
    }
}
