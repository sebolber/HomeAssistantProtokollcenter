-- Iter 30: Notification-Channels.

CREATE TABLE IF NOT EXISTS notification_channels (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    name              TEXT    NOT NULL UNIQUE,
    channel_type      TEXT    NOT NULL,        -- telegram, pushover, ntfy, signal
    enabled           INTEGER NOT NULL DEFAULT 1,
    severity_threshold TEXT   NOT NULL DEFAULT 'warning',
    quiet_start       TEXT,                    -- HH:MM
    quiet_end         TEXT,                    -- HH:MM
    quiet_bypass_error INTEGER NOT NULL DEFAULT 1,
    throttle_seconds  INTEGER NOT NULL DEFAULT 600,
    config_json       TEXT NOT NULL DEFAULT '{}',
    created_at        TEXT NOT NULL
);
