-- Iter 2 (knx-findings): Append-only-Log fuer KNX-Konfigurations-/Verhaltens-
-- Findings. Vertrag aus docs/messagehub_knx_konfigurationsfehler_recherche.md
-- §9.1 + §9.6.
--
-- Dedup: ein "logischer" Finding wird durch (ga, code, evidence_hash,
-- schema_version) identifiziert. Wiederholtes Erkennen mit identischer
-- Evidence aktualisiert last_seen + occurrence_count, statt einen neuen
-- Row anzulegen — sonst wuerde ein zyklisch laufender Detector eine
-- Tabelle in Stunden in die Hunderttausende treiben.
--
-- title/description sind bewusst NICHT persistiert: lesbare Strings
-- liefert die UI ueber translations/<lang>.json (siehe §9.7). Wir
-- speichern den maschinellen Vertrag (code + evidence) und das
-- Frontend rendert daraus den Text.

CREATE TABLE IF NOT EXISTS knx_findings (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    code             TEXT    NOT NULL,
    schema_version   INTEGER NOT NULL DEFAULT 1,
    severity         TEXT    NOT NULL
                             CHECK (severity IN ('debug', 'info', 'warning', 'error')),
    ga               TEXT,        -- NULL bei GA-uebergreifenden Findings
    source           TEXT,        -- NULL, wenn keine eindeutige Source
    evidence_json    TEXT    NOT NULL DEFAULT '{}',
    evidence_hash    TEXT    NOT NULL,
    first_seen       TEXT    NOT NULL,
    last_seen        TEXT    NOT NULL,
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    detector_version TEXT    NOT NULL DEFAULT '',
    created_at       TEXT    NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at       TEXT    NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- Dedup-Schluessel laut §9.1. ga ist nullable -> COALESCE auf '' fuer
-- den Index, sonst trifft NULL nicht den UNIQUE-Constraint und wir
-- kriegen Duplikate fuer GA-uebergreifende Findings.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_knx_findings_dedup
    ON knx_findings (
        code,
        COALESCE(ga, ''),
        evidence_hash,
        schema_version
    );

-- Listen-Performance: filtern nach severity + Sortierung nach
-- last_seen DESC sind die zwei haeufigsten UI-Pfade.
CREATE INDEX IF NOT EXISTS idx_knx_findings_last_seen_desc
    ON knx_findings (last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_knx_findings_severity_last_seen
    ON knx_findings (severity, last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_knx_findings_ga_last_seen
    ON knx_findings (ga, last_seen DESC) WHERE ga IS NOT NULL;
