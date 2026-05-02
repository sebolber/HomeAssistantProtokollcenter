-- Iter 4 (knx-stats): Acknowledge-Liste fuer "bekannte" ueberaktive GAs
-- + partieller Index fuer schnelle GROUP BY auf knx-bus-Telegrammen.

CREATE TABLE IF NOT EXISTS knx_ga_acknowledgements (
    ga              TEXT    PRIMARY KEY,
    note            TEXT,
    acknowledged_at TEXT    NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    expires_at      TEXT
);

-- Phase 2 vorbereitet (siehe Konzept §10.1 / §17): Schatten-Counter
-- pro GA + Stunden-Bucket. Pflege-Pfad ist optional und wird in
-- Iter 17 verdrahtet — Schema legen wir jetzt mit, damit spaetere
-- Aktivierung ohne Migration moeglich ist.
CREATE TABLE IF NOT EXISTS knx_telegram_counters (
    ga          TEXT    NOT NULL,
    hour_bucket TEXT    NOT NULL,  -- ISO 8601 hour, e.g. 2026-05-02T16:00:00
    count       INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (ga, hour_bucket)
);

CREATE INDEX IF NOT EXISTS idx_knx_counters_bucket
    ON knx_telegram_counters (hour_bucket);

-- Partieller Index: nur knx-bus-Messages haben metadata.knx_ga.
-- Das spart Indexgroesse drastisch (typisch 1-5 % der messages-Tabelle
-- sind knx-bus). SQLite ab 3.30 erlaubt JSON-Funktionen in Index-
-- Expressions — wenn nicht verfuegbar, ist der Index halt nicht da
-- und Queries nehmen den (timestamp DESC)-Index.
CREATE INDEX IF NOT EXISTS idx_messages_knx_bus_timestamp
    ON messages (timestamp DESC) WHERE source = 'knx-bus';
