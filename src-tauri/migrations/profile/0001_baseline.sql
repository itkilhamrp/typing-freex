-- Typing FreeX Profile Database — Canonical Baseline Schema v1
-- Single clean baseline for v0.1.0 initial release.
-- Note: `schema_migration` is managed exclusively by the migration runner (`db/migrate/runner.rs`).

CREATE TABLE IF NOT EXISTS profile_meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS setting (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS test_result (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid               TEXT NOT NULL UNIQUE,
    mode               TEXT NOT NULL CHECK (mode IN ('time', 'words', 'quote', 'tech', 'zen', 'custom')),
    mode_variant       TEXT NOT NULL,
    language           TEXT NOT NULL,
    wpm                REAL NOT NULL,
    raw_wpm            REAL NOT NULL,
    accuracy           REAL NOT NULL,
    consistency        REAL,
    duration_seconds   REAL NOT NULL,
    character_count    INTEGER NOT NULL,
    keystroke_count    INTEGER NOT NULL,
    correct_keystrokes INTEGER NOT NULL,
    error_keystrokes   INTEGER NOT NULL,
    completed_at       TEXT NOT NULL,
    is_completed       INTEGER NOT NULL CHECK (is_completed IN (0, 1)),
    payload_json       TEXT NOT NULL,
    payload_version    INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_test_result_mode_variant ON test_result (mode, mode_variant, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_result_completed_at ON test_result (completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_result_wpm          ON test_result (wpm DESC);
CREATE INDEX IF NOT EXISTS idx_test_result_custom       ON test_result (mode, completed_at DESC) WHERE mode = 'custom';

CREATE TABLE IF NOT EXISTS key_stat (
    key_char         TEXT PRIMARY KEY,
    total_attempts   INTEGER NOT NULL DEFAULT 0,
    total_errors     INTEGER NOT NULL DEFAULT 0,
    total_latency_ms INTEGER NOT NULL DEFAULT 0,
    updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS achievements (
    achievement_id TEXT PRIMARY KEY,
    category       TEXT NOT NULL,
    current_value  INTEGER NOT NULL DEFAULT 0,
    target_value   INTEGER NOT NULL,
    tier           INTEGER NOT NULL DEFAULT 0,
    unlocked       INTEGER NOT NULL DEFAULT 0 CHECK (unlocked IN (0, 1)),
    unlocked_at    TEXT,
    updated_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements (category);
CREATE INDEX IF NOT EXISTS idx_achievements_unlocked ON achievements (unlocked, category);

CREATE TABLE IF NOT EXISTS advancements (
    advancement_id TEXT PRIMARY KEY,
    category       TEXT NOT NULL,
    rank           INTEGER NOT NULL DEFAULT 0,
    unlocked       INTEGER NOT NULL DEFAULT 0 CHECK (unlocked IN (0, 1)),
    unlocked_at    TEXT,
    updated_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_advancements_category ON advancements (category);
CREATE INDEX IF NOT EXISTS idx_advancements_unlocked ON advancements (unlocked, category);

CREATE TABLE IF NOT EXISTS tracking_state (
    key        TEXT PRIMARY KEY,
    value      INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trophy_showcase (
    slot      INTEGER PRIMARY KEY CHECK (slot BETWEEN 1 AND 7),
    item_id   TEXT,
    item_type TEXT CHECK (item_type IS NULL OR item_type IN ('achievement', 'advancement')),
    pinned_at TEXT NOT NULL
);

