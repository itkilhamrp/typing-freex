-- Typing FreeX Registry Database — Canonical Baseline Schema v1
-- Single clean baseline for v0.1.0 initial release (`registry.db`).
-- Note: `schema_migration` is managed exclusively by the migration runner (`db/migrate/runner.rs`).

CREATE TABLE IF NOT EXISTS profile (
    uuid           TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    slug           TEXT NOT NULL UNIQUE,
    created_at     TEXT NOT NULL,
    last_active_at TEXT NOT NULL,
    db_path        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS active_profile (
    id           INTEGER PRIMARY KEY CHECK (id = 1),
    profile_uuid TEXT NOT NULL REFERENCES profile(uuid)
);

CREATE TABLE IF NOT EXISTS app_setting (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_text (
    uuid            TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    body            TEXT NOT NULL,
    source          TEXT,
    language        TEXT NOT NULL DEFAULT 'en',
    word_count      INTEGER NOT NULL,
    character_count INTEGER NOT NULL,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    is_compressed   INTEGER NOT NULL DEFAULT 0 CHECK (is_compressed IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_custom_text_updated_at ON custom_text (updated_at DESC);

CREATE TABLE IF NOT EXISTS custom_text_revision (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    text_uuid       TEXT NOT NULL REFERENCES custom_text(uuid) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    body            TEXT NOT NULL,
    created_at      TEXT NOT NULL,
    is_compressed   INTEGER NOT NULL DEFAULT 0 CHECK (is_compressed IN (0, 1, 2)),
    UNIQUE (text_uuid, revision_number)
);

