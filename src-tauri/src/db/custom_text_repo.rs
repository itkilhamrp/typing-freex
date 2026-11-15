use rusqlite::params;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::collect_rows;
use crate::db::manager::DatabaseManager;
use crate::db::migrate::chrono_now_iso;
use crate::error::{AppError, AppResult};
use crate::text_import::compress::{compress_text, decompress_text};
use crate::text_import::diff::{
    apply_compact_delta, compute_line_diff, create_compact_delta, format_git_unified_diff,
    DiffTag,
};
use crate::text_import::sanitize::sanitize_text;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomTextSummary {
    pub id: String,
    pub title: String,
    pub word_count: usize,
    pub char_count: usize,
    pub language: String,
    pub source: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub revision: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomTextDetail {
    pub id: String,
    pub title: String,
    pub body: String,
    pub word_count: usize,
    pub char_count: usize,
    pub language: String,
    pub source: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub revision: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextRevision {
    pub revision_number: u32,
    pub created_at: String,
    pub word_count: usize,
    pub char_count: usize,
    pub preview: String,
    pub additions: usize,
    pub deletions: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RevisionDiffResult {
    pub target_revision: u32,
    pub base_revision: u32,
    pub additions: usize,
    pub deletions: usize,
    pub equal: usize,
    pub lines: Vec<DiffLineDto>,
    pub raw_diff: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffLineDto {
    pub tag: String,
    pub old_line_num: Option<usize>,
    pub new_line_num: Option<usize>,
    pub text: String,
}

pub fn create(
    manager: &DatabaseManager,
    title: String,
    body: String,
    language: Option<String>,
    source: Option<String>,
) -> AppResult<CustomTextDetail> {
    let trimmed_title = title.trim();
    if trimmed_title.is_empty() || trimmed_title.chars().count() > 100 {
        return Err(AppError::Validation(
            "Title must be between 1 and 100 characters".to_string(),
        ));
    }

    let (sanitized_body, _, stats) = sanitize_text(&body);
    if stats.char_count == 0 || stats.char_count > 50_000 {
        return Err(AppError::Validation(
            "Text body must be between 1 and 50,000 characters".to_string(),
        ));
    }

    let uuid = Uuid::new_v4().to_string();
    let now = chrono_now_iso();
    let lang = language.unwrap_or_else(|| "en".to_string());

    let comp = compress_text(&sanitized_body);
    let is_compressed = if comp.is_compressed { 1 } else { 0 };

    manager.with_registry_mut(|conn| {
        let tx = conn
            .transaction()
            .map_err(|e| AppError::Database(e.to_string()))?;

        tx.execute(
            "INSERT INTO custom_text (uuid, title, body, source, language, word_count, character_count, created_at, updated_at, is_compressed)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8, ?9)",
            params![
                &uuid,
                trimmed_title,
                &comp.data,
                &source,
                &lang,
                stats.word_count as i64,
                stats.char_count as i64,
                now,
                is_compressed,
            ],
        )
        .map_err(|e| AppError::Database(format!("Failed to insert custom_text: {}", e)))?;

        tx.execute(
            "INSERT INTO custom_text_revision (text_uuid, revision_number, body, created_at, is_compressed)
             VALUES (?1, 1, ?2, ?3, ?4)",
            params![&uuid, &comp.data, now, is_compressed],
        )
        .map_err(|e| AppError::Database(format!("Failed to insert revision: {}", e)))?;

        tx.commit()
            .map_err(|e| AppError::Database(format!("Failed to commit custom_text: {}", e)))?;

        Ok(CustomTextDetail {
            id: uuid,
            title: trimmed_title.to_string(),
            body: sanitized_body,
            word_count: stats.word_count,
            char_count: stats.char_count,
            language: lang,
            source,
            created_at: now.to_string(),
            updated_at: now.to_string(),
            revision: 1,
        })
    })
}

pub fn list(
    manager: &DatabaseManager,
    query: Option<String>,
    sort: Option<String>,
    limit: Option<u32>,
    offset: Option<u32>,
) -> AppResult<Vec<CustomTextSummary>> {
    let limit_val = limit.unwrap_or(100).min(500);
    let offset_val = offset.unwrap_or(0);

    manager.with_registry(|conn| {
        let mut sql = String::from(
            "SELECT c.uuid, c.title, c.word_count, c.character_count, c.language, c.source,
                    c.created_at, c.updated_at,
                    COALESCE((SELECT MAX(revision_number) FROM custom_text_revision WHERE text_uuid = c.uuid), 1)
             FROM custom_text c
             WHERE 1=1",
        );

        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(ref q) = query {
            let trimmed = q.trim();
            if !trimmed.is_empty() {
                sql.push_str(" AND c.title LIKE ?");
                params_vec.push(Box::new(format!("%{}%", trimmed)));
            }
        }

        match sort.as_deref() {
            Some("title") => sql.push_str(" ORDER BY c.title COLLATE NOCASE ASC, c.updated_at DESC"),
            Some("word_count") => sql.push_str(" ORDER BY c.word_count DESC, c.updated_at DESC"),
            _ => sql.push_str(" ORDER BY c.updated_at DESC, c.rowid DESC"),
        }

        sql.push_str(" LIMIT ? OFFSET ?");
        params_vec.push(Box::new(limit_val));
        params_vec.push(Box::new(offset_val));

        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();
        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| AppError::Database(e.to_string()))?;

        let rows = stmt
            .query_map(params_refs.as_slice(), |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let word_count: i64 = row.get(2)?;
                let char_count: i64 = row.get(3)?;
                let language: String = row.get(4)?;
                let source: Option<String> = row.get(5)?;
                let created_at: String = row.get(6)?;
                let updated_at: String = row.get(7)?;
                let revision: u32 = row.get(8)?;

                Ok(CustomTextSummary {
                    id,
                    title,
                    word_count: word_count.max(0) as usize,
                    char_count: char_count.max(0) as usize,
                    language,
                    source,
                    created_at,
                    updated_at,
                    revision,
                })
            })
            .map_err(|e| AppError::Database(e.to_string()))?;

        collect_rows(rows)
    })
}

pub fn get(manager: &DatabaseManager, id: &str) -> AppResult<Option<CustomTextDetail>> {
    manager.with_registry(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT c.uuid, c.title, c.body, c.word_count, c.character_count, c.language, c.source,
                        c.created_at, c.updated_at,
                        COALESCE((SELECT MAX(revision_number) FROM custom_text_revision WHERE text_uuid = c.uuid), 1),
                        c.is_compressed
                 FROM custom_text c
                 WHERE c.uuid = ?1",
            )
            .map_err(|e| AppError::Database(e.to_string()))?;

        let mut rows = stmt
            .query_map([id], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let raw_body: String = row.get(2)?;
                let word_count: i64 = row.get(3)?;
                let char_count: i64 = row.get(4)?;
                let language: String = row.get(5)?;
                let source: Option<String> = row.get(6)?;
                let created_at: String = row.get(7)?;
                let updated_at: String = row.get(8)?;
                let revision: u32 = row.get(9)?;
                let is_comp: i64 = row.get(10).unwrap_or(0);

                let body = decompress_text(&raw_body, is_comp == 1).map_err(|e| {
                    rusqlite::Error::FromSqlConversionFailure(
                        2,
                        rusqlite::types::Type::Text,
                        Box::new(e),
                    )
                })?;

                Ok(CustomTextDetail {
                    id,
                    title,
                    body,
                    word_count: word_count.max(0) as usize,
                    char_count: char_count.max(0) as usize,
                    language,
                    source,
                    created_at,
                    updated_at,
                    revision,
                })
            })
            .map_err(|e| AppError::Database(e.to_string()))?;

        match rows.next() {
            Some(res) => Ok(Some(res.map_err(|e| AppError::Database(e.to_string()))?)),
            None => Ok(None),
        }
    })
}

pub fn update(
    manager: &DatabaseManager,
    id: &str,
    title: String,
    body: String,
    base_revision: u32,
) -> AppResult<CustomTextDetail> {
    let trimmed_title = title.trim();
    if trimmed_title.is_empty() || trimmed_title.chars().count() > 100 {
        return Err(AppError::Validation(
            "Title must be between 1 and 100 characters".to_string(),
        ));
    }

    let (sanitized_body, _, stats) = sanitize_text(&body);
    if stats.char_count == 0 || stats.char_count > 50_000 {
        return Err(AppError::Validation(
            "Text body must be between 1 and 50,000 characters".to_string(),
        ));
    }

    let now = chrono_now_iso();
    let comp = compress_text(&sanitized_body);
    let is_compressed = if comp.is_compressed { 1 } else { 0 };

    manager.with_registry_mut(|conn| {
        let tx = conn
            .transaction()
            .map_err(|e| AppError::Database(e.to_string()))?;

        // Verify existing text FIRST before checking base_revision (optimistic concurrency)
        let (existing_stored_body, existing_compressed): (String, i64) = tx
            .query_row(
                "SELECT body, COALESCE(is_compressed, 0) FROM custom_text WHERE uuid = ?1",
                [id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(|_| AppError::NotFound(format!("Custom text {} not found", id)))?;

        let current_rev: u32 = tx
            .query_row(
                "SELECT COALESCE(MAX(revision_number), 1) FROM custom_text_revision WHERE text_uuid = ?1",
                [id],
                |row| row.get(0),
            )
            .map_err(|e| AppError::Database(e.to_string()))?;

        if current_rev != base_revision {
            return Err(AppError::Conflict(format!(
                "Edit conflict: current revision is {}, but base revision was {}",
                current_rev, base_revision
            )));
        }

        let existing_body = decompress_text(&existing_stored_body, existing_compressed == 1)
            .map_err(|e| AppError::Database(format!("Decompress existing body failed: {}", e)))?;

        let is_content_changed = existing_body != sanitized_body;

        let new_rev = if is_content_changed {
            let (delta, diff_stats) = create_compact_delta(&existing_body, &sanitized_body);
            if diff_stats.additions == 0 && diff_stats.deletions == 0 {
                current_rev
            } else {
                let next_rev = current_rev + 1;
                let full_comp = compress_text(&sanitized_body);
                // Adaptive Delta Compression: store delta if smaller than full body
                let (stored_rev_data, rev_comp_flag) = if delta.len() < full_comp.data.len() {
                    (delta, 2)
                } else {
                    let flag = if full_comp.is_compressed { 1 } else { 0 };
                    (full_comp.data, flag)
                };

                tx.execute(
                    "INSERT INTO custom_text_revision (text_uuid, revision_number, body, created_at, is_compressed)
                     VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![id, next_rev, &stored_rev_data, now, rev_comp_flag],
                )
                .map_err(|e| AppError::Database(e.to_string()))?;
                next_rev
            }
        } else {
            current_rev
        };

        tx.execute(
            "UPDATE custom_text SET
                title = ?1,
                body = ?2,
                word_count = ?3,
                character_count = ?4,
                updated_at = ?5,
                is_compressed = ?6
             WHERE uuid = ?7",
            params![
                trimmed_title,
                &comp.data,
                stats.word_count as i64,
                stats.char_count as i64,
                now,
                is_compressed,
                id,
            ],
        )
        .map_err(|e| AppError::Database(e.to_string()))?;

        let (language, source, created_at): (String, Option<String>, String) = tx
            .query_row(
                "SELECT language, source, created_at FROM custom_text WHERE uuid = ?1",
                [id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .map_err(|e| AppError::Database(e.to_string()))?;

        tx.commit()
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(CustomTextDetail {
            id: id.to_string(),
            title: trimmed_title.to_string(),
            body: sanitized_body,
            word_count: stats.word_count,
            char_count: stats.char_count,
            language,
            source,
            created_at,
            updated_at: now.to_string(),
            revision: new_rev,
        })
    })
}

pub fn delete(manager: &DatabaseManager, id: &str) -> AppResult<()> {
    manager.with_registry_mut(|conn| {
        let tx = conn
            .transaction()
            .map_err(|e| AppError::Database(e.to_string()))?;
        tx.execute("DELETE FROM custom_text_revision WHERE text_uuid = ?1", [id])
            .map_err(|e| AppError::Database(e.to_string()))?;
        tx.execute("DELETE FROM custom_text WHERE uuid = ?1", [id])
            .map_err(|e| AppError::Database(e.to_string()))?;
        tx.commit()
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    })
}

pub fn reconstruct_revision_body(
    conn: &rusqlite::Connection,
    text_uuid: &str,
    target_rev: u32,
) -> AppResult<String> {
    let mut stmt = conn
        .prepare(
            "SELECT revision_number, body, COALESCE(is_compressed, 0)
             FROM custom_text_revision
             WHERE text_uuid = ?1 AND revision_number <= ?2
             ORDER BY revision_number ASC",
        )
        .map_err(|e| AppError::Database(e.to_string()))?;

    let rows: Vec<(u32, String, i64)> = stmt
        .query_map(params![text_uuid, target_rev], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })
        .map_err(|e| AppError::Database(e.to_string()))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| AppError::Database(e.to_string()))?;

    if rows.is_empty() {
        return Err(AppError::NotFound(format!(
            "Revision {} not found for text {}",
            target_rev, text_uuid
        )));
    }

    let base_idx = rows
        .iter()
        .rposition(|(_, _, is_comp)| *is_comp != 2)
        .ok_or_else(|| {
            AppError::Database(format!(
                "No base snapshot found for text {} up to revision {}",
                text_uuid, target_rev
            ))
        })?;

    let (_, base_body_raw, base_is_comp) = &rows[base_idx];
    let mut current_body = decompress_text(base_body_raw, *base_is_comp == 1)
        .map_err(|e| AppError::Database(format!("Decompress base revision failed: {}", e)))?;

    for (_, delta_data, _) in &rows[(base_idx + 1)..] {
        current_body = apply_compact_delta(&current_body, delta_data)?;
    }

    Ok(current_body)
}

pub fn list_revisions(manager: &DatabaseManager, id: &str) -> AppResult<Vec<TextRevision>> {
    manager.with_registry(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT revision_number, body, COALESCE(is_compressed, 0), created_at
                 FROM custom_text_revision
                 WHERE text_uuid = ?1
                 ORDER BY revision_number ASC",
            )
            .map_err(|e| AppError::Database(e.to_string()))?;

        let rev_rows: Vec<(u32, String, i64, String)> = stmt
            .query_map([id], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
            })
            .map_err(|e| AppError::Database(e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| AppError::Database(e.to_string()))?;

        if rev_rows.is_empty() {
            return Ok(Vec::new());
        }

        let mut list = Vec::with_capacity(rev_rows.len());
        let mut prev_body: Option<String> = None;

        for (rev_num, raw_body, is_comp, created_at) in rev_rows {
            let body = if is_comp == 2 {
                let base = prev_body.as_deref().ok_or_else(|| {
                    AppError::Database(format!(
                        "Delta revision {} missing preceding base revision for text {}",
                        rev_num, id
                    ))
                })?;
                apply_compact_delta(base, &raw_body)?
            } else {
                decompress_text(&raw_body, is_comp == 1).map_err(|e| {
                    AppError::Database(format!(
                        "Failed to decompress revision {} for text {}: {}",
                        rev_num, id, e
                    ))
                })?
            };

            let word_count = body.split_whitespace().count();
            let char_count = body.chars().count();
            let preview: String = body.chars().take(100).collect();

            let (additions, deletions) = if let Some(ref pb) = prev_body {
                let (_, stats) = compute_line_diff(pb, &body);
                (stats.additions, stats.deletions)
            } else {
                let line_count = if body.is_empty() {
                    0
                } else {
                    body.split('\n').count()
                };
                (line_count, 0)
            };

            prev_body = Some(body);

            list.push(TextRevision {
                revision_number: rev_num,
                created_at,
                word_count,
                char_count,
                preview,
                additions,
                deletions,
            });
        }

        // Return latest revisions first (descending), limited to 20
        list.reverse();
        list.truncate(20);
        Ok(list)
    })
}

pub fn revision_diff(
    manager: &DatabaseManager,
    id: &str,
    target_revision: u32,
    base_revision: Option<u32>,
) -> AppResult<RevisionDiffResult> {
    manager.with_registry(|conn| {
        let base_rev_num = base_revision.unwrap_or_else(|| {
            if target_revision > 1 {
                target_revision - 1
            } else {
                1
            }
        });

        let target_body = reconstruct_revision_body(conn, id, target_revision)?;
        let base_body = if base_rev_num == target_revision {
            target_body.clone()
        } else {
            reconstruct_revision_body(conn, id, base_rev_num).unwrap_or_default()
        };

        let (diff_lines, stats) = compute_line_diff(&base_body, &target_body);
        let raw_diff = format_git_unified_diff(id, base_rev_num, target_revision, &diff_lines);

        let lines = diff_lines
            .into_iter()
            .map(|l| DiffLineDto {
                tag: match l.tag {
                    DiffTag::Equal => "equal".to_string(),
                    DiffTag::Insert => "insert".to_string(),
                    DiffTag::Delete => "delete".to_string(),
                },
                old_line_num: l.old_line_num,
                new_line_num: l.new_line_num,
                text: l.text,
            })
            .collect();

        Ok(RevisionDiffResult {
            target_revision,
            base_revision: base_rev_num,
            additions: stats.additions,
            deletions: stats.deletions,
            equal: stats.equal,
            lines,
            raw_diff,
        })
    })
}

pub fn duplicate(manager: &DatabaseManager, id: &str) -> AppResult<CustomTextDetail> {
    let existing = get(manager, id)?
        .ok_or_else(|| AppError::NotFound(format!("Text {} not found", id)))?;

    let truncated_title: String = existing.title.chars().take(93).collect();
    let new_title = format!("{} (copy)", truncated_title);
    create(
        manager,
        new_title,
        existing.body,
        Some(existing.language),
        existing.source,
    )
}

pub fn restore(
    manager: &DatabaseManager,
    id: &str,
    revision_number: u32,
) -> AppResult<CustomTextDetail> {
    let body = manager.with_registry(|conn| reconstruct_revision_body(conn, id, revision_number))?;

    let existing =
        get(manager, id)?.ok_or_else(|| AppError::NotFound(format!("Text {} not found", id)))?;

    update(manager, id, existing.title, body, existing.revision)
}

pub fn mark_used(manager: &DatabaseManager, id: &str) -> AppResult<()> {
    manager.with_registry_mut(|conn| {
        let now = chrono_now_iso();
        conn.execute(
            "UPDATE custom_text SET updated_at = ?1 WHERE uuid = ?2",
            params![now, id],
        )
        .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    })
}
