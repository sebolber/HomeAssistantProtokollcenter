-- Iter 32: Escalation-Regeln.

CREATE TABLE IF NOT EXISTS escalation_rules (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    source_pattern     TEXT NOT NULL,           -- exakt oder mit %
    severity           TEXT NOT NULL,           -- triggernde Severity
    threshold_count    INTEGER NOT NULL,
    window_seconds     INTEGER NOT NULL,
    cooldown_seconds   INTEGER NOT NULL DEFAULT 600,
    target_severity    TEXT NOT NULL DEFAULT 'error',
    last_fired_at      TEXT,
    enabled            INTEGER NOT NULL DEFAULT 1,
    created_at         TEXT NOT NULL
);
