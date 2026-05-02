"""Repository fuer KNX-Statistik (Iter 4).

Aggregat-Queries auf der `messages`-Tabelle, gefiltert auf
`source='knx-bus'`. Zugriff auf `metadata.knx_ga`, `metadata.knx_dpt`,
`metadata.knx_source`, `metadata.knx_telegramtype` via SQLite
`json_extract`.

Acknowledgement-Verwaltung: GAs als "bekannt" markieren; mit
optionalem Ablauf (DEFAULT_KNX_ACK_EXPIRY_DAYS) — sonst sticky.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from .database import Database


_TOP_SQL = """
SELECT
    json_extract(metadata, '$.knx_ga')          AS ga,
    json_extract(metadata, '$.knx_dpt')         AS dpt,
    json_extract(metadata, '$.knx_label')       AS label,
    json_extract(metadata, '$.knx_source')      AS dev_source,
    COUNT(*)                                    AS n,
    MIN(timestamp)                              AS first_seen,
    MAX(timestamp)                              AS last_seen
FROM messages
WHERE source = 'knx-bus'
  AND timestamp >= ?
  AND timestamp <  ?
GROUP BY ga, dpt, label
ORDER BY n DESC
LIMIT ?
"""

_TOP_BY_SOURCE_SQL = """
SELECT
    json_extract(metadata, '$.knx_source') AS dev_source,
    COUNT(*)                                AS n,
    COUNT(DISTINCT json_extract(metadata, '$.knx_ga')) AS ga_count
FROM messages
WHERE source = 'knx-bus'
  AND timestamp >= ?
  AND timestamp <  ?
GROUP BY dev_source
ORDER BY n DESC
LIMIT ?
"""

_SUMMARY_SQL = """
SELECT
    COUNT(*) AS total_telegrams,
    COUNT(DISTINCT json_extract(metadata, '$.knx_ga'))     AS active_gas,
    COUNT(DISTINCT json_extract(metadata, '$.knx_source')) AS active_devices
FROM messages
WHERE source = 'knx-bus'
  AND timestamp >= ?
  AND timestamp <  ?
"""

# Telegramme einer GA als reiner Sample-Stream (fuer detect_patterns).
_GA_DETAIL_SAMPLES_SQL = """
SELECT
    timestamp                                       AS ts,
    json_extract(metadata, '$.knx_value')          AS value,
    json_extract(metadata, '$.knx_telegramtype')   AS telegramtype,
    json_extract(metadata, '$.knx_source')         AS dev_source
FROM messages
WHERE source = 'knx-bus'
  AND json_extract(metadata, '$.knx_ga') = ?
  AND timestamp >= ?
  AND timestamp <  ?
ORDER BY timestamp ASC
"""

# Time-Bucket-Aggregation. Bucket = ISO-String mit auf bucket_minutes
# abgerundeter Minute. Beispiel: bucket_minutes=10 -> Minuten 0,10,20,30,40,50.
# Eine einzige bucket_minutes-Bindung im SELECT (Modulo subtrahiert
# ueberzaehlige Minuten).
_TIMELINE_SQL = """
SELECT
    json_extract(metadata, '$.knx_ga') AS ga,
    strftime('%Y-%m-%dT%H:', timestamp) ||
    printf(
        '%02d:00',
        CAST(strftime('%M', timestamp) AS INTEGER) -
        (CAST(strftime('%M', timestamp) AS INTEGER) % ?)
    ) AS bucket,
    COUNT(*) AS n
FROM messages
WHERE source = 'knx-bus'
  AND timestamp >= ?
  AND timestamp <  ?
  AND json_extract(metadata, '$.knx_ga') IN ({placeholders})
GROUP BY ga, bucket
ORDER BY bucket ASC, ga ASC
"""


class KnxStatsRepository:
    """SQL-Aggregate fuer den KNX-Stats-Tab.

    Alle Queries verwenden gebundene Parameter — kein String-Interp.
    Das `IN ({placeholders})` in `_TIMELINE_SQL` wird bei jedem Aufruf
    aus `len(gas)` zusammengesetzt; die GA-Strings selbst gehen als
    `?`-Parameter rein.
    """

    def __init__(self, database: Database) -> None:
        self._db = database

    # --- Aggregate ----------------------------------------------------------

    async def summary(self, from_iso: str, to_iso: str) -> dict[str, int]:
        row = await self._db.fetch_one(_SUMMARY_SQL, (from_iso, to_iso))
        if row is None:
            return {"total_telegrams": 0, "active_gas": 0, "active_devices": 0}
        return {
            "total_telegrams": int(row["total_telegrams"] or 0),
            "active_gas": int(row["active_gas"] or 0),
            "active_devices": int(row["active_devices"] or 0),
        }

    async def top_by_ga(
        self, from_iso: str, to_iso: str, *, limit: int = 50
    ) -> list[dict[str, Any]]:
        rows = await self._db.fetch_all(
            _TOP_SQL, (from_iso, to_iso, max(1, min(limit, 500)))
        )
        return [self._row_to_top_dict(row) for row in rows]

    async def top_by_source(
        self, from_iso: str, to_iso: str, *, limit: int = 50
    ) -> list[dict[str, Any]]:
        rows = await self._db.fetch_all(
            _TOP_BY_SOURCE_SQL, (from_iso, to_iso, max(1, min(limit, 500)))
        )
        return [
            {
                "dev_source": str(row["dev_source"] or ""),
                "count": int(row["n"]),
                "ga_count": int(row["ga_count"] or 0),
            }
            for row in rows
        ]

    async def ga_samples(
        self, ga: str, from_iso: str, to_iso: str
    ) -> list[dict[str, Any]]:
        rows = await self._db.fetch_all(
            _GA_DETAIL_SAMPLES_SQL, (ga, from_iso, to_iso)
        )
        return [
            {
                "ts": str(row["ts"]),
                "value": row["value"],
                "telegramtype": row["telegramtype"],
                "dev_source": str(row["dev_source"] or ""),
            }
            for row in rows
        ]

    async def timeline(
        self,
        from_iso: str,
        to_iso: str,
        *,
        gas: list[str],
        bucket_minutes: int = 10,
    ) -> list[dict[str, Any]]:
        if not gas:
            return []
        bucket_minutes = max(1, min(bucket_minutes, 60))
        placeholders = ",".join("?" * len(gas))
        sql = _TIMELINE_SQL.format(placeholders=placeholders)
        params: list[Any] = [bucket_minutes, from_iso, to_iso, *gas]
        rows = await self._db.fetch_all(sql, params)
        return [
            {
                "ga": str(row["ga"]),
                "bucket": str(row["bucket"]),
                "count": int(row["n"]),
            }
            for row in rows
        ]

    # --- Acknowledgements ---------------------------------------------------

    async def ack_set(
        self,
        ga: str,
        *,
        note: str | None = None,
        expiry_days: int | None = None,
    ) -> None:
        """Markiert eine GA als bekannt. expiry_days=0/None = sticky."""
        now = datetime.now(UTC)
        expires: str | None = None
        if expiry_days and expiry_days > 0:
            expires = (now + timedelta(days=expiry_days)).isoformat(timespec="seconds")
        await self._db.execute(
            """
            INSERT INTO knx_ga_acknowledgements (ga, note, acknowledged_at, expires_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(ga) DO UPDATE SET
                note            = excluded.note,
                acknowledged_at = excluded.acknowledged_at,
                expires_at      = excluded.expires_at
            """,
            (ga, note, now.isoformat(timespec="seconds"), expires),
        )

    async def ack_clear(self, ga: str) -> bool:
        cursor = await self._db.connection.execute(
            "DELETE FROM knx_ga_acknowledgements WHERE ga = ?", (ga,)
        )
        await self._db.connection.commit()
        deleted = cursor.rowcount > 0
        await cursor.close()
        return bool(deleted)

    async def ack_active_set(self) -> set[str]:
        """Liefert das Set aller GAs mit gueltigem Acknowledge.

        Abgelaufene Eintraege werden ignoriert, aber nicht geloescht
        (Cleanup-Job spaeter optional).
        """
        now = datetime.now(UTC).isoformat(timespec="seconds")
        rows = await self._db.fetch_all(
            "SELECT ga FROM knx_ga_acknowledgements "
            "WHERE expires_at IS NULL OR expires_at >= ?",
            (now,),
        )
        return {str(row["ga"]) for row in rows}

    async def ack_get(self, ga: str) -> dict[str, Any] | None:
        row = await self._db.fetch_one(
            "SELECT ga, note, acknowledged_at, expires_at "
            "FROM knx_ga_acknowledgements WHERE ga = ?",
            (ga,),
        )
        if row is None:
            return None
        return {
            "ga": str(row["ga"]),
            "note": row["note"],
            "acknowledged_at": str(row["acknowledged_at"]),
            "expires_at": row["expires_at"],
        }

    # --- Helpers ------------------------------------------------------------

    @staticmethod
    def _row_to_top_dict(row: Any) -> dict[str, Any]:
        return {
            "ga": str(row["ga"] or ""),
            "dpt": row["dpt"],
            "label": row["label"],
            "dev_source": str(row["dev_source"] or ""),
            "count": int(row["n"]),
            "first_seen": str(row["first_seen"]),
            "last_seen": str(row["last_seen"]),
        }
