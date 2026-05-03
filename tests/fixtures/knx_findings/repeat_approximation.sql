-- Snapshot-Fixture fuer REPEAT_APPROXIMATION (Iter 22 + 29a-Wiring).
--
-- Szenario: GA "1/2/9" mit identischen Telegrammen Δt < 100 ms — wir
-- approximieren das Repeat-Bit. Schwelle: >= 5 Wiederholungen pro Tag.
-- Mit 6 Doppel-Paaren (jeweils 50 ms Abstand) im 24-h-Period kommt das
-- auf >5/Tag.

INSERT INTO knx_group_addresses (address, label, dpt, created_at, updated_at)
VALUES ('1/2/9', 'Sensor mit Spuren-Repeat', '1.001',
        '2026-05-01T00:00:00+00:00', '2026-05-01T00:00:00+00:00');

INSERT INTO knx_raw_telegrams (timestamp, destination, source, telegramtype, value, repeated)
VALUES
('2026-05-03T08:00:00+00:00',     '1/2/9', '1.1.80', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:00.050+00:00', '1/2/9', '1.1.80', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:01+00:00',     '1/2/9', '1.1.80', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:01.050+00:00', '1/2/9', '1.1.80', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:02+00:00',     '1/2/9', '1.1.80', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:02.050+00:00', '1/2/9', '1.1.80', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:03+00:00',     '1/2/9', '1.1.80', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:03.050+00:00', '1/2/9', '1.1.80', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:04+00:00',     '1/2/9', '1.1.80', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:04.050+00:00', '1/2/9', '1.1.80', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:05+00:00',     '1/2/9', '1.1.80', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:05.050+00:00', '1/2/9', '1.1.80', 'GroupValueWrite', '1', 0);
