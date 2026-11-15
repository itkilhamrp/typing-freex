pub mod backup;
pub mod custom_text_repo;
pub mod legacy_migrate;
pub mod manager;
pub mod migrate;
pub mod registry;
pub mod validate;

use crate::error::{AppError, AppResult};

/// Helper to collect and map rusqlite iterator rows into an `AppResult<Vec<T>>`.
pub fn collect_rows<T, I, E>(iter: I) -> AppResult<Vec<T>>
where
    I: IntoIterator<Item = Result<T, E>>,
    E: std::fmt::Display,
{
    let mut list = Vec::new();
    for r in iter {
        list.push(r.map_err(|e| AppError::Database(e.to_string()))?);
    }
    Ok(list)
}
