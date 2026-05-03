-- Snapshot-Fixture fuer SEND_TO_NOWHERE (Iter 31).
--
-- Szenario: Write um 08:00:00 ohne nachfolgende Status-Aenderung
-- innerhalb der 5-s-Schwelle. Stichtag 08:30:00 — Fenster laengst
-- abgelaufen.

INSERT INTO knx_group_addresses (address, label, dpt, created_at, updated_at)
VALUES ('14/0/0', 'Schalter ohne Status', '1.001',
        '2026-05-01T00:00:00+00:00', '2026-05-01T00:00:00+00:00');

INSERT INTO knx_raw_telegrams (timestamp, destination, source, telegramtype, value, repeated)
VALUES
('2026-05-03T08:00:00+00:00', '14/0/0', '1.1.110', 'GroupValueWrite', '1', 0);
