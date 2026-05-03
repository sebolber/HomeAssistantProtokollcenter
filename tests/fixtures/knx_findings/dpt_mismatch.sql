-- Snapshot-Fixture fuer DPT_MISMATCH (Iter 12 + 29a-Wiring).
--
-- Szenario: GA "1/2/3" hat Soll-DPT "9.001" (Temperatur), die Werte
-- sind aber 0/1 — Auto-Erkenner liefert "1.001" mit Confidence >= 0.85.
-- Erwarteter Finding: DPT_MISMATCH (severity=error, schema_version=1).

INSERT INTO knx_group_addresses (address, label, dpt, created_at, updated_at)
VALUES ('1/2/3', 'Temperatur Bad', '9.001',
        '2026-05-01T00:00:00+00:00', '2026-05-01T00:00:00+00:00');

-- 30 Telegramme mit alternierenden 0/1-Werten — genug Samples fuer
-- die mid-Confidence-Schwelle (0.85) im Runner.
INSERT INTO knx_raw_telegrams (timestamp, destination, source, telegramtype, value, repeated)
VALUES
('2026-05-03T08:00:00+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:01+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:02+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:03+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:04+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:05+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:06+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:07+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:08+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:09+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:10+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:11+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:12+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:13+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:14+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:15+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:16+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:17+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:18+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:19+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:20+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:21+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:22+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:23+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:24+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:25+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:26+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:27+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:28+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:29+00:00', '1/2/3', '1.1.10', 'GroupValueWrite', '1', 0);
