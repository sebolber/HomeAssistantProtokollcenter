-- Snapshot-Fixture fuer ORPHAN_GA (Iter 24 + 29b-Wiring).
--
-- Szenario: Whitelist-GA "9/0/0" ohne ein einziges Telegramm im
-- Zeitraum -> ORPHAN_GA.

INSERT INTO knx_group_addresses (address, label, dpt, created_at, updated_at)
VALUES ('9/0/0', 'Vergessener Schalter', '1.001',
        '2026-05-01T00:00:00+00:00', '2026-05-01T00:00:00+00:00');
