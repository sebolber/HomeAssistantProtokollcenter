-- Iter 47: Auto-Remediation Hooks.

CREATE TABLE IF NOT EXISTS remediation_hooks (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    name               TEXT NOT NULL,
    source_pattern     TEXT NOT NULL,
    fingerprint        TEXT,
    automation_id      TEXT NOT NULL,        -- HA-automation oder script entity_id
    confirm_required   INTEGER NOT NULL DEFAULT 1,
    enabled            INTEGER NOT NULL DEFAULT 1,
    created_at         TEXT NOT NULL
);
