use once_cell::sync::Lazy;
use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

static LOGGER: Lazy<Mutex<Option<FileLogger>>> = Lazy::new(|| Mutex::new(None));

/// Local rotating file logger that strictly redacts typed text content (SEC-14).
/// Rotates files at 5 MiB up to 3 generations.
pub struct FileLogger {
    log_dir: PathBuf,
    current_file: Option<File>,
    current_size: u64,
    max_size_bytes: u64,
    enabled: bool,
}

impl FileLogger {
    pub fn init(app_data_dir: &Path, enabled: bool) -> std::io::Result<()> {
        let log_dir = app_data_dir.join("logs");
        fs::create_dir_all(&log_dir)?;
        let log_path = log_dir.join("typing_freex.log");
        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_path)?;
        let current_size = file.metadata()?.len();

        let logger = FileLogger {
            log_dir,
            current_file: Some(file),
            current_size,
            max_size_bytes: 5 * 1024 * 1024, // 5 MiB
            enabled,
        };

        let mut global = LOGGER.lock().unwrap_or_else(|e| e.into_inner());
        *global = Some(logger);
        Ok(())
    }

    pub fn set_enabled(enabled: bool) {
        let mut lock = LOGGER.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(logger) = lock.as_mut() {
            logger.enabled = enabled;
        }
    }

    pub fn is_enabled() -> bool {
        let lock = LOGGER.lock().unwrap_or_else(|e| e.into_inner());
        lock.as_ref().map(|l| l.enabled).unwrap_or(false)
    }

    pub fn log(level: &str, target: &str, message: &str) {
        let mut lock = LOGGER.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(logger) = lock.as_mut() {
            if !logger.enabled {
                return;
            }
            let timestamp = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            let line = format!("[{timestamp}] [{level}] [{target}] {message}\n");
            let bytes = line.as_bytes();

            // Rotate if capacity exceeded
            if logger.current_size + bytes.len() as u64 > logger.max_size_bytes {
                let _ = logger.rotate();
            }

            if let Some(file) = logger.current_file.as_mut()
                && file.write_all(bytes).is_ok()
            {
                let _ = file.flush();
                logger.current_size += bytes.len() as u64;
            }
        }
    }

    fn rotate(&mut self) -> std::io::Result<()> {
        let base = self.log_dir.join("typing_freex.log");
        let rot2 = self.log_dir.join("typing_freex.log.2");
        let rot1 = self.log_dir.join("typing_freex.log.1");

        // Close active handle before renaming so Windows does not reject the rename
        if let Some(mut f) = self.current_file.take() {
            let _ = f.flush();
        }

        if rot1.exists() {
            let _ = fs::rename(&rot1, &rot2);
        }
        let rotated = if base.exists() {
            fs::rename(&base, &rot1).is_ok()
        } else {
            true
        };

        let reopened = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&base)?;
        let actual_len = reopened.metadata().map(|m| m.len()).unwrap_or(0);
        self.current_file = Some(reopened);
        if rotated {
            self.current_size = 0;
        } else {
            self.current_size = actual_len;
        }
        Ok(())
    }
}

#[macro_export]
macro_rules! log_info {
    ($target:expr, $($arg:tt)+) => {
        if $crate::logger::FileLogger::is_enabled() {
            $crate::logger::FileLogger::log("INFO", $target, &format!($($arg)+));
        }
    };
}

#[macro_export]
macro_rules! log_warn {
    ($target:expr, $($arg:tt)+) => {
        if $crate::logger::FileLogger::is_enabled() {
            $crate::logger::FileLogger::log("WARN", $target, &format!($($arg)+));
        }
    };
}

#[macro_export]
macro_rules! log_error {
    ($target:expr, $($arg:tt)+) => {
        if $crate::logger::FileLogger::is_enabled() {
            $crate::logger::FileLogger::log("ERROR", $target, &format!($($arg)+));
        }
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_logger_rotation_and_redaction() {
        let temp_dir = std::env::temp_dir().join(format!("typing_freex_log_test_{}", uuid::Uuid::new_v4()));
        FileLogger::init(&temp_dir, true).expect("init failed");

        // Log sample metadata
        FileLogger::log("INFO", "test_save", "result_saved uuid=123-abc wpm=85.2 acc=98.5");
        FileLogger::log("WARN", "import", "hash_mismatch sidecar missing");

        let log_file = temp_dir.join("logs").join("typing_freex.log");
        assert!(log_file.exists());
        let content = fs::read_to_string(&log_file).unwrap();
        assert!(content.contains("[INFO] [test_save] result_saved"));
        assert!(content.contains("[WARN] [import] hash_mismatch"));

        // Cleanup
        let _ = fs::remove_dir_all(&temp_dir);
    }
}
