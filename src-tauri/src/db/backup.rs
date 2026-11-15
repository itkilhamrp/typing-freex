use std::fs::{self, File};
use std::io::{self, Read};
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use crate::db::manager::DatabaseManager;
use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupExportResult {
    pub success: bool,
    pub file_name: String,
    #[serde(default)]
    pub destination_path: String,
    pub file_size: u64,
    pub sha256_hash: String,
    pub sidecar_created: bool,
}

pub fn calculate_sha256<P: AsRef<Path>>(path: P) -> io::Result<String> {
    let mut file = File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 64 * 1024];

    loop {
        let bytes_read = file.read(&mut buffer)?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }

    Ok(format!("{:x}", hasher.finalize()))
}

pub fn resolve_collision_path(target: &Path) -> PathBuf {
    if !target.exists() {
        return target.to_path_buf();
    }

    let parent = target.parent().unwrap_or_else(|| Path::new("."));
    let stem = target
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("backup");
    let ext = target
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("db");

    let mut counter = 2;
    loop {
        let candidate = parent.join(format!("{}_{}.{}", stem, counter, ext));
        if !candidate.exists() {
            return candidate;
        }
        counter += 1;
    }
}

pub fn export_active_profile_backup(
    manager: &DatabaseManager,
    destination: &Path,
) -> AppResult<BackupExportResult> {
    let profile = manager
        .get_active_profile()?
        .ok_or_else(|| AppError::NotFound("No active profile".to_string()))?;
    let slug = profile.slug;

    // Check if destination is an explicit file path (has extension like .db, .sqlite) or a directory
    let target_path = if !destination.is_dir()
        && (destination.extension().is_some() || destination.to_string_lossy().ends_with(".db"))
    {
        if let Some(parent) = destination.parent()
            && !parent.as_os_str().is_empty()
        {
            fs::create_dir_all(parent)
                .map_err(|e| AppError::Io(format!("Failed to create backup directory: {}", e)))?;
        }
        destination.to_path_buf()
    } else {
        fs::create_dir_all(destination)
            .map_err(|e| AppError::Io(format!("Failed to create backup directory: {}", e)))?;

        // Timestamp generation
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let base_name = format!("typing_freex_backup_{}_{}.db", slug, now);
        resolve_collision_path(&destination.join(&base_name))
    };

    let file_name = target_path
        .file_name()
        .and_then(|f| f.to_str())
        .unwrap_or("backup.db")
        .to_string();

    // Stage into a temporary vacuum file to prevent SQLite "output file already exists" error
    // when native GTK/portal file chooser creates a 0-byte placeholder or user overwrites a file.
    let mut tmp_os = target_path.as_os_str().to_os_string();
    tmp_os.push(".tmp_vacuum");
    let temp_staging_path = PathBuf::from(tmp_os);
    if temp_staging_path.exists() {
        let _ = fs::remove_file(&temp_staging_path);
    }

    manager.with_active_profile(|_uuid, conn| {
        // Execute VACUUM INTO on the guaranteed non-existent temporary file
        let escaped_path = temp_staging_path.to_string_lossy().replace('\'', "''");
        let vacuum_sql = format!("VACUUM INTO '{}'", escaped_path);
        conn.execute(&vacuum_sql, [])
            .map_err(|e| AppError::Database(format!("VACUUM INTO failed: {}", e)))?;
        Ok(())
    })?;

    // Replace target_path without pre-deleting it before replacement succeeds (safe on Windows & cross-volume)
    if fs::rename(&temp_staging_path, &target_path).is_err() {
        fs::copy(&temp_staging_path, &target_path)
            .map_err(|e| AppError::Io(format!("Failed to finalize backup file: {}", e)))?;
        let _ = fs::remove_file(&temp_staging_path);
    }

    // Verify file size and calculate SHA-256
    let metadata = fs::metadata(&target_path)
        .map_err(|e| AppError::Io(format!("Failed to read backup metadata: {}", e)))?;
    let file_size = metadata.len();

    let sha256_hash = calculate_sha256(&target_path)
        .map_err(|e| AppError::Io(format!("Failed to calculate backup SHA-256: {}", e)))?;

    // Write SHA-256 sidecar
    let mut sidecar_os = target_path.as_os_str().to_os_string();
    sidecar_os.push(".sha256");
    let sidecar_path = PathBuf::from(sidecar_os);
    let sidecar_content = format!("{} *{}\n", sha256_hash, file_name);
    let sidecar_created = fs::write(&sidecar_path, sidecar_content).is_ok();

    let destination_path = target_path.to_string_lossy().to_string();

    Ok(BackupExportResult {
        success: true,
        file_name,
        destination_path,
        file_size,
        sha256_hash,
        sidecar_created,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    fn temp_test_dir(name: &str) -> PathBuf {
        let p = std::env::temp_dir().join(format!("tfrx_bk_{}_{}", name, Uuid::new_v4()));
        let _ = fs::remove_dir_all(&p);
        p
    }

    #[test]
    fn test_backup_export_and_sha256_sidecar() {
        let app_dir = temp_test_dir("app");
        let backup_dir = temp_test_dir("export");
        let manager = DatabaseManager::new(app_dir).unwrap();
        manager.create_profile("Backup User", "backup-user").unwrap();

        let res = export_active_profile_backup(&manager, &backup_dir).unwrap();
        assert!(res.success);
        assert!(res.file_size > 0);
        assert!(!res.destination_path.is_empty());
        assert_eq!(res.sha256_hash.len(), 64);
        assert!(res.sidecar_created);

        // Verify sidecar exists and has identical hash
        let sidecar_file = backup_dir.join(format!("{}.sha256", res.file_name));
        assert!(sidecar_file.exists());
        let content = fs::read_to_string(&sidecar_file).unwrap();
        assert!(content.starts_with(&res.sha256_hash));
    }

    #[test]
    fn test_backup_export_explicit_file_path() {
        let app_dir = temp_test_dir("app_explicit");
        let backup_dir = temp_test_dir("export_explicit");
        let explicit_file = backup_dir.join("my_custom_backup.db");
        let manager = DatabaseManager::new(app_dir).unwrap();
        manager.create_profile("Explicit User", "explicit-user").unwrap();

        let res = export_active_profile_backup(&manager, &explicit_file).unwrap();
        assert!(res.success);
        assert_eq!(res.file_name, "my_custom_backup.db");
        assert_eq!(res.destination_path, explicit_file.to_string_lossy());
        assert!(explicit_file.exists());
        let sidecar_file = backup_dir.join("my_custom_backup.db.sha256");
        assert!(sidecar_file.exists());
    }

    #[test]
    fn test_backup_export_overwrites_existing_file() {
        let app_dir = temp_test_dir("app_overwrite");
        let backup_dir = temp_test_dir("export_overwrite");
        fs::create_dir_all(&backup_dir).unwrap();
        let explicit_file = backup_dir.join("existing_backup.db");

        // Simulate GTK FileChooser creating empty placeholder or user overwriting pre-existing file
        fs::write(&explicit_file, b"pre-existing dummy placeholder").unwrap();
        assert!(explicit_file.exists());

        let manager = DatabaseManager::new(app_dir).unwrap();
        manager.create_profile("Overwrite User", "overwrite-user").unwrap();

        let res = export_active_profile_backup(&manager, &explicit_file).unwrap();
        assert!(res.success);
        assert_eq!(res.file_name, "existing_backup.db");
        assert!(res.file_size > 0);
        assert!(explicit_file.exists());

        // Content must be genuine SQLite database, not the pre-existing dummy bytes
        let final_bytes = fs::read(&explicit_file).unwrap();
        assert_ne!(final_bytes, b"pre-existing dummy placeholder");
        assert!(final_bytes.starts_with(b"SQLite format 3\0"));
    }
}
