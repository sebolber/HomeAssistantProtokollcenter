-- Iter 48 (UI-Variante, erweitert): KNX-Logging-Konfiguration pro GA.
ALTER TABLE knx_group_addresses ADD COLUMN log_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE knx_group_addresses ADD COLUMN log_severity TEXT NOT NULL DEFAULT 'info'
    CHECK (log_severity IN ('debug', 'info', 'warning', 'error', 'auto'));
ALTER TABLE knx_group_addresses ADD COLUMN severity_on_true TEXT
    CHECK (severity_on_true IS NULL OR severity_on_true IN ('debug', 'info', 'warning', 'error'));
ALTER TABLE knx_group_addresses ADD COLUMN severity_on_false TEXT
    CHECK (severity_on_false IS NULL OR severity_on_false IN ('debug', 'info', 'warning', 'error'));

CREATE INDEX IF NOT EXISTS idx_knx_log_enabled
    ON knx_group_addresses (log_enabled) WHERE log_enabled = 1;
