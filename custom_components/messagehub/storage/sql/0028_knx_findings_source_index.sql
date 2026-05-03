-- Iter Idx (Sprint B / Phase 8): Index auf knx_findings.source.
--
-- Source-Detail-Pane (Iter H) ruft `list_findings(source=dev_source)`
-- mit einem Per-Source-Filter auf. Die bestehenden Indizes
-- (`last_seen_desc`, `(severity, last_seen)`, `(ga, last_seen)`)
-- helfen dabei nicht — bei grossen Anlagen mit > 100k Findings ist
-- der Source-Filter ein Full-Table-Scan.
--
-- Speicher-Overhead: ~1-2 % der knx_findings-Tabelle. Vernachlaessigbar.
-- IF NOT EXISTS macht die Migration idempotent.

CREATE INDEX IF NOT EXISTS idx_knx_findings_source
    ON knx_findings (source);
