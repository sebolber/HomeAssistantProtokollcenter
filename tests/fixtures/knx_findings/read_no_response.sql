-- Snapshot-Fixture fuer READ_NO_RESPONSE (Iter 16 + 29a-Wiring).
--
-- Szenario: GA "1/2/6" mit GroupValueRead, dem im Fenster kein
-- GroupValueResponse folgt. Schwelle = 3 s, also Read bei 08:00:00,
-- now bei 08:01:00 — Fenster laengst abgelaufen.

INSERT INTO knx_group_addresses (address, label, dpt, created_at, updated_at)
VALUES ('1/2/6', 'Sensor offline?', '1.001',
        '2026-05-01T00:00:00+00:00', '2026-05-01T00:00:00+00:00');

INSERT INTO knx_raw_telegrams (timestamp, destination, source, telegramtype, value, repeated)
VALUES
('2026-05-03T08:00:00+00:00', '1/2/6', '1.1.50', 'GroupValueRead', 'null', 0);
