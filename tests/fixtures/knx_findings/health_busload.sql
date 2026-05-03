-- Snapshot-Fixture fuer HEALTH_BUSLOAD (Iter 5 Health-Lift + 29b-Wiring).
--
-- Szenario: 1500 Telegramme in einer Sekunden-Achse — sehr viele
-- Telegramme pro 10-s-Bucket -> Buslast > 20% (HEALTH_BUSLOAD-Schwelle).
-- Wir nutzen GA "10/0/0" als Lokal-Spam.

INSERT INTO knx_group_addresses (address, label, dpt, created_at, updated_at)
VALUES ('10/0/0', 'Spam-GA', '1.001',
        '2026-05-01T00:00:00+00:00', '2026-05-01T00:00:00+00:00');

-- 1500 Telegramme im 10-s-Bucket bei 08:00:00.
-- Buslast = 1500 * 200 Bit / (10 s * 9600 bps) * 100 = ~3125% (geclampt
-- aber jedenfalls ueber 20%-Schwelle der HEALTH_BUSLOAD-Lift).
WITH RECURSIVE seq(n) AS (
    SELECT 0 UNION ALL SELECT n + 1 FROM seq WHERE n < 1499
)
INSERT INTO knx_raw_telegrams (timestamp, destination, source, telegramtype, value, repeated)
SELECT
    '2026-05-03T08:00:0' || (n % 10) || '+00:00',
    '10/0/0',
    '1.1.90',
    'GroupValueWrite',
    '1',
    0
FROM seq;
