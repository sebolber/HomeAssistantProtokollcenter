-- Iter 11 (knx-findings): DPT-Inferenz-Felder auf knx_group_addresses.
-- Vertrag aus docs/messagehub_knx_konfigurationsfehler_recherche.md §9.2.
--
-- `dpt` bleibt das Soll (User-/ETS-gepflegt). Die drei neuen Felder
-- speichern das Ist aus dem Auto-Erkenner (`infer_dpt_from_samples`):
-- - dpt_inferred: erkannter DPT (z. B. "1.001")
-- - dpt_inferred_confidence: 0.0-1.0
-- - dpt_inferred_at: Zeitpunkt der letzten Inferenz (ISO 8601)
--
-- DPT_MISMATCH-Detector (Iter 12) vergleicht beide Felder.

ALTER TABLE knx_group_addresses ADD COLUMN dpt_inferred TEXT;
ALTER TABLE knx_group_addresses ADD COLUMN dpt_inferred_confidence REAL;
ALTER TABLE knx_group_addresses ADD COLUMN dpt_inferred_at TEXT;
