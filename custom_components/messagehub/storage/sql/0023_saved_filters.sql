-- Iter 92 / K1: Saved Filters serverseitig.
-- Filter-Presets werden nicht mehr nur im LocalStorage des Browsers
-- persistiert, sondern serverseitig pro Bezeichner. So koennen User
-- Filter teilen und vom selben Account auf mehreren Geraeten nutzen.

CREATE TABLE IF NOT EXISTS saved_filters (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    scope       TEXT NOT NULL,        -- "messages" | "knx-stats" | "audit"
    filters     TEXT NOT NULL,        -- JSON-encoded filter dict
    created_at  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_filters_scope_name
    ON saved_filters (scope, name);
