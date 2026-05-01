-- Initial schema fuer messagehub.
-- Spec: docs/messagehub_konzept.md §2

CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp   TEXT    NOT NULL,
    severity    TEXT    NOT NULL CHECK (severity IN ('debug', 'info', 'warning', 'error')),
    source      TEXT    NOT NULL,
    text        TEXT    NOT NULL,
    metadata    TEXT,
    webhook_id  TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_timestamp_desc
    ON messages (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_messages_severity_timestamp
    ON messages (severity, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_messages_source_timestamp
    ON messages (source, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_messages_webhook_id
    ON messages (webhook_id);

CREATE TABLE IF NOT EXISTS webhook_configs (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    name              TEXT    NOT NULL UNIQUE,
    webhook_id        TEXT    NOT NULL UNIQUE,
    default_severity  TEXT    NOT NULL DEFAULT 'info'
                              CHECK (default_severity IN ('debug', 'info', 'warning', 'error')),
    default_source    TEXT    NOT NULL,
    field_map_json    TEXT,
    enabled           INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    created_at        TEXT    NOT NULL
);
