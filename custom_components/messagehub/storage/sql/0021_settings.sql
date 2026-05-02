-- Iter 48 (N1): Persistente Integration-Settings als Key/Value.
--
-- Hier landen User-Toggles, die nicht den Aufwand eines Config-Flow-
-- Reloads rechtfertigen — etwa der Bus-Analyse-Schalter, der nur den
-- Listener-Guard im hass.data steuert. Migration ist additiv: kein
-- Default-Eintrag, fehlende Keys = hartcodierter Default in const.py.
CREATE TABLE IF NOT EXISTS messagehub_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
