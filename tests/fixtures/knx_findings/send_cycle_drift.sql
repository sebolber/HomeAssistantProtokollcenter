-- Snapshot-Fixture fuer SEND_CYCLE_DRIFT (Iter 21 + 29b-Wiring).
--
-- Szenario: GA "12/0/0" hatte ueber 7 Tage Median(Δt) ~ 600 s (10 min),
-- in den letzten 24 h liegt der Median bei ~120 s (2 min) -> Halbierung
-- ueber 50%-Schwelle -> SEND_CYCLE_DRIFT.

INSERT INTO knx_group_addresses (address, label, dpt, created_at, updated_at)
VALUES ('12/0/0', 'Wetterstation Drift', '9.001',
        '2026-04-01T00:00:00+00:00', '2026-04-01T00:00:00+00:00');

-- Baseline (Tag -2 bis -8): alle 600 s ein Telegramm.
INSERT INTO knx_raw_telegrams (timestamp, destination, source, telegramtype, value, repeated)
VALUES
('2026-04-26T08:00:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.5', 0),
('2026-04-26T08:10:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.6', 0),
('2026-04-26T08:20:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.7', 0),
('2026-04-26T08:30:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.6', 0),
('2026-04-26T08:40:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.5', 0),
('2026-04-26T08:50:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.4', 0),
('2026-04-26T09:00:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.5', 0),
('2026-04-26T09:10:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.6', 0),
('2026-04-26T09:20:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.7', 0),
('2026-04-26T09:30:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.8', 0);

-- Recent (Tag 0): alle 120 s ein Telegramm — Halbierung gegenueber Baseline.
INSERT INTO knx_raw_telegrams (timestamp, destination, source, telegramtype, value, repeated)
VALUES
('2026-05-03T07:00:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.0', 0),
('2026-05-03T07:02:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.1', 0),
('2026-05-03T07:04:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.2', 0),
('2026-05-03T07:06:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.3', 0),
('2026-05-03T07:08:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.4', 0),
('2026-05-03T07:10:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.5', 0),
('2026-05-03T07:12:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.6', 0),
('2026-05-03T07:14:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.7', 0),
('2026-05-03T07:16:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.8', 0),
('2026-05-03T07:18:00+00:00', '12/0/0', '1.1.110', 'GroupValueWrite', '21.9', 0);
