-- Typing FreeX Profile Database — Migration 0002: Analytics & History Indexes
-- Accelerates stats and history queries filtering on (is_completed, mode, completed_at).

CREATE INDEX IF NOT EXISTS idx_test_result_stats
    ON test_result (is_completed, mode, completed_at DESC);
