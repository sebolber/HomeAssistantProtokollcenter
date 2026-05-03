-- Iter 3 (knx-findings): Acknowledgements pro (GA, finding_code).
-- Vertrag aus docs/messagehub_knx_konfigurationsfehler_recherche.md §9.4.
--
-- Granularitaet bewusst pro Finding-Code, NICHT pro (GA, *) — sonst
-- wuerde "MULTI_RESPONDER auf 1/2/3 ist Absicht" auch DPT_MISMATCH auf
-- derselben GA stummschalten, was inhaltlich unterschiedliche Probleme
-- sind.
--
-- expires_at: NULL = sticky (nie automatisch ablaufen), sonst Auto-
-- Ablauf nach DEFAULT_KNX_ACK_EXPIRY_DAYS (90 Tage). UI bietet beides.

CREATE TABLE IF NOT EXISTS knx_finding_acknowledgements (
    ga              TEXT    NOT NULL,
    finding_code    TEXT    NOT NULL,
    acknowledged_at TEXT    NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    expires_at      TEXT,                       -- NULL = sticky
    note            TEXT,
    schema_version  INTEGER NOT NULL DEFAULT 1,  -- siehe §9.5
    PRIMARY KEY (ga, finding_code)
);

-- Partial-Index nur ueber endliche Acks; sticky-Eintraege brauchen ihn
-- nicht. Spart Indexgroesse, weil sticky der Default fuer "akzeptiere
-- dauerhaft" ist und langfristig den Anteil dominieren wird.
CREATE INDEX IF NOT EXISTS idx_knx_finding_acks_expires
    ON knx_finding_acknowledgements (expires_at)
    WHERE expires_at IS NOT NULL;
