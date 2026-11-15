use serde::{Serialize, Serializer};

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error occurred")]
    Database(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Import error: {0}")]
    Import(String),

    #[error("IO error occurred")]
    Io(String),

    #[error("Internal application error")]
    Internal(String),
}

#[derive(Serialize)]
struct ErrorPayload {
    code: &'static str,
    message: String,
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let payload = match self {
            AppError::Database(details) => {
                crate::log_error!("db", "Database error: {}", details);
                ErrorPayload {
                    code: "DB_ERROR",
                    message: "A database error occurred. Internal details hidden for security.".to_string(),
                }
            }
            AppError::NotFound(msg) => ErrorPayload {
                code: "NOT_FOUND",
                message: msg.clone(),
            },
            AppError::Validation(msg) => ErrorPayload {
                code: "VALIDATION_ERROR",
                message: msg.clone(),
            },
            AppError::Conflict(msg) => ErrorPayload {
                code: "CONFLICT",
                message: msg.clone(),
            },
            AppError::Import(msg) => ErrorPayload {
                code: "IMPORT_ERROR",
                message: msg.clone(),
            },
            AppError::Io(details) => {
                crate::log_error!("io", "IO error: {}", details);
                ErrorPayload {
                    code: "IO_ERROR",
                    message: "A file operation error occurred.".to_string(),
                }
            }
            AppError::Internal(details) => {
                crate::log_error!("internal", "Internal error: {}", details);
                ErrorPayload {
                    code: "INTERNAL_ERROR",
                    message: "An internal error occurred.".to_string(),
                }
            }
        };
        payload.serialize(serializer)
    }
}

pub type AppResult<T> = Result<T, AppError>;
