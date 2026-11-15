use tauri::State;

pub use crate::db::custom_text_repo::{
    create as custom_text_create_internal, delete as custom_text_delete_internal,
    duplicate as custom_text_duplicate_internal, get as custom_text_get_internal,
    list as custom_text_list_internal, list_revisions as custom_text_revisions_internal,
    reconstruct_revision_body, revision_diff as custom_text_revision_diff_internal,
    update as custom_text_update_internal, CustomTextDetail, CustomTextSummary, DiffLineDto,
    RevisionDiffResult, TextRevision,
};
use crate::db::custom_text_repo;
use crate::db::manager::DatabaseManager;
use crate::error::{AppError, AppResult};
pub use crate::text_import::service::{export_to_file as custom_text_export_to_file_internal, ExportFileResult};
use crate::text_import::service;
use crate::text_import::staging::ImportPickResult;

#[tauri::command]
pub async fn custom_text_list(
    manager: State<'_, DatabaseManager>,
    query: Option<String>,
    sort: Option<String>,
    limit: Option<u32>,
    offset: Option<u32>,
) -> AppResult<Vec<CustomTextSummary>> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        custom_text_repo::list(&mgr, query, sort, limit, offset)
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_get(
    manager: State<'_, DatabaseManager>,
    id: String,
) -> AppResult<Option<CustomTextDetail>> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || custom_text_repo::get(&mgr, &id))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_create(
    manager: State<'_, DatabaseManager>,
    title: String,
    body: String,
    language: Option<String>,
    source: Option<String>,
) -> AppResult<CustomTextDetail> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        custom_text_repo::create(&mgr, title, body, language, source)
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_update(
    manager: State<'_, DatabaseManager>,
    id: String,
    title: String,
    body: String,
    base_revision: u32,
) -> AppResult<CustomTextDetail> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        custom_text_repo::update(&mgr, &id, title, body, base_revision)
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_delete(
    manager: State<'_, DatabaseManager>,
    id: String,
) -> AppResult<()> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || custom_text_repo::delete(&mgr, &id))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_duplicate(
    manager: State<'_, DatabaseManager>,
    id: String,
) -> AppResult<CustomTextDetail> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || custom_text_repo::duplicate(&mgr, &id))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_revisions(
    manager: State<'_, DatabaseManager>,
    id: String,
) -> AppResult<Vec<TextRevision>> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || custom_text_repo::list_revisions(&mgr, &id))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_restore(
    manager: State<'_, DatabaseManager>,
    id: String,
    revision_number: u32,
) -> AppResult<CustomTextDetail> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        custom_text_repo::restore(&mgr, &id, revision_number)
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_revision_diff(
    manager: State<'_, DatabaseManager>,
    id: String,
    target_revision: u32,
    base_revision: Option<u32>,
) -> AppResult<RevisionDiffResult> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        custom_text_repo::revision_diff(&mgr, &id, target_revision, base_revision)
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_mark_used(
    manager: State<'_, DatabaseManager>,
    id: String,
) -> AppResult<()> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || custom_text_repo::mark_used(&mgr, &id))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_import_pick(file_path: String) -> AppResult<Option<ImportPickResult>> {
    tauri::async_runtime::spawn_blocking(move || service::pick_and_stage(&file_path))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_import_reencode(
    staging_id: String,
    encoding: String,
) -> AppResult<ImportPickResult> {
    tauri::async_runtime::spawn_blocking(move || service::reencode(&staging_id, &encoding))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_import_commit(
    manager: State<'_, DatabaseManager>,
    staging_id: String,
    title: Option<String>,
    language: Option<String>,
    split_strategy: Option<String>,
) -> AppResult<Vec<CustomTextDetail>> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        service::commit_import(&mgr, &staging_id, title, language, split_strategy)
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_import_cancel(staging_id: String) -> AppResult<()> {
    tauri::async_runtime::spawn_blocking(move || service::cancel_import(&staging_id))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_export(
    manager: State<'_, DatabaseManager>,
    id: String,
    format: Option<String>,
) -> AppResult<String> {
    let _ = format;
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || service::export_text_body(&mgr, &id))
        .await
        .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[tauri::command]
pub async fn custom_text_export_to_file(
    manager: State<'_, DatabaseManager>,
    id: String,
    destination_path: String,
) -> AppResult<ExportFileResult> {
    let mgr = manager.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        service::export_to_file(&mgr, &id, &destination_path)
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    fn temp_test_dir(name: &str) -> std::path::PathBuf {
        let p = std::env::temp_dir().join(format!("tfrx_ct_{}_{}", name, Uuid::new_v4()));
        let _ = std::fs::remove_dir_all(&p);
        p
    }

    #[test]
    fn test_custom_text_lifecycle_and_revisions() {
        let dir = temp_test_dir("ct_test");
        let manager = DatabaseManager::new(dir).unwrap();
        manager.create_profile("Text Author", "text-author").unwrap();

        // 1. Create text
        let created = custom_text_create_internal(
            &manager,
            "My Story".to_string(),
            "Once upon a time in a land of code.".to_string(),
            Some("en".to_string()),
            None,
        )
        .unwrap();

        assert_eq!(created.title, "My Story");
        assert_eq!(created.revision, 1);
        assert_eq!(created.word_count, 9);

        // 2. List texts
        let list = custom_text_list_internal(&manager, None, None, None, None).unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].title, "My Story");

        // 3. Update text with valid base_revision
        let updated = custom_text_update_internal(
            &manager,
            &created.id,
            "My Story (Edited)".to_string(),
            "Once upon a time in a land of Rust and code.".to_string(),
            1,
        )
        .unwrap();

        assert_eq!(updated.title, "My Story (Edited)");
        assert_eq!(updated.revision, 2);

        // 4. Stale base_revision causes conflict
        let conflict_err = custom_text_update_internal(
            &manager,
            &created.id,
            "Stale Edit".to_string(),
            "This should fail".to_string(),
            1, // base revision 1 is stale now, current is 2
        );
        assert!(conflict_err.is_err());

        // 5. Revisions history with Git diff telemetry
        let revs = custom_text_revisions_internal(&manager, &created.id).unwrap();
        assert_eq!(revs.len(), 2);
        assert_eq!(revs[0].revision_number, 2);
        assert_eq!(revs[1].revision_number, 1);
        assert_eq!(revs[0].additions, 1);
        assert_eq!(revs[0].deletions, 1);

        // 5b. Deduplication: update with identical body should not spawn a new revision
        let noop_update = custom_text_update_internal(
            &manager,
            &created.id,
            "My Story (Edited)".to_string(),
            "Once upon a time in a land of Rust and code.".to_string(),
            2,
        )
        .unwrap();
        assert_eq!(noop_update.revision, 2);
        let revs_after_noop = custom_text_revisions_internal(&manager, &created.id).unwrap();
        assert_eq!(revs_after_noop.len(), 2, "No duplicate revision should be created");

        // 5c. Git diff inspection command
        let diff_res = custom_text_revision_diff_internal(&manager, &created.id, 2, Some(1)).unwrap();
        assert_eq!(diff_res.target_revision, 2);
        assert_eq!(diff_res.base_revision, 1);
        assert_eq!(diff_res.additions, 1);
        assert_eq!(diff_res.deletions, 1);
        assert!(diff_res.lines.iter().any(|l| l.tag == "insert"));
        assert!(diff_res.lines.iter().any(|l| l.tag == "delete"));
        assert!(diff_res.raw_diff.contains("+++ b/"));

        // 6. Duplicate text
        let dup = custom_text_duplicate_internal(&manager, &created.id).unwrap();
        assert_eq!(dup.title, "My Story (Edited) (copy)");
        assert_eq!(dup.revision, 1);

        // 7. Delete text
        custom_text_delete_internal(&manager, &created.id).unwrap();
        let after_delete = custom_text_get_internal(&manager, &created.id).unwrap();
        assert!(after_delete.is_none());
    }

    #[test]
    fn test_custom_text_cross_profile_sharing_and_compression() {
        let dir = temp_test_dir("ct_cross_profile");
        let manager = DatabaseManager::new(dir).unwrap();

        // 1. Create two separate profiles: Alice and Bob
        let alice_p = manager.create_profile("Alice", "alice-slug").unwrap();
        let bob_p = manager.create_profile("Bob", "bob-slug").unwrap();

        // 2. Active profile = Alice creates a repetitive custom text
        manager.switch_profile(&alice_p.uuid).unwrap();
        let repetitive_story = "The quick brown fox jumps over the lazy dog. ".repeat(15);
        let alice_text = custom_text_create_internal(
            &manager,
            "Shared Fox Tale".to_string(),
            repetitive_story.clone(),
            Some("en".to_string()),
            Some("community".to_string()),
        )
        .unwrap();

        assert_eq!(alice_text.title, "Shared Fox Tale");
        assert_eq!(alice_text.revision, 1);
        assert_eq!(alice_text.body, repetitive_story);

        // Verify that storage in registry is actually compressed
        manager.with_registry(|conn| {
            let (stored_body, is_compressed): (String, i64) = conn
                .query_row(
                    "SELECT body, is_compressed FROM custom_text WHERE uuid = ?1",
                    [&alice_text.id],
                    |row| Ok((row.get(0)?, row.get(1)?)),
                )
                .unwrap();
            assert_eq!(is_compressed, 1, "Should be marked as compressed");
            assert!(
                stored_body.len() < repetitive_story.len(),
                "Stored compressed body ({}) must be smaller than raw body ({})",
                stored_body.len(),
                repetitive_story.len()
            );
            Ok(())
        })
        .unwrap();

        // 3. Switch active profile to Bob
        manager.switch_profile(&bob_p.uuid).unwrap();

        // Bob lists texts and sees Alice's text
        let bob_list = custom_text_list_internal(&manager, None, None, None, None).unwrap();
        assert_eq!(bob_list.len(), 1);
        assert_eq!(bob_list[0].id, alice_text.id);
        assert_eq!(bob_list[0].title, "Shared Fox Tale");

        // Bob reads the text (transparent decompression)
        let bob_detail = custom_text_get_internal(&manager, &alice_text.id)
            .unwrap()
            .expect("Bob should find the shared text");
        assert_eq!(bob_detail.body, repetitive_story);

        // 4. Bob updates the text (Revision 2)
        let updated_by_bob = format!("{}And they all lived happily ever after.", repetitive_story);
        let bob_update = custom_text_update_internal(
            &manager,
            &alice_text.id,
            "Shared Fox Tale (Edited by Bob)".to_string(),
            updated_by_bob.clone(),
            1,
        )
        .unwrap();
        assert_eq!(bob_update.revision, 2);
        assert_eq!(bob_update.title, "Shared Fox Tale (Edited by Bob)");

        // 5. Switch back to Alice
        manager.switch_profile(&alice_p.uuid).unwrap();

        // Alice sees Bob's update
        let alice_read_back = custom_text_get_internal(&manager, &alice_text.id)
            .unwrap()
            .unwrap();
        assert_eq!(alice_read_back.revision, 2);
        assert_eq!(alice_read_back.title, "Shared Fox Tale (Edited by Bob)");
        assert_eq!(alice_read_back.body, updated_by_bob);

        // Alice views revision history
        let revs = custom_text_revisions_internal(&manager, &alice_text.id).unwrap();
        assert_eq!(revs.len(), 2);
        assert_eq!(revs[0].revision_number, 2);
        assert_eq!(revs[1].revision_number, 1);

        // 6. Alice deletes the shared text
        custom_text_delete_internal(&manager, &alice_text.id).unwrap();

        // Bob also confirms it is gone
        manager.switch_profile(&bob_p.uuid).unwrap();
        let bob_read_after_delete = custom_text_get_internal(&manager, &alice_text.id).unwrap();
        assert!(bob_read_after_delete.is_none());
    }

    #[test]
    fn test_custom_text_export_to_file() {
        let dir = temp_test_dir("ct_export_file");
        let manager = DatabaseManager::new(dir.clone()).unwrap();

        let created = custom_text_create_internal(
            &manager,
            "Exportable Drill".to_string(),
            "Line 1\r\nLine 2 with special chars: 12345".to_string(),
            Some("en".to_string()),
            None,
        )
        .unwrap();

        let export_dest = dir.join("exported_drill.txt");
        let dest_str = export_dest.to_str().unwrap();

        let res = custom_text_export_to_file_internal(&manager, &created.id, dest_str).unwrap();
        assert!(res.success);
        assert_eq!(res.path, dest_str);

        // Verify written file contents have LF newlines
        let written = std::fs::read_to_string(&export_dest).unwrap();
        assert_eq!(written, "Line 1\nLine 2 with special chars: 12345");

        let _ = std::fs::remove_dir_all(&dir);
    }
}
