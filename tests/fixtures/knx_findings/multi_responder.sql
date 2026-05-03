-- Snapshot-Fixture fuer MULTI_RESPONDER (Iter 15 + 29a-Wiring).
--
-- Szenario: GA "1/2/5" hat zwei `GroupValueResponse` von verschiedenen
-- Sources binnen 1 s — ein klassischer Doppel-Aktor-Fall.

INSERT INTO knx_group_addresses (address, label, dpt, created_at, updated_at)
VALUES ('1/2/5', 'Status Tor', '1.001',
        '2026-05-01T00:00:00+00:00', '2026-05-01T00:00:00+00:00');

INSERT INTO knx_raw_telegrams (timestamp, destination, source, telegramtype, value, repeated)
VALUES
('2026-05-03T08:00:00.100+00:00', '1/2/5', '1.1.30', 'GroupValueResponse', '1', 0),
('2026-05-03T08:00:00.500+00:00', '1/2/5', '1.1.40', 'GroupValueResponse', '1', 0);
