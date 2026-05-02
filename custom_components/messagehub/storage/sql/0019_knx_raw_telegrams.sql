-- Iter 20: Bus-weite Telegramm-Erfassung (auch ohne Whitelist).
--
-- knx_raw_telegrams: jedes vom Bus gesehene Telegramm fuer N Stunden,
-- damit die KNX-Stats-Auswertung auf der vollen Bus-Aktivitaet basiert
-- (nicht nur whitelisted GAs in der messages-Tabelle).
--
-- Retention: Default 48 h, ueber Cleanup-Job (Iter 24).
-- Hard-Cap: 5 Mio Zeilen (DoS-Schutz, aelteste werden zuerst geloescht).
CREATE TABLE IF NOT EXISTS knx_raw_telegrams (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp    TEXT    NOT NULL,
    destination  TEXT    NOT NULL,
    source       TEXT    NOT NULL DEFAULT '',
    telegramtype TEXT,
    value        TEXT,
    repeated     INTEGER NOT NULL DEFAULT 0
);

-- Hauptzugriff: nach Zeitraum filtern, dann gruppieren
CREATE INDEX IF NOT EXISTS idx_knx_raw_timestamp
    ON knx_raw_telegrams (timestamp DESC);

-- Top-by-ga + ga_samples
CREATE INDEX IF NOT EXISTS idx_knx_raw_destination_ts
    ON knx_raw_telegrams (destination, timestamp DESC);

-- Silence-Detect, top_by_source
CREATE INDEX IF NOT EXISTS idx_knx_raw_source_ts
    ON knx_raw_telegrams (source, timestamp DESC);
