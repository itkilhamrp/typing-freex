use tauri::State;
use crate::db::manager::DatabaseManager;
use crate::domain::profile::{generate_slug, validate_display_name, ProfileDto};
use crate::error::{AppError, AppResult};

#[tauri::command]
pub async fn profile_list(manager: State<'_, DatabaseManager>) -> AppResult<Vec<ProfileDto>> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let active_opt = mgr.get_active_profile()?;
        let active_uuid = active_opt.map(|p| p.uuid);

        let profiles = mgr.list_profiles()?;
        let dtos = profiles
            .into_iter()
            .map(|p| {
                let is_active = active_uuid.as_deref() == Some(&p.uuid);
                ProfileDto {
                    uuid: p.uuid,
                    name: p.name,
                    slug: p.slug,
                    created_at: p.created_at,
                    last_active_at: p.last_active_at,
                    is_active,
                }
            })
            .collect();

        Ok(dtos)
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn profile_create(
    manager: State<'_, DatabaseManager>,
    name: String,
) -> AppResult<ProfileDto> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let validated_name = validate_display_name(&name)?;
        let base_slug = generate_slug(&validated_name)?;
        let slug = mgr.resolve_unique_slug(&base_slug)?;
        let created = mgr.create_profile(&validated_name, &slug)?;

        let active_opt = mgr.get_active_profile()?;
        let is_active = active_opt.map(|p| p.uuid == created.uuid).unwrap_or(false);

        Ok(ProfileDto {
            uuid: created.uuid,
            name: created.name,
            slug: created.slug,
            created_at: created.created_at,
            last_active_at: created.last_active_at,
            is_active,
        })
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn profile_rename(
    manager: State<'_, DatabaseManager>,
    uuid: String,
    new_name: String,
) -> AppResult<()> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let validated = validate_display_name(&new_name)?;
        mgr.rename_profile(&uuid, &validated)
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn profile_delete(
    manager: State<'_, DatabaseManager>,
    uuid: String,
) -> AppResult<()> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || mgr.delete_profile(&uuid))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn profile_switch(
    manager: State<'_, DatabaseManager>,
    uuid: String,
) -> AppResult<ProfileDto> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let p = mgr.switch_profile(&uuid)?;
        Ok(ProfileDto {
            uuid: p.uuid,
            name: p.name,
            slug: p.slug,
            created_at: p.created_at,
            last_active_at: p.last_active_at,
            is_active: true,
        })
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn profile_get_active(
    manager: State<'_, DatabaseManager>,
) -> AppResult<Option<ProfileDto>> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let active_opt = mgr.get_active_profile()?;
        Ok(active_opt.map(|p| ProfileDto {
            uuid: p.uuid,
            name: p.name,
            slug: p.slug,
            created_at: p.created_at,
            last_active_at: p.last_active_at,
            is_active: true,
        }))
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}
