-- Snapshot-Fixture fuer VALUE_OUT_OF_RANGE (Iter 13 + 29a-Wiring).
--
-- Szenario: GA "1/2/4" hat Soll-DPT "5.001" (Prozent 0..100), schreibt
-- aber 200 (out-of-range). Erwarteter Finding: VALUE_OUT_OF_RANGE.

INSERT INTO knx_group_addresses (address, label, dpt, created_at, updated_at)
VALUES ('1/2/4', 'Dimmwert Wohnzimmer', '5.001',
        '2026-05-01T00:00:00+00:00', '2026-05-01T00:00:00+00:00');

INSERT INTO knx_raw_telegrams (timestamp, destination, source, telegramtype, value, repeated)
VALUES
('2026-05-03T08:00:00+00:00', '1/2/4', '1.1.20', 'GroupValueWrite', '200', 0);
