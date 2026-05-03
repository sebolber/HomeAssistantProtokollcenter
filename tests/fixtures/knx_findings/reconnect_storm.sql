-- Snapshot-Fixture fuer RECONNECT_STORM (Iter 20 + 29b-Wiring).
--
-- Szenario: Source 1.1.100 sendet seit 1 h alle 5 Min ein Telegramm
-- (sehr niedriger Baseline-Avg pro 30 s), dann eine Stille >= 60 s,
-- dann ein Burst von 50 Telegrammen in 30 s. Damit ist
-- burst_count (50) >> 10 * normal_avg (~0.05/30 s) -> Finding.

INSERT INTO knx_group_addresses (address, label, dpt, created_at, updated_at)
VALUES ('11/0/0', 'Reconnect-Burst', '1.001',
        '2026-05-01T00:00:00+00:00', '2026-05-01T00:00:00+00:00');

-- Pre-burst Baseline: 12 Telegramme verteilt ueber 60 Min.
INSERT INTO knx_raw_telegrams (timestamp, destination, source, telegramtype, value, repeated)
VALUES
('2026-05-03T07:00:00+00:00', '11/0/0', '1.1.100', 'GroupValueWrite', '0', 0),
('2026-05-03T07:05:00+00:00', '11/0/0', '1.1.100', 'GroupValueWrite', '0', 0),
('2026-05-03T07:10:00+00:00', '11/0/0', '1.1.100', 'GroupValueWrite', '0', 0),
('2026-05-03T07:15:00+00:00', '11/0/0', '1.1.100', 'GroupValueWrite', '0', 0),
('2026-05-03T07:20:00+00:00', '11/0/0', '1.1.100', 'GroupValueWrite', '0', 0),
('2026-05-03T07:25:00+00:00', '11/0/0', '1.1.100', 'GroupValueWrite', '0', 0),
('2026-05-03T07:30:00+00:00', '11/0/0', '1.1.100', 'GroupValueWrite', '0', 0),
('2026-05-03T07:35:00+00:00', '11/0/0', '1.1.100', 'GroupValueWrite', '0', 0),
('2026-05-03T07:40:00+00:00', '11/0/0', '1.1.100', 'GroupValueWrite', '0', 0),
('2026-05-03T07:45:00+00:00', '11/0/0', '1.1.100', 'GroupValueWrite', '0', 0),
('2026-05-03T07:50:00+00:00', '11/0/0', '1.1.100', 'GroupValueWrite', '0', 0),
('2026-05-03T07:55:00+00:00', '11/0/0', '1.1.100', 'GroupValueWrite', '0', 0);

-- Stille bis 08:00:00 (>=60 s nach 07:55:00 — passt mit 5-Min-Gap).

-- Burst: 50 Telegramme in 30 s nach der Stille.
WITH RECURSIVE seq(n) AS (
    SELECT 0 UNION ALL SELECT n + 1 FROM seq WHERE n < 49
)
INSERT INTO knx_raw_telegrams (timestamp, destination, source, telegramtype, value, repeated)
SELECT
    strftime(
        '%Y-%m-%dT%H:%M:%S+00:00',
        datetime('2026-05-03T08:00:00+00:00', '+' || (n * 0.6) || ' seconds')
    ),
    '11/0/0',
    '1.1.100',
    'GroupValueWrite',
    '1',
    0
FROM seq;
