use rusqlite::Connection;
use crate::error::AppError;

/// Canonical SQLite `application_id` for Typing FreeX: ASCII `"TFRX"` (`0x54465258`).
pub const APPLICATION_ID: u32 = 0x54465258;

/// Validates that an SQLite `application_id` belongs to Typing FreeX or is a fresh uninitialized file (`0`).
pub fn is_valid_application_id(app_id: u32) -> bool {
    app_id == APPLICATION_ID || app_id == 0
}

/// Applies canonical SQLite connection PRAGMAs for all Typing FreeX databases (`registry.db` and profile databases).
pub fn configure_connection(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         PRAGMA foreign_keys = ON;
         PRAGMA busy_timeout = 5000;
         PRAGMA application_id = 0x54465258;", // ASCII "TFRX" (Typing FreeX)
    )
    .map_err(|e| AppError::Database(format!("Failed to set database pragmas: {}", e)))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_application_id_validation_and_pragmas() {
        assert!(is_valid_application_id(APPLICATION_ID));
        assert!(is_valid_application_id(0));
        assert!(!is_valid_application_id(0x4F545445)); // Legacy OTTE rejected
        assert!(!is_valid_application_id(0x12345678));

        let conn = Connection::open_in_memory().unwrap();
        configure_connection(&conn).unwrap();
        let app_id: u32 = conn
            .query_row("PRAGMA application_id", [], |row| row.get(0))
            .unwrap();
        assert_eq!(app_id, APPLICATION_ID);

        let fk_enabled: i32 = conn
            .query_row("PRAGMA foreign_keys", [], |row| row.get(0))
            .unwrap();
        assert_eq!(fk_enabled, 1);
    }
}

