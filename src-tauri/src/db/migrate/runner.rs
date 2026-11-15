use rusqlite::{Connection, Transaction};
use sha2::{Digest, Sha256};
use crate::error::AppError;
use super::connection::configure_connection;
use super::timestamp::chrono_now_iso;

/// Pure descriptor of a single versioned SQL migration script.
#[derive(Debug, Clone, Copy)]
pub struct Migration {
    pub version: i32,
    pub name: &'static str,
    pub sql: &'static str,
}

fn calculate_checksum(sql: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(sql.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Generic schema-agnostic migration engine.
/// Applies any ordered `&[Migration]` set to `conn`, managing `schema_migration` and `PRAGMA user_version`.
pub fn run_migration_set(conn: &mut Connection, migrations: &[Migration]) -> Result<(), AppError> {
    configure_connection(conn)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_migration (
            version    INTEGER PRIMARY KEY,
            name       TEXT NOT NULL,
            applied_at TEXT NOT NULL,
            checksum   TEXT NOT NULL
        );",
        [],
    )
    .map_err(|e| AppError::Database(format!("Failed to create schema_migration table: {}", e)))?;

    let max_supported_version = migrations.iter().map(|m| m.version).max().unwrap_or(0);

    // Reject databases with pre-release or unsupported migration history (clean-slate guard)
    let max_recorded_version: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migration",
            [],
            |row| row.get(0),
        )
        .map_err(|e| AppError::Database(e.to_string()))?;

    let current_user_version: i32 = conn
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .map_err(|e| AppError::Database(e.to_string()))?;

    if max_recorded_version > max_supported_version || current_user_version > max_supported_version {
        let msg = format!(
            "Incompatible database schema history (recorded version {}, user_version {}, max supported {}). Clean baseline v1 required.",
            max_recorded_version, current_user_version, max_supported_version
        );
        crate::log_warn!("migrate", "{}", msg);
        return Err(AppError::Database(msg));
    }

    // Disable foreign keys during migration execution to allow table recreation/alteration
    conn.execute_batch("PRAGMA foreign_keys = OFF;")
        .map_err(|e| AppError::Database(format!("Failed to disable foreign keys: {}", e)))?;

    let migration_result: Result<(), AppError> = (|| {
        for migration in migrations {
            let expected_checksum = calculate_checksum(migration.sql);

            let existing: Option<String> = {
                let mut stmt = conn
                    .prepare("SELECT checksum FROM schema_migration WHERE version = ?1")
                    .map_err(|e| AppError::Database(e.to_string()))?;

                stmt.query_row([migration.version], |row| row.get(0)).ok()
            };

            if let Some(existing_checksum) = existing {
                if existing_checksum != expected_checksum {
                    let msg = format!(
                        "Migration checksum mismatch for version {} ({}): expected {}, found {}",
                        migration.version, migration.name, expected_checksum, existing_checksum
                    );
                    crate::log_error!("migrate", "{}", msg);
                    return Err(AppError::Database(msg));
                }
                continue;
            }

            let tx = conn
                .transaction()
                .map_err(|e| AppError::Database(format!("Failed to begin migration transaction: {}", e)))?;

            apply_migration(&tx, migration, &expected_checksum)?;

            tx.commit().map_err(|e| {
                AppError::Database(format!("Failed to commit migration {}: {}", migration.version, e))
            })?;
        }
        Ok(())
    })();

    // Always re-enable foreign keys even if a migration failed
    let fk_on_res = conn
        .execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|e| AppError::Database(format!("Failed to re-enable foreign keys: {}", e)));

    migration_result?;
    fk_on_res?;

    // Verify foreign key integrity by querying PRAGMA foreign_key_check result rows
    let has_fk_violation = {
        let mut stmt = conn
            .prepare("PRAGMA foreign_key_check")
            .map_err(|e| AppError::Database(format!("Failed to prepare foreign_key_check: {}", e)))?;
        match stmt.query_row([], |_| Ok(())) {
            Ok(()) => true,
            Err(rusqlite::Error::QueryReturnedNoRows) => false,
            Err(e) => {
                return Err(AppError::Database(format!(
                    "Failed to execute foreign_key_check: {}",
                    e
                )))
            }
        }
    };

    if has_fk_violation {
        return Err(AppError::Database(
            "Foreign key check failed after migrations".to_string(),
        ));
    }

    Ok(())
}

fn apply_migration(
    tx: &Transaction,
    migration: &Migration,
    checksum: &str,
) -> Result<(), AppError> {
    tx.execute_batch(migration.sql).map_err(|e| {
        AppError::Database(format!(
            "Failed executing migration {} ({}): {}",
            migration.version, migration.name, e
        ))
    })?;

    let now = chrono_now_iso();
    tx.execute(
        "INSERT INTO schema_migration (version, name, applied_at, checksum) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![migration.version, migration.name, now, checksum],
    )
    .map_err(|e| {
        AppError::Database(format!(
            "Failed to record migration {}: {}",
            migration.version, e
        ))
    })?;

    tx.execute(&format!("PRAGMA user_version = {};", migration.version), [])
        .map_err(|e| AppError::Database(format!("Failed to update user_version: {}", e)))?;

    Ok(())
}

