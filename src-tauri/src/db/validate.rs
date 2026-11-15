use std::collections::HashMap;
use std::fs::{self, File};
use std::io::Read;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use once_cell::sync::Lazy;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::backup::calculate_sha256;
use crate::db::manager::DatabaseManager;
use crate::db::migrate::{
    chrono_now_iso, is_valid_application_id, run_migrations, APPLICATION_ID,
    CURRENT_SCHEMA_VERSION,
};
use crate::db::registry::ProfileRecord;
use crate::error::{AppError, AppResult};

pub const MAX_IMPORT_BYTES: u64 = 2 * 1024 * 1024 * 1024; // 2 GiB
pub const STAGING_TTL: Duration = Duration::from_secs(300); // 5 minutes

const ALLOWED_TABLES: &[&str] = &[
    "schema_migration",
    "profile_meta",
    "setting",
    "test_result",
    "key_stat",
    "achievements",
    "advancements",
    "tracking_state",
    "trophy_showcase",
    "sqlite_sequence",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportPickSummary {
    pub staging_token: String,
    pub original_filename: String,
    pub profile_name: String,
    pub test_count: usize,
    pub custom_text_count: usize,
    pub date_range: Option<String>,
    pub sha256_hash: String,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrityCheckReport {
    pub ok: bool,
    pub errors: Vec<String>,
}

struct StagedImport {
    quarantine_path: PathBuf,
    profile_name: String,
    created_at: Instant,
}

static STAGING_REGISTRY: Lazy<Arc<Mutex<HashMap<String, StagedImport>>>> =
    Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

fn prune_expired_staging() {
    let mut reg = STAGING_REGISTRY.lock().unwrap_or_else(|e| e.into_inner());
    let now = Instant::now();
    let expired_keys: Vec<String> = reg
        .iter()
        .filter_map(|(k, v)| {
            if now.duration_since(v.created_at) > STAGING_TTL {
                let _ = fs::remove_file(&v.quarantine_path);
                Some(k.clone())
            } else {
                None
            }
        })
        .collect();

    for k in expired_keys {
        reg.remove(&k);
    }
}

pub fn stage_and_validate_import(
    manager: &DatabaseManager,
    source_path: &Path,
) -> AppResult<ImportPickSummary> {
    prune_expired_staging();

    // Stage 1: File existence, extension and size check
    if !source_path.exists() || !source_path.is_file() {
        return Err(AppError::Validation("Import target is not a valid regular file".to_string()));
    }

    let ext = source_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    if !["db", "sqlite", "sqlite3"].contains(&ext.as_str()) {
        return Err(AppError::Validation(format!(
            "Invalid file extension '.{}'. Only .db, .sqlite, and .sqlite3 are allowed",
            ext
        )));
    }

    let metadata = fs::metadata(source_path)
        .map_err(|e| AppError::Io(format!("Failed to read file metadata: {}", e)))?;
    if metadata.len() > MAX_IMPORT_BYTES {
        return Err(AppError::Validation(format!(
            "File size ({} bytes) exceeds maximum limit of 2 GiB",
            metadata.len()
        )));
    }
    if metadata.len() < 512 {
        return Err(AppError::Validation("File is too small to be a valid SQLite database".to_string()));
    }

    // Stage 2: Quarantine copy into app-private temp directory
    let quarantine_dir = manager.app_data_dir().join("quarantine");
    fs::create_dir_all(&quarantine_dir)
        .map_err(|e| AppError::Io(format!("Failed to create quarantine dir: {}", e)))?;

    let staging_token = Uuid::new_v4().to_string();
    let quarantine_path = quarantine_dir.join(format!("{}.db", staging_token));

    fs::copy(source_path, &quarantine_path)
        .map_err(|e| AppError::Io(format!("Failed to copy file to quarantine: {}", e)))?;

    let mut warnings = Vec::new();

    // Stage 3: SHA-256 Checksum Verification
    let computed_hash = calculate_sha256(&quarantine_path)
        .map_err(|e| AppError::Io(format!("Failed to compute SHA-256: {}", e)))?;

    let sidecar_path1 = source_path.with_extension(format!("{}.sha256", ext));
    let sidecar_path2 = PathBuf::from(format!("{}.sha256", source_path.to_string_lossy()));

    let sidecar_path = if sidecar_path1.exists() {
        Some(sidecar_path1)
    } else if sidecar_path2.exists() {
        Some(sidecar_path2)
    } else {
        None
    };

    if let Some(sidecar) = sidecar_path {
        if let Ok(content) = fs::read_to_string(&sidecar) {
            let expected_hash = content.split_whitespace().next().unwrap_or("").to_lowercase();
            if !expected_hash.is_empty() && expected_hash != computed_hash.to_lowercase() {
                let _ = fs::remove_file(&quarantine_path);
                return Err(AppError::Validation(format!(
                    "SHA-256 sidecar checksum mismatch! File may be corrupted or tampered (expected {}, computed {})",
                    expected_hash, computed_hash
                )));
            }
        }
    } else {
        warnings.push("No .sha256 sidecar file found. Checksum could not be pre-verified.".to_string());
    }

    // Stage 4: Header check (First 16 bytes must strictly equal b"SQLite format 3\0")
    let mut header = [0u8; 16];
    let mut file = File::open(&quarantine_path)
        .map_err(|e| AppError::Io(format!("Failed to open quarantine file: {}", e)))?;
    file.read_exact(&mut header)
        .map_err(|e| AppError::Io(format!("Failed to read header: {}", e)))?;
    drop(file);

    if &header != b"SQLite format 3\0" {
        let _ = fs::remove_file(&quarantine_path);
        return Err(AppError::Validation("File header is not a valid SQLite format 3 database".to_string()));
    }

    // Stage 5: Defensive open
    let conn = Connection::open_with_flags(
        &quarantine_path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(|e| {
        let _ = fs::remove_file(&quarantine_path);
        AppError::Database(format!("Failed to open database in read-only mode: {}", e))
    })?;

    conn.execute_batch("PRAGMA query_only = ON; PRAGMA trusted_schema = OFF;")
        .map_err(|e| {
            let _ = fs::remove_file(&quarantine_path);
            AppError::Database(e.to_string())
        })?;

    // Stage 6: Application ID check
    let app_id: u32 = conn
        .query_row("PRAGMA application_id", [], |row| row.get(0))
        .map_err(|e| AppError::Database(e.to_string()))?;

    if !is_valid_application_id(app_id) {
        let _ = fs::remove_file(&quarantine_path);
        return Err(AppError::Validation(format!(
            "Invalid application_id: 0x{:08X}. Expected TFRX (0x{:08X})",
            app_id, APPLICATION_ID
        )));
    }

    // Stage 7: User Version check
    let user_version: u32 = conn
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .map_err(|e| AppError::Database(e.to_string()))?;

    if user_version > CURRENT_SCHEMA_VERSION {
        let _ = fs::remove_file(&quarantine_path);
        return Err(AppError::Validation(format!(
            "Database schema version ({}) is newer than supported by this app ({})",
            user_version, CURRENT_SCHEMA_VERSION
        )));
    }

    // Stage 8: SQLite master inspection (BEFORE integrity_check) & PRAGMA integrity_check
    // Check for illegal objects (triggers, views, virtual tables, disallowed tables)
    {
        let mut stmt = conn
            .prepare("SELECT type, name, COALESCE(sql, '') FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'")
            .map_err(|e| {
                let _ = fs::remove_file(&quarantine_path);
                AppError::Database(e.to_string())
            })?;

        let object_rows = stmt
            .query_map([], |row| {
                let obj_type: String = row.get(0)?;
                let obj_name: String = row.get(1)?;
                let obj_sql: String = row.get(2)?;
                Ok((obj_type, obj_name, obj_sql))
            })
            .map_err(|e| {
                let _ = fs::remove_file(&quarantine_path);
                AppError::Database(e.to_string())
            })?;

        for obj in object_rows {
            let (obj_type, obj_name, obj_sql) = obj.map_err(|e| {
                let _ = fs::remove_file(&quarantine_path);
                AppError::Database(e.to_string())
            })?;
            if obj_type == "trigger" || obj_type == "view" {
                let _ = fs::remove_file(&quarantine_path);
                return Err(AppError::Validation(format!(
                    "Hostile database rejected: contains disallowed {} '{}'",
                    obj_type, obj_name
                )));
            }
            if obj_sql.to_uppercase().contains("VIRTUAL") {
                let _ = fs::remove_file(&quarantine_path);
                return Err(AppError::Validation(format!(
                    "Hostile database rejected: virtual table '{}' is disallowed",
                    obj_name
                )));
            }
            if obj_type == "table" && !ALLOWED_TABLES.contains(&obj_name.as_str()) {
                let _ = fs::remove_file(&quarantine_path);
                return Err(AppError::Validation(format!(
                    "Hostile database rejected: unexpected table '{}' not in allowlist",
                    obj_name
                )));
            }
        }
    }

    let integrity_status: String = conn
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .map_err(|e| {
            let _ = fs::remove_file(&quarantine_path);
            AppError::Database(e.to_string())
        })?;

    if integrity_status != "ok" {
        let _ = fs::remove_file(&quarantine_path);
        return Err(AppError::Validation(format!(
            "SQLite integrity check failed: {}",
            integrity_status
        )));
    }

    // Stage 9: Payload size caps & sampling
    let oversized_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM test_result WHERE length(payload_json) > 524288",
            [],
            |row| row.get(0),
        )
        .map_err(|e| {
            let _ = fs::remove_file(&quarantine_path);
            AppError::Validation(format!("Invalid test_result schema: {}", e))
        })?;

    if oversized_count > 0 {
        let _ = fs::remove_file(&quarantine_path);
        return Err(AppError::Validation(format!(
            "Hostile database rejected: contains {} test results exceeding the 512 KiB payload limit",
            oversized_count
        )));
    }

    // Stage 10: Extract summary data
    let profile_name: String = conn
        .query_row(
            "SELECT value FROM profile_meta WHERE key = 'name'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "Imported Profile".to_string());

    let test_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM test_result", [], |row| row.get(0))
        .unwrap_or(0);

    // Custom texts live globally in registry.db; per-profile database backups do not store them.
    let custom_text_count: usize = 0;

    let date_range: Option<String> = conn
        .query_row(
            "SELECT MIN(completed_at) || ' to ' || MAX(completed_at) FROM test_result",
            [],
            |row| row.get(0),
        )
        .ok();

    let original_filename = source_path
        .file_name()
        .and_then(|f| f.to_str())
        .unwrap_or("import.db")
        .to_string();

    // Register into staging memory
    let mut reg = STAGING_REGISTRY.lock().unwrap_or_else(|e| e.into_inner());
    reg.insert(
        staging_token.clone(),
        StagedImport {
            quarantine_path,
            profile_name: profile_name.clone(),
            created_at: Instant::now(),
        },
    );

    Ok(ImportPickSummary {
        staging_token,
        original_filename,
        profile_name,
        test_count: test_count.max(0) as usize,
        custom_text_count,
        date_range,
        sha256_hash: computed_hash,
        warnings,
    })
}

pub fn commit_validated_import(
    manager: &DatabaseManager,
    staging_token: &str,
    display_name: Option<String>,
) -> AppResult<ProfileRecord> {
    prune_expired_staging();

    let staged = {
        let mut reg = STAGING_REGISTRY.lock().unwrap_or_else(|e| e.into_inner());
        reg.remove(staging_token)
            .ok_or_else(|| AppError::NotFound("Staging token invalid or expired (TTL 5 minutes)".to_string()))?
    };

    if !staged.quarantine_path.exists() {
        return Err(AppError::NotFound("Quarantined database file missing".to_string()));
    }

    // Always generate a fresh UUID to ensure no collision or overwrite (DB-15)
    let new_uuid = Uuid::new_v4().to_string();
    let profile_dir = manager.app_data_dir().join("profiles").join(&new_uuid);
    fs::create_dir_all(&profile_dir)
        .map_err(|e| AppError::Io(format!("Failed to create profile dir: {}", e)))?;

    let destination_db = profile_dir.join("typing_freex.db");

    // Move file into profile directory
    if let Err(e) = fs::rename(&staged.quarantine_path, &destination_db).or_else(|_| {
        fs::copy(&staged.quarantine_path, &destination_db)?;
        fs::remove_file(&staged.quarantine_path)
    }) {
        let _ = fs::remove_dir_all(&profile_dir);
        return Err(AppError::Io(format!("Failed to commit database file: {}", e)));
    }

    let finalize_res: AppResult<ProfileRecord> = (|| {
        // Determine final display name
        let final_name = display_name
            .filter(|n| !n.trim().is_empty())
            .unwrap_or(staged.profile_name);

        let base_slug = crate::domain::profile::generate_slug(&final_name)
            .unwrap_or_else(|_| "profile".to_string());

        // Automatically resolve collision to produce a unique slug without forcing the user to change the display name
        let final_slug = manager.resolve_unique_slug(&base_slug)?;

        // Open connection to run any forward migrations and update metadata
        let mut conn = Connection::open(&destination_db)
            .map_err(|e| AppError::Database(e.to_string()))?;

        crate::db::migrate::configure_connection(&conn)?;

        // Run forward migrations
        run_migrations(&mut conn)?;

        // Upsert metadata
        let now = chrono_now_iso();
        conn.execute(
            "INSERT INTO profile_meta (key, value) VALUES ('uuid', ?1)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            [&new_uuid],
        )
        .map_err(|e| AppError::Database(e.to_string()))?;

        conn.execute(
            "INSERT INTO profile_meta (key, value) VALUES ('name', ?1)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            [&final_name],
        )
        .map_err(|e| AppError::Database(e.to_string()))?;

        conn.execute(
            "INSERT INTO profile_meta (key, value) VALUES ('slug', ?1)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            [&final_slug],
        )
        .map_err(|e| AppError::Database(e.to_string()))?;

        drop(conn);

        // Register profile in registry.db
        let meta = ProfileRecord {
            uuid: new_uuid.clone(),
            name: final_name,
            slug: final_slug,
            created_at: now.clone(),
            last_active_at: now,
            db_path: format!("profiles/{}/typing_freex.db", new_uuid),
        };

        manager.register_existing_profile(&meta)?;

        Ok(meta)
    })();

    if finalize_res.is_err() {
        let _ = fs::remove_dir_all(&profile_dir);
    }

    finalize_res
}

pub fn check_active_db_integrity(manager: &DatabaseManager) -> AppResult<IntegrityCheckReport> {
    manager.with_active_profile(|_uuid, conn| {
        let mut errors = Vec::new();

        // 1. PRAGMA integrity_check
        let status: String = conn
            .query_row("PRAGMA integrity_check", [], |row| row.get(0))
            .map_err(|e| AppError::Database(e.to_string()))?;

        if status != "ok" {
            errors.push(format!("PRAGMA integrity_check: {}", status));
        }

        // 2. PRAGMA foreign_key_check
        let mut stmt = conn
            .prepare("PRAGMA foreign_key_check")
            .map_err(|e| AppError::Database(e.to_string()))?;
        let fk_rows = stmt
            .query_map([], |row| {
                let table: String = row.get(0)?;
                let rowid: i64 = row.get(1)?;
                let target: String = row.get(2)?;
                Ok(format!("Foreign key violation in table '{}' at rowid {} referencing '{}'", table, rowid, target))
            })
            .map_err(|e| AppError::Database(e.to_string()))?;

        for err in fk_rows {
            errors.push(err.map_err(|e| AppError::Database(e.to_string()))?);
        }

        // 3. Schema objects check
        let mut stmt2 = conn
            .prepare("SELECT type, name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'")
            .map_err(|e| AppError::Database(e.to_string()))?;

        let objs = stmt2
            .query_map([], |row| {
                let t: String = row.get(0)?;
                let n: String = row.get(1)?;
                Ok((t, n))
            })
            .map_err(|e| AppError::Database(e.to_string()))?;

        for obj in objs {
            let (t, n) = obj.map_err(|e| AppError::Database(e.to_string()))?;
            if t == "trigger" || t == "view" {
                errors.push(format!("Disallowed schema object found: {} '{}'", t, n));
            }
            if t == "table" && !ALLOWED_TABLES.contains(&n.as_str()) {
                errors.push(format!("Unexpected table found: '{}'", n));
            }
        }

        Ok(IntegrityCheckReport {
            ok: errors.is_empty(),
            errors,
        })
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;
    use crate::db::backup::export_active_profile_backup;

    fn temp_test_dir(name: &str) -> PathBuf {
        let p = std::env::temp_dir().join(format!("tfrx_val_{}_{}", name, Uuid::new_v4()));
        let _ = fs::remove_dir_all(&p);
        p
    }

    #[test]
    fn test_valid_backup_roundtrip_import() {
        let src_app_dir = temp_test_dir("src_app");
        let dest_app_dir = temp_test_dir("dest_app");
        let export_dir = temp_test_dir("export");

        let src_mgr = DatabaseManager::new(src_app_dir).unwrap();
        src_mgr.create_profile("Original User", "orig-user").unwrap();

        let backup = export_active_profile_backup(&src_mgr, &export_dir).unwrap();
        let backup_path = export_dir.join(&backup.file_name);

        let dest_mgr = DatabaseManager::new(dest_app_dir).unwrap();
        dest_mgr.create_profile("Existing User", "existing-user").unwrap();

        // Stage and validate
        let summary = stage_and_validate_import(&dest_mgr, &backup_path).unwrap();
        assert_eq!(summary.profile_name, "Original User");
        assert_eq!(summary.sha256_hash, backup.sha256_hash);

        // Commit import
        let imported_meta = commit_validated_import(
            &dest_mgr,
            &summary.staging_token,
            Some("Restored Profile".to_string()),
        )
        .unwrap();

        assert_eq!(imported_meta.name, "Restored Profile");

        // Verify existing profile was not overwritten
        let profiles = dest_mgr.list_profiles().unwrap();
        assert_eq!(profiles.len(), 2);
    }

    #[test]
    fn test_duplicate_backup_import_assigns_unique_slug_and_preserves_name() {
        let src_app_dir = temp_test_dir("src_app_dup");
        let dest_app_dir = temp_test_dir("dest_app_dup");
        let export_dir = temp_test_dir("export_dup");

        let src_mgr = DatabaseManager::new(src_app_dir).unwrap();
        src_mgr.create_profile("Player One", "player-one").unwrap();

        let backup = export_active_profile_backup(&src_mgr, &export_dir).unwrap();
        let backup_path = export_dir.join(&backup.file_name);

        let dest_mgr = DatabaseManager::new(dest_app_dir).unwrap();
        // Destination already has a profile with the same name "Player One" and slug "player-one"
        dest_mgr.create_profile("Player One", "player-one").unwrap();

        // 1. Stage and import the backup with identical name "Player One"
        let summary1 = stage_and_validate_import(&dest_mgr, &backup_path).unwrap();
        let imported1 = commit_validated_import(
            &dest_mgr,
            &summary1.staging_token,
            Some("Player One".to_string()),
        )
        .unwrap();

        // Must keep identical display name, but get unique slug "player-one-2"
        assert_eq!(imported1.name, "Player One");
        assert_eq!(imported1.slug, "player-one-2");

        // 2. Stage and import the backup AGAIN with identical name
        let summary2 = stage_and_validate_import(&dest_mgr, &backup_path).unwrap();
        let imported2 = commit_validated_import(
            &dest_mgr,
            &summary2.staging_token,
            None, // Fall back to original name in staged backup ("Player One")
        )
        .unwrap();

        assert_eq!(imported2.name, "Player One");
        assert_eq!(imported2.slug, "player-one-3");

        // Verify total 3 profiles exist, all named "Player One", with distinct UUIDs and slugs
        let all = dest_mgr.list_profiles().unwrap();
        assert_eq!(all.len(), 3);
        assert_ne!(imported1.uuid, imported2.uuid);
    }

    #[test]
    fn test_hostile_import_rejections() {
        let dest_app_dir = temp_test_dir("dest_app_hostile");
        let test_dir = temp_test_dir("hostile_samples");
        fs::create_dir_all(&test_dir).unwrap();

        let dest_mgr = DatabaseManager::new(dest_app_dir).unwrap();

        // 1. Truncated non-sqlite file
        let trunc_file = test_dir.join("fake.db");
        fs::write(&trunc_file, b"random garbage not sqlite").unwrap();
        let err1 = stage_and_validate_import(&dest_mgr, &trunc_file);
        assert!(err1.is_err());

        // 2. Database with wrong application_id
        let wrong_app_file = test_dir.join("wrong_app.db");
        {
            let conn = Connection::open(&wrong_app_file).unwrap();
            conn.execute("PRAGMA application_id = 9999", []).unwrap();
        }
        let err2 = stage_and_validate_import(&dest_mgr, &wrong_app_file);
        assert!(err2.is_err());

        // 3. Database with injected malicious trigger
        let trigger_file = test_dir.join("trigger.db");
        {
            let conn = Connection::open(&trigger_file).unwrap();
            conn.execute(&format!("PRAGMA application_id = {}", APPLICATION_ID), []).unwrap();
            conn.execute("CREATE TABLE dummy (id INT)", []).unwrap();
            conn.execute("CREATE TRIGGER malicious AFTER INSERT ON dummy BEGIN SELECT 1; END", []).unwrap();
        }
        let err3 = stage_and_validate_import(&dest_mgr, &trigger_file);
        assert!(err3.is_err());
    }
}
