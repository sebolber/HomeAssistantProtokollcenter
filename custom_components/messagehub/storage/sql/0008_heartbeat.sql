-- Iter 35: Heartbeat-Tracking.

CREATE TABLE IF NOT EXISTS heartbeat_sources (
    source                    TEXT PRIMARY KEY,
    expected_interval_seconds INTEGER NOT NULL,
    last_seen                 TEXT,
    silent_alert_active       INTEGER NOT NULL DEFAULT 0,
    enabled                   INTEGER NOT NULL DEFAULT 1,
    created_at                TEXT NOT NULL
);
