-- Snapshot-Fixture fuer TOGGLE_LOOP (Iter 17 + 29a-Wiring).
--
-- Szenario: GA "1/2/7" DPT 1.001, Werte 0/1/0/1/0/1 in 0.5 s Abstand —
-- mindestens 4 Zyklen, Periode < 2 s -> TOGGLE_LOOP.

INSERT INTO knx_group_addresses (address, label, dpt, created_at, updated_at)
VALUES ('1/2/7', 'Schalt-Schleife', '1.001',
        '2026-05-01T00:00:00+00:00', '2026-05-01T00:00:00+00:00');

INSERT INTO knx_raw_telegrams (timestamp, destination, source, telegramtype, value, repeated)
VALUES
('2026-05-03T08:00:00+00:00', '1/2/7', '1.1.60', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:00.500+00:00', '1/2/7', '1.1.60', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:01+00:00', '1/2/7', '1.1.60', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:01.500+00:00', '1/2/7', '1.1.60', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:02+00:00', '1/2/7', '1.1.60', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:02.500+00:00', '1/2/7', '1.1.60', 'GroupValueWrite', '1', 0),
('2026-05-03T08:00:03+00:00', '1/2/7', '1.1.60', 'GroupValueWrite', '0', 0),
('2026-05-03T08:00:03.500+00:00', '1/2/7', '1.1.60', 'GroupValueWrite', '1', 0);
