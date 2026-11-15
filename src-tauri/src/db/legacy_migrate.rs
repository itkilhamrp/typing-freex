use std::fs;
use std::io;
use std::path::Path;

const LEGACY_APP_IDENTIFIER: &str = "com.typing_freex.i18n";

/// Migrates data from the legacy `com.typing_freex.i18n` app data directory
/// into `new_dir` (`com.typing-freex.app`) if `new_dir/registry.db` does not yet exist.
pub fn migrate_legacy_app_data_dir(new_dir: &Path) {
    if new_dir.join("registry.db").exists() {
        return;
    }

    let Some(parent) = new_dir.parent() else {
        return;
    };

    let legacy_dir = parent.join(LEGACY_APP_IDENTIFIER);
    if legacy_dir == new_dir || !legacy_dir.join("registry.db").exists() {
        return;
    }

    if fs::create_dir_all(new_dir).is_err() {
        return;
    }

    let _ = copy_dir_contents(&legacy_dir, new_dir);
}

fn copy_dir_contents(src: &Path, dst: &Path) -> io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        let file_type = entry.file_type()?;

        if file_type.is_dir() {
            copy_dir_contents(&src_path, &dst_path)?;
        } else if file_type.is_file()
            && !dst_path.exists()
            && fs::rename(&src_path, &dst_path).is_err()
        {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[test]
    fn test_migrate_legacy_app_data_dir() {
        let root = std::env::temp_dir().join(format!("tfrx_leg_mig_{}", Uuid::new_v4()));
        let legacy = root.join(LEGACY_APP_IDENTIFIER);
        let new_dir = root.join("com.typing-freex.app");

        fs::create_dir_all(legacy.join("profiles").join("u1")).unwrap();
        fs::write(legacy.join("registry.db"), b"sqlite-reg").unwrap();
        fs::write(
            legacy.join("profiles").join("u1").join("typing_freex.db"),
            b"sqlite-prof",
        )
        .unwrap();

        migrate_legacy_app_data_dir(&new_dir);

        assert!(new_dir.join("registry.db").exists());
        assert!(
            new_dir
                .join("profiles")
                .join("u1")
                .join("typing_freex.db")
                .exists()
        );

        let _ = fs::remove_dir_all(&root);
    }
}
