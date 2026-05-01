-- Iter 43: Runbook-Verknuepfung.

CREATE TABLE IF NOT EXISTS runbooks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    source_pattern  TEXT NOT NULL,
    fingerprint     TEXT,
    title           TEXT NOT NULL,
    markdown        TEXT NOT NULL,
    created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_runbooks_source ON runbooks (source_pattern);
