-- Iter B1: Dedup-Index erfasst auch ``source`` als Identitaets-Feld.
--
-- Vorher war der UNIQUE-Index nur (code, COALESCE(ga, ''),
-- evidence_hash, schema_version). Source-bezogene Findings (z. B.
-- RECONNECT_STORM mit ga=NULL und unterschiedlichen IAs) kollidierten
-- damit, weil source nicht in den Schluessel einging.
--
-- Plan:
-- 1. Neuen Index ``uniq_knx_findings_dedup_v2`` mit COALESCE(source, '')
--    anlegen.
-- 2. Alten Index ``uniq_knx_findings_dedup`` droppen.
--
-- Risiko: Vorhandene Duplikate verhindern den UNIQUE-Aufbau. Wir
-- packen ein DELETE-Stride davor, das aelteste Duplikate verwirft —
-- damit der Index sauber aufgebaut werden kann. Erstinstallationen
-- haben keine Duplikate; Bestandsinstallationen mit kontinuierlichen
-- Detektor-Findings koennen Duplikate gehabt haben (Konzept-Schwaeche
-- B1) und werden dabei aufgeraeumt.

DELETE FROM knx_findings
 WHERE id NOT IN (
    SELECT MAX(id)
      FROM knx_findings
     GROUP BY code, COALESCE(ga, ''), COALESCE(source, ''),
              evidence_hash, schema_version
 );

DROP INDEX IF EXISTS uniq_knx_findings_dedup;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_knx_findings_dedup_v2
    ON knx_findings (
        code,
        COALESCE(ga, ''),
        COALESCE(source, ''),
        evidence_hash,
        schema_version
    );
