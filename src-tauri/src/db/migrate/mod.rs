pub mod connection;
pub mod runner;
pub mod sets;
pub mod timestamp;

use rusqlite::Connection;
use crate::error::AppError;

pub use connection::{configure_connection, is_valid_application_id, APPLICATION_ID};
pub use runner::{run_migration_set, Migration};
pub use sets::{
    CURRENT_REGISTRY_SCHEMA_VERSION, CURRENT_SCHEMA_VERSION, PROFILE_MIGRATIONS,
    REGISTRY_MIGRATIONS,
};
pub use timestamp::{chrono_now_iso, civil_from_days};

/// Backward-compatible alias for the profile migration slice.
pub const MIGRATIONS: &[Migration] = PROFILE_MIGRATIONS;

/// Runs all pending profile database migrations on `conn`.
pub fn run_migrations(conn: &mut Connection) -> Result<(), AppError> {
    run_migration_set(conn, PROFILE_MIGRATIONS)
}

/// Runs all pending registry database migrations on `conn`.
pub fn run_registry_migrations(conn: &mut Connection) -> Result<(), AppError> {
    run_migration_set(conn, REGISTRY_MIGRATIONS)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn table_names(conn: &Connection) -> Vec<String> {
        let mut stmt = conn
            .prepare(
                "SELECT name FROM sqlite_master
                 WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
                 ORDER BY name ASC",
            )
            .unwrap();
        stmt.query_map([], |r| r.get::<_, String>(0))
            .unwrap()
            .map(|r| r.unwrap())
            .collect()
    }

    fn table_columns(conn: &Connection, table: &str) -> Vec<(String, String, i32)> {
        let mut stmt = conn
            .prepare(&format!("PRAGMA table_info({})", table))
            .unwrap();
        stmt.query_map([], |r| {
            Ok((
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, i32>(3)?,
            ))
        })
        .unwrap()
        .map(|r| r.unwrap())
        .collect()
    }

    #[test]
    fn test_profile_migrations_baseline_schema_and_no_dead_tables() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_migrations(&mut conn).unwrap();

        let version: u32 = conn
            .query_row("PRAGMA user_version", [], |row| row.get(0))
            .unwrap();
        assert_eq!(version, CURRENT_SCHEMA_VERSION);

        let tables = table_names(&conn);
        assert_eq!(
            tables,
            vec![
                "achievements",
                "advancements",
                "key_stat",
                "profile_meta",
                "schema_migration",
                "setting",
                "test_result",
                "tracking_state",
                "trophy_showcase",
            ]
        );

        // Verify dead tables are completely absent
        for dead in [
            "custom_text",
            "custom_text_revision",
            "custom_wordlist",
            "achievement_progress",
            "personal_best",
            "daily_stat",
        ] {
            assert!(!tables.contains(&dead.to_string()), "Dead table {} must not exist", dead);
        }

        // Verify exact column layout of critical tables
        let showcase_cols = table_columns(&conn, "trophy_showcase");
        assert_eq!(
            showcase_cols,
            vec![
                ("slot".to_string(), "INTEGER".to_string(), 0),
                ("item_id".to_string(), "TEXT".to_string(), 0),
                ("item_type".to_string(), "TEXT".to_string(), 0),
                ("pinned_at".to_string(), "TEXT".to_string(), 1),
            ]
        );

        // Verify v2 composite index on test_result exists
        let has_stats_index: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_test_result_stats')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(has_stats_index, "idx_test_result_stats index must exist after migration v2");
    }

    #[test]
    fn test_registry_migrations_baseline_schema() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_registry_migrations(&mut conn).unwrap();

        let version: u32 = conn
            .query_row("PRAGMA user_version", [], |row| row.get(0))
            .unwrap();
        assert_eq!(version, CURRENT_REGISTRY_SCHEMA_VERSION);

        let tables = table_names(&conn);
        assert_eq!(
            tables,
            vec![
                "active_profile",
                "app_setting",
                "custom_text",
                "custom_text_revision",
                "profile",
                "schema_migration",
            ]
        );
    }

    #[test]
    fn test_idempotent_migrations() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_migrations(&mut conn).unwrap();
        run_migrations(&mut conn).unwrap();

        let mut reg_conn = Connection::open_in_memory().unwrap();
        run_registry_migrations(&mut reg_conn).unwrap();
        run_registry_migrations(&mut reg_conn).unwrap();
    }

    #[test]
    fn test_checksum_mismatch_rejected() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_migrations(&mut conn).unwrap();

        conn.execute(
            "UPDATE schema_migration SET checksum = 'old_hash_123' WHERE version = 1",
            [],
        )
        .unwrap();

        assert!(run_migrations(&mut conn).is_err());
    }

    #[test]
    fn test_rejects_pre_release_higher_schema_history() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_migrations(&mut conn).unwrap();

        // Simulate a legacy pre-release database at version 8
        conn.execute("PRAGMA user_version = 8;", []).unwrap();
        let err = run_migrations(&mut conn);
        assert!(err.is_err());
    }
}

