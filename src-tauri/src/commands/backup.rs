use std::path::{Path, PathBuf};
use tauri::State;
use crate::db::backup::{export_active_profile_backup, BackupExportResult};
use crate::db::manager::DatabaseManager;
use crate::db::validate::{
    check_active_db_integrity, commit_validated_import, stage_and_validate_import,
    ImportPickSummary, IntegrityCheckReport,
};
use crate::domain::profile::ProfileDto;
use crate::error::{AppError, AppResult};

pub fn db_backup_export_internal(
    manager: &DatabaseManager,
    destination_path: Option<PathBuf>,
) -> AppResult<BackupExportResult> {
    let dest = destination_path.ok_or_else(|| {
        crate::error::AppError::Validation("Destination path is required for database export".to_string())
    })?;
    export_active_profile_backup(manager, &dest)
}

pub fn db_import_pick_internal(
    manager: &DatabaseManager,
    file_path: &Path,
) -> AppResult<ImportPickSummary> {
    stage_and_validate_import(manager, file_path)
}

pub fn db_import_commit_internal(
    manager: &DatabaseManager,
    staging_token: &str,
    display_name: Option<String>,
) -> AppResult<ProfileDto> {
    let meta = commit_validated_import(manager, staging_token, display_name)?;
    let active_uuid = manager.get_active_profile()?.map(|p| p.uuid);

    Ok(ProfileDto {
        uuid: meta.uuid.clone(),
        name: meta.name,
        slug: meta.slug,
        created_at: meta.created_at,
        last_active_at: meta.last_active_at,
        is_active: active_uuid.as_deref() == Some(&meta.uuid),
    })
}

pub fn db_integrity_check_internal(manager: &DatabaseManager) -> AppResult<IntegrityCheckReport> {
    check_active_db_integrity(manager)
}

#[tauri::command]
pub async fn db_backup_export(
    manager: State<'_, DatabaseManager>,
    destination_path: Option<String>,
) -> AppResult<BackupExportResult> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let dest_dir = destination_path.map(PathBuf::from);
        db_backup_export_internal(&mgr, dest_dir)
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn db_import_pick(
    manager: State<'_, DatabaseManager>,
    file_path: String,
) -> AppResult<ImportPickSummary> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || db_import_pick_internal(&mgr, Path::new(&file_path)))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn db_import_commit(
    manager: State<'_, DatabaseManager>,
    staging_token: String,
    display_name: Option<String>,
) -> AppResult<ProfileDto> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        db_import_commit_internal(&mgr, &staging_token, display_name)
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn db_integrity_check(
    manager: State<'_, DatabaseManager>,
) -> AppResult<IntegrityCheckReport> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || db_integrity_check_internal(&mgr))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}
