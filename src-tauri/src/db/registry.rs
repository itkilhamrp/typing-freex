use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use crate::error::AppError;
use super::migrate::{chrono_now_iso, run_registry_migrations};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileRecord {
    pub uuid: String,
    pub name: String,
    pub slug: String,
    pub created_at: String,
    pub last_active_at: String,
    pub db_path: String,
}

pub fn init_registry(conn: &mut Connection) -> Result<(), AppError> {
    run_registry_migrations(conn)
}

pub fn list_profiles(conn: &Connection) -> Result<Vec<ProfileRecord>, AppError> {
    let mut stmt = conn
        .prepare("SELECT uuid, name, slug, created_at, last_active_at, db_path FROM profile ORDER BY last_active_at DESC")
        .map_err(|e| AppError::Database(e.to_string()))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(ProfileRecord {
                uuid: row.get(0)?,
                name: row.get(1)?,
                slug: row.get(2)?,
                created_at: row.get(3)?,
                last_active_at: row.get(4)?,
                db_path: row.get(5)?,
            })
        })
        .map_err(|e| AppError::Database(e.to_string()))?;

    super::collect_rows(rows)
}

pub fn get_profile(conn: &Connection, uuid: &str) -> Result<Option<ProfileRecord>, AppError> {
    let mut stmt = conn
        .prepare("SELECT uuid, name, slug, created_at, last_active_at, db_path FROM profile WHERE uuid = ?1")
        .map_err(|e| AppError::Database(e.to_string()))?;

    let result = stmt
        .query_row([uuid], |row| {
            Ok(ProfileRecord {
                uuid: row.get(0)?,
                name: row.get(1)?,
                slug: row.get(2)?,
                created_at: row.get(3)?,
                last_active_at: row.get(4)?,
                db_path: row.get(5)?,
            })
        })
        .ok();

    Ok(result)
}

pub fn create_profile(
    conn: &Connection,
    uuid: &str,
    name: &str,
    slug: &str,
    db_path: &str,
) -> Result<ProfileRecord, AppError> {
    let now = chrono_now_iso();
    conn.execute(
        "INSERT INTO profile (uuid, name, slug, created_at, last_active_at, db_path) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![uuid, name, slug, now, now, db_path],
    )
    .map_err(|e| {
        if e.to_string().contains("UNIQUE constraint failed: profile.slug") {
            AppError::Conflict(format!("A profile with slug '{}' already exists", slug))
        } else {
            AppError::Database(format!("Failed to insert profile: {}", e))
        }
    })?;

    Ok(ProfileRecord {
        uuid: uuid.to_string(),
        name: name.to_string(),
        slug: slug.to_string(),
        created_at: now.clone(),
        last_active_at: now,
        db_path: db_path.to_string(),
    })
}

pub fn rename_profile(conn: &Connection, uuid: &str, new_name: &str) -> Result<(), AppError> {
    let affected = conn
        .execute(
            "UPDATE profile SET name = ?1 WHERE uuid = ?2",
            params![new_name, uuid],
        )
        .map_err(|e| AppError::Database(format!("Failed to rename profile: {}", e)))?;

    if affected == 0 {
        return Err(AppError::NotFound(format!("Profile {} not found", uuid)));
    }
    Ok(())
}

pub fn delete_profile(conn: &Connection, uuid: &str) -> Result<(), AppError> {
    let tx = conn
        .unchecked_transaction()
        .map_err(|e| AppError::Database(format!("Failed to begin delete transaction: {}", e)))?;

    // If active, clear active_profile
    tx.execute("DELETE FROM active_profile WHERE profile_uuid = ?1", [uuid])
        .map_err(|e| AppError::Database(format!("Failed to clear active_profile: {}", e)))?;

    let affected = tx
        .execute("DELETE FROM profile WHERE uuid = ?1", [uuid])
        .map_err(|e| AppError::Database(format!("Failed to delete profile: {}", e)))?;

    if affected == 0 {
        return Err(AppError::NotFound(format!("Profile {} not found", uuid)));
    }

    tx.commit()
        .map_err(|e| AppError::Database(format!("Failed to commit profile deletion: {}", e)))?;
    Ok(())
}

pub fn resolve_unique_slug(conn: &Connection, base_slug: &str) -> Result<String, AppError> {
    let clean_base = if base_slug.trim().is_empty() {
        "profile"
    } else {
        base_slug.trim()
    };

    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM profile WHERE slug = ?1",
            [clean_base],
            |r| r.get(0),
        )
        .map_err(|e| AppError::Database(e.to_string()))?;

    if count == 0 {
        return Ok(clean_base.to_string());
    }

    let mut counter = 2;
    loop {
        let candidate = format!("{}-{}", clean_base, counter);
        let exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM profile WHERE slug = ?1",
                [&candidate],
                |r| r.get(0),
            )
            .map_err(|e| AppError::Database(e.to_string()))?;

        if exists == 0 {
            return Ok(candidate);
        }
        counter += 1;
    }
}

pub fn get_active_profile_uuid(conn: &Connection) -> Result<Option<String>, AppError> {
    let mut stmt = conn
        .prepare("SELECT profile_uuid FROM active_profile WHERE id = 1")
        .map_err(|e| AppError::Database(e.to_string()))?;

    let result = stmt.query_row([], |row| row.get(0)).ok();
    Ok(result)
}

pub fn set_active_profile_uuid(conn: &Connection, uuid: &str) -> Result<(), AppError> {
    let now = chrono_now_iso();
    // Update last_active_at on the profile
    conn.execute(
        "UPDATE profile SET last_active_at = ?1 WHERE uuid = ?2",
        params![now, uuid],
    )
    .map_err(|e| AppError::Database(format!("Failed to update profile last_active_at: {}", e)))?;

    conn.execute(
        "INSERT INTO active_profile (id, profile_uuid) VALUES (1, ?1)
         ON CONFLICT(id) DO UPDATE SET profile_uuid = excluded.profile_uuid",
        [uuid],
    )
    .map_err(|e| AppError::Database(format!("Failed to set active profile: {}", e)))?;

    Ok(())
}

pub fn get_app_setting(conn: &Connection, key: &str) -> Result<Option<String>, AppError> {
    let mut stmt = conn
        .prepare("SELECT value FROM app_setting WHERE key = ?1")
        .map_err(|e| AppError::Database(e.to_string()))?;

    let result = stmt.query_row([key], |row| row.get(0)).ok();
    Ok(result)
}

pub fn set_app_setting(conn: &Connection, key: &str, value: &str) -> Result<(), AppError> {
    let now = chrono_now_iso();
    conn.execute(
        "INSERT INTO app_setting (key, value, updated_at) VALUES (?1, ?2, ?3)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        params![key, value, now],
    )
    .map_err(|e| AppError::Database(format!("Failed to save app setting {}: {}", key, e)))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_unique_slug() {
        let mut conn = Connection::open_in_memory().unwrap();
        init_registry(&mut conn).unwrap();

        // 1. Initial base slug available
        let s1 = resolve_unique_slug(&conn, "default").unwrap();
        assert_eq!(s1, "default");

        create_profile(&conn, "u-1", "Default", "default", "profiles/u-1/typing_freex.db").unwrap();

        // 2. Already exists -> produces "default-2"
        let s2 = resolve_unique_slug(&conn, "default").unwrap();
        assert_eq!(s2, "default-2");

        create_profile(&conn, "u-2", "Default", "default-2", "profiles/u-2/typing_freex.db").unwrap();

        // 3. "default" and "default-2" exist -> produces "default-3"
        let s3 = resolve_unique_slug(&conn, "default").unwrap();
        assert_eq!(s3, "default-3");

        // 4. Blank string fallback
        let s_empty = resolve_unique_slug(&conn, "   ").unwrap();
        assert_eq!(s_empty, "profile");
    }

    #[test]
    fn test_registry_lifecycle() {
        let mut conn = Connection::open_in_memory().unwrap();
        init_registry(&mut conn).unwrap();

        // Create profile
        let p = create_profile(&conn, "u-1", "Default", "default", "profiles/u-1/typing_freex.db").unwrap();
        assert_eq!(p.name, "Default");

        // List profiles
        let list = list_profiles(&conn).unwrap();
        assert_eq!(list.len(), 1);

        // Set active
        set_active_profile_uuid(&conn, "u-1").unwrap();
        let active = get_active_profile_uuid(&conn).unwrap();
        assert_eq!(active, Some("u-1".to_string()));

        // Rename
        rename_profile(&conn, "u-1", "Primary").unwrap();
        let p_updated = get_profile(&conn, "u-1").unwrap().unwrap();
        assert_eq!(p_updated.name, "Primary");

        // App setting
        set_app_setting(&conn, "app.first_run_done", "true").unwrap();
        assert_eq!(get_app_setting(&conn, "app.first_run_done").unwrap(), Some("true".to_string()));

        // Delete profile
        delete_profile(&conn, "u-1").unwrap();
        assert_eq!(list_profiles(&conn).unwrap().len(), 0);
        assert_eq!(get_active_profile_uuid(&conn).unwrap(), None);
    }
}
