-- Snapshot-Fixture fuer STALE_GA (Iter 25 + 29b-Wiring).
--
-- Szenario: Whitelist-GA "9/0/1" mit letztem Telegramm vor > 30 Tagen
-- (vor dem 2026-05-03-Stichtag).

INSERT INTO knx_group_addresses (address, label, dpt, created_at, updated_at)
VALUES ('9/0/1', 'Frueher mal aktiv', '1.001',
        '2026-01-01T00:00:00+00:00', '2026-01-01T00:00:00+00:00');

INSERT INTO knx_raw_telegrams (timestamp, destination, source, telegramtype, value, repeated)
VALUES
('2026-03-01T08:00:00+00:00', '9/0/1', '1.1.70', 'GroupValueWrite', '0', 0);
