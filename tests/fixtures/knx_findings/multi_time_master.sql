-- Snapshot-Fixture fuer MULTI_TIME_MASTER (Iter 18 + 29b-Wiring).
--
-- Szenario: Zeit-GA "8/0/0" mit DPT 10.001, schreibt von zwei
-- Sources -> doppelter Time-Master.

INSERT INTO knx_group_addresses (address, label, dpt, created_at, updated_at)
VALUES ('8/0/0', 'Time of day', '10.001',
        '2026-05-01T00:00:00+00:00', '2026-05-01T00:00:00+00:00');

INSERT INTO knx_raw_telegrams (timestamp, destination, source, telegramtype, value, repeated)
VALUES
('2026-05-03T08:00:00+00:00', '8/0/0', '1.1.10', 'GroupValueWrite', '"08:00:00"', 0),
('2026-05-03T08:01:00+00:00', '8/0/0', '1.1.20', 'GroupValueWrite', '"08:01:00"', 0);
