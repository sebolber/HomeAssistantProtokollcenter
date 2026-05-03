-- Iter 4 (knx-findings): Severity-Override pro Finding-Code.
-- Vertrag aus docs/messagehub_knx_konfigurationsfehler_recherche.md §9.3.
--
-- Die Default-Severity pro Code lebt in const.py
-- (KNX_FINDING_DEFAULT_SEVERITIES). Diese Tabelle erlaubt User-Overrides:
-- "fuer meine Anlage ist MULTI_RESPONDER eine Info, kein Warning". Genau
-- ein Row pro Code (Primary Key). Ohne Eintrag greift der Default aus
-- dem Code.

CREATE TABLE IF NOT EXISTS knx_finding_severity_overrides (
    finding_code TEXT    PRIMARY KEY,
    severity     TEXT    NOT NULL
                         CHECK (severity IN ('debug', 'info', 'warning', 'error')),
    note         TEXT,
    created_at   TEXT    NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at   TEXT    NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
