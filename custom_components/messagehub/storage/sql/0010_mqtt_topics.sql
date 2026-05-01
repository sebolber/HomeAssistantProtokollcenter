-- Iter 37: MQTT-Topic-zu-Source-Mapping.

CREATE TABLE IF NOT EXISTS mqtt_topics (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_pattern TEXT NOT NULL UNIQUE,
    source        TEXT NOT NULL,
    severity      TEXT NOT NULL DEFAULT 'info',
    enabled       INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL
);
