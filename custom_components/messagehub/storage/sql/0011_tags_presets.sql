-- Iter 42: Tags + Saved Filter Presets.

CREATE TABLE IF NOT EXISTS message_tags (
    message_id INTEGER NOT NULL,
    tag        TEXT NOT NULL,
    PRIMARY KEY (message_id, tag),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_message_tags_tag ON message_tags (tag);

CREATE TABLE IF NOT EXISTS filter_presets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL,
    name        TEXT NOT NULL,
    config_json TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    UNIQUE (user_id, name)
);
