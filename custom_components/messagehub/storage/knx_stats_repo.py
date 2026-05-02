"""Repository fuer KNX-Statistik.

Iter 4: Erste Version, gelesen aus messages.metadata.knx_*.
Iter 22: umgestellt auf knx_raw_telegrams (bus-weite Erfassung,
unabhaengig von der log_enabled-Whitelist). DPT + Label kommen via
LEFT JOIN aus knx_group_addresses, falls die GA dort gepflegt ist.

Acknowledgement-Verwaltung: GAs als "bekannt" markieren; mit
optionalem Ablauf (DEFAULT_KNX_ACK_EXPIRY_DAYS) — sonst sticky.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Any

from ..const import KNX_AVG_TELEGRAM_BITS, KNX_TP_BAUDRATE_BPS

if TYPE_CHECKING:
    from .database import Database


# Top-Sender mit DPT+Label aus der Whitelist (LEFT JOIN — auch nicht
# whitelisted GAs landen in der Liste, dann mit dpt=NULL/label=NULL).
_TOP_SQL = """
SELECT
    r.destination AS ga,
    a.dpt         AS dpt,
    a.label       AS label,
    r.source      AS dev_source,
    COUNT(*)      AS n,
    MIN(r.timestamp) AS first_seen,
    MAX(r.timestamp) AS last_seen
FROM knx_raw_telegrams r
LEFT JOIN knx_group_addresses a ON a.address = r.destination
WHERE r.timestamp >= ?
  AND r.timestamp <  ?
GROUP BY r.destination, a.dpt, a.label
ORDER BY n DESC
LIMIT ?
"""

_TOP_BY_SOURCE_SQL = """
SELECT
    r.source AS dev_source,
    COUNT(*) AS n,
    COUNT(DISTINCT r.destination) AS ga_count
FROM knx_raw_telegrams r
WHERE r.timestamp >= ?
  AND r.timestamp <  ?
GROUP BY r.source
ORDER BY n DESC
LIMIT ?
"""

_SUMMARY_SQL = """
SELECT
    COUNT(*)                          AS total_telegrams,
    COUNT(DISTINCT destination)       AS active_gas,
    COUNT(DISTINCT source)            AS active_devices
FROM knx_raw_telegrams
WHERE timestamp >= ?
  AND timestamp <  ?
"""

# Telegramme einer GA als reiner Sample-Stream (fuer detect_patterns).
# value ist als JSON-String in der Tabelle — die Engine vergleicht
# ohnehin nur per repr(), also unkritisch.
_GA_DETAIL_SAMPLES_SQL = """
SELECT
    timestamp     AS ts,
    value         AS value,
    telegramtype  AS telegramtype,
    source        AS dev_source
FROM knx_raw_telegrams
WHERE destination = ?
  AND timestamp >= ?
  AND timestamp <  ?
ORDER BY timestamp ASC
"""

_BUS_HEALTH_SQL = """
SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN repeated = 1 THEN 1 ELSE 0 END) AS repeated_count
FROM knx_raw_telegrams
WHERE timestamp >= ?
  AND timestamp <  ?
"""

_SILENCE_DETECT_SQL = """
SELECT
    source         AS dev_source,
    MAX(timestamp) AS last_seen,
    COUNT(*)       AS total
FROM knx_raw_telegrams
WHERE timestamp >= ?
  AND timestamp <  ?
GROUP BY source
HAVING dev_source IS NOT NULL AND dev_source <> ''
ORDER BY last_seen ASC
"""

_BUS_HEALTH_PER_GA_SQL = """
SELECT
    r.destination AS ga,
    a.label       AS label,
    COUNT(*)      AS total,
    SUM(CASE WHEN r.repeated = 1 THEN 1 ELSE 0 END) AS repeated_count
FROM knx_raw_telegrams r
LEFT JOIN knx_group_addresses a ON a.address = r.destination
WHERE r.timestamp >= ?
  AND r.timestamp <  ?
GROUP BY r.destination, a.label
HAVING repeated_count > 0
ORDER BY repeated_count DESC, total DESC
LIMIT ?
"""

_TIMELINE_SQL = """
SELECT
    destination AS ga,
    strftime('%Y-%m-%dT%H:', timestamp) ||
    printf(
        '%02d:00',
        CAST(strftime('%M', timestamp) AS INTEGER) -
        (CAST(strftime('%M', timestamp) AS INTEGER) % ?)
    ) AS bucket,
    COUNT(*) AS n
FROM knx_raw_telegrams
WHERE timestamp >= ?
  AND timestamp <  ?
  AND destination IN ({placeholders})
GROUP BY ga, bucket
ORDER BY bucket ASC, ga ASC
"""

# Iter 36 (Feature A): Buslast in N-Sekunden-Buckets. Nutzt Unix-Sekunden-
# Arithmetik fuer beliebige Bucket-Groessen (10s wie ETS, oder 60s/300s).
_BUSLOAD_TIMESERIES_SQL = """
SELECT
    datetime((CAST(strftime('%s', timestamp) AS INTEGER) / ?) * ?, 'unixepoch')
        AS bucket,
    COUNT(*) AS telegrams
FROM knx_raw_telegrams
WHERE timestamp >= ?
  AND timestamp <  ?
GROUP BY bucket
ORDER BY bucket ASC
"""

# Iter 40 (Feature C): Burst-Detector — Buckets mit >= telegrams_threshold
# absteigend sortiert. Mit GA-/Source-Count fuer Diagnose im UI.
_BURSTS_SQL = """
SELECT
    datetime((CAST(strftime('%s', timestamp) AS INTEGER) / ?) * ?, 'unixepoch')
        AS bucket,
    COUNT(*) AS telegrams,
    COUNT(DISTINCT destination) AS ga_count,
    COUNT(DISTINCT source) AS source_count
FROM knx_raw_telegrams
WHERE timestamp >= ?
  AND timestamp <  ?
GROUP BY bucket
HAVING telegrams >= ?
ORDER BY telegrams DESC, bucket ASC
LIMIT ?
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
        rows = await self._db.fetch_all(_TOP_SQL, (from_iso, to_iso, max(1, min(limit, 500))))
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

    async def ga_samples(self, ga: str, from_iso: str, to_iso: str) -> list[dict[str, Any]]:
        import contextlib  # noqa: PLC0415
        import json as _json  # noqa: PLC0415

        rows = await self._db.fetch_all(_GA_DETAIL_SAMPLES_SQL, (ga, from_iso, to_iso))
        out: list[dict[str, Any]] = []
        for row in rows:
            raw_value: Any = row["value"]
            # value liegt als JSON-Repr in der Tabelle (insert_raw); wir
            # decoden zurueck zum Original-Typ, damit detect_patterns
            # konsistent vergleichen kann (Float-Toleranz, Integer-
            # Identitaet). Nicht-decodbare Werte bleiben Strings.
            if isinstance(raw_value, str):
                with contextlib.suppress(ValueError, TypeError):
                    raw_value = _json.loads(raw_value)
            out.append(
                {
                    "ts": str(row["ts"]),
                    "value": raw_value,
                    "telegramtype": row["telegramtype"],
                    "dev_source": str(row["dev_source"] or ""),
                }
            )
        return out

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

    # --- Silence-Detection (Iter 13, QS-c) ----------------------------------

    async def silence_detect(
        self,
        from_iso: str,
        to_iso: str,
        *,
        now_iso: str,
        max_silence_minutes: int,
    ) -> list[dict[str, Any]]:
        """Liefert pro Source-Adresse das last_seen + Stille-Status.

        - dev_source: KNX Individualadresse (1.1.x)
        - last_seen: ISO-Timestamp des letzten Telegramms im Zeitraum
        - total: Anzahl Telegramme im Zeitraum
        - silent_minutes: Minuten seit last_seen (rel. zu now_iso)
        - alarm: silent_minutes > max_silence_minutes
        """
        from datetime import datetime as _dt  # noqa: PLC0415

        rows = await self._db.fetch_all(_SILENCE_DETECT_SQL, (from_iso, to_iso))
        now = _dt.fromisoformat(now_iso)
        out: list[dict[str, Any]] = []
        for row in rows:
            last_seen_str = str(row["last_seen"])
            try:
                last_seen = _dt.fromisoformat(last_seen_str)
            except ValueError:
                continue
            silent_min = (now - last_seen).total_seconds() / 60.0
            out.append(
                {
                    "dev_source": str(row["dev_source"] or ""),
                    "last_seen": last_seen_str,
                    "total": int(row["total"]),
                    "silent_minutes": round(silent_min, 1),
                    "alarm": silent_min > max_silence_minutes,
                }
            )
        return out

    # --- Bus-Health (Iter 12, QS-a) -----------------------------------------

    async def bus_health(self, from_iso: str, to_iso: str) -> dict[str, float]:
        """Wiederhol-Quote ueber den Zeitraum.

        Liefert {total, repeated, ratio_pct}. ratio_pct ist 0.0 bei
        leerem Period.
        """
        row = await self._db.fetch_one(_BUS_HEALTH_SQL, (from_iso, to_iso))
        if row is None:
            return {"total": 0, "repeated": 0, "ratio_pct": 0.0}
        total = int(row["total"] or 0)
        repeated = int(row["repeated_count"] or 0)
        ratio = (repeated / total * 100.0) if total > 0 else 0.0
        return {
            "total": total,
            "repeated": repeated,
            "ratio_pct": round(ratio, 2),
        }

    async def bus_health_per_ga(
        self, from_iso: str, to_iso: str, *, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Top-GAs mit der hoechsten Wiederhol-Quote (absolut + relativ)."""
        rows = await self._db.fetch_all(
            _BUS_HEALTH_PER_GA_SQL, (from_iso, to_iso, max(1, min(limit, 100)))
        )
        out: list[dict[str, Any]] = []
        for row in rows:
            total = int(row["total"] or 0)
            repeated = int(row["repeated_count"] or 0)
            ratio = (repeated / total * 100.0) if total > 0 else 0.0
            out.append(
                {
                    "ga": str(row["ga"] or ""),
                    "label": row["label"],
                    "total": total,
                    "repeated": repeated,
                    "ratio_pct": round(ratio, 2),
                }
            )
        return out

    # --- Buslast-Zeitreihe (Iter 36, Feature A) -----------------------------

    async def busload_timeseries(
        self, from_iso: str, to_iso: str, *, bucket_seconds: int = 10
    ) -> list[dict[str, Any]]:
        """Liefert Buslast in % pro Zeit-Bucket.

        Modell:
            pct = telegrams * KNX_AVG_TELEGRAM_BITS
                  / (bucket_seconds * KNX_TP_BAUDRATE_BPS) * 100

        Default-Bucket = 10 s (ETS-Standard, sliding window). Buckets ohne
        Telegramme tauchen NICHT auf — der Caller kann lueckenlose Series
        bei Bedarf selbst auffuellen.
        """
        bucket_seconds = max(bucket_seconds, 1)
        rows = await self._db.fetch_all(
            _BUSLOAD_TIMESERIES_SQL,
            (bucket_seconds, bucket_seconds, from_iso, to_iso),
        )
        out: list[dict[str, Any]] = []
        denom = bucket_seconds * KNX_TP_BAUDRATE_BPS
        for row in rows:
            telegrams = int(row["telegrams"] or 0)
            pct = (telegrams * KNX_AVG_TELEGRAM_BITS / denom) * 100.0 if denom else 0.0
            out.append(
                {
                    "bucket": str(row["bucket"]),
                    "telegrams": telegrams,
                    "busload_pct": round(pct, 2),
                }
            )
        return out

    # --- Sensitive-Log (Iter 42, Feature N) ---------------------------------

    async def sensitive_addresses(self) -> list[dict[str, Any]]:
        """Liefert die Liste der als is_sensitive markierten GAs."""
        rows = await self._db.fetch_all(
            "SELECT address AS ga, label, dpt FROM knx_group_addresses "
            "WHERE is_sensitive = 1 ORDER BY address ASC"
        )
        return [
            {
                "ga": str(row["ga"]),
                "label": row["label"],
                "dpt": row["dpt"],
            }
            for row in rows
        ]

    async def sensitive_telegrams(
        self, from_iso: str, to_iso: str, *, limit: int = 200
    ) -> list[dict[str, Any]]:
        """Liefert Telegramme von is_sensitive=1-GAs im Zeitraum.

        Sortiert DESC nach Zeit (neueste zuerst), limitiert auf max 1000
        Eintraege fuer DoS-Schutz.
        """
        capped = max(1, min(int(limit), 1000))
        rows = await self._db.fetch_all(
            """
            SELECT
                r.timestamp     AS ts,
                r.destination   AS ga,
                r.source        AS dev_source,
                r.value         AS value,
                r.telegramtype  AS telegramtype,
                a.label         AS label,
                a.dpt           AS dpt
            FROM knx_raw_telegrams r
            INNER JOIN knx_group_addresses a ON a.address = r.destination
            WHERE a.is_sensitive = 1
              AND r.timestamp >= ?
              AND r.timestamp <  ?
            ORDER BY r.timestamp DESC
            LIMIT ?
            """,
            (from_iso, to_iso, capped),
        )
        return [
            {
                "ts": str(row["ts"]),
                "ga": str(row["ga"]),
                "dev_source": str(row["dev_source"] or ""),
                "value": row["value"],
                "telegramtype": row["telegramtype"],
                "label": row["label"],
                "dpt": row["dpt"],
            }
            for row in rows
        ]

    async def set_sensitive(self, ga: str, *, sensitive: bool) -> None:
        """Schaltet das is_sensitive-Flag fuer eine GA.

        Falls die GA noch nicht in knx_group_addresses existiert (z. B.
        weil sie noch nie auf dem Bus gesehen wurde), wird ein minimaler
        Eintrag mit Default-Label="Sensitive GA" angelegt — Admin kann
        das Label spaeter im KNX-Adressen-Tab anpassen.
        """
        flag = 1 if sensitive else 0
        now = datetime.now(UTC).isoformat(timespec="seconds")
        existing = await self._db.fetch_one(
            "SELECT 1 AS x FROM knx_group_addresses WHERE address = ?", (ga,)
        )
        if existing is None:
            await self._db.execute(
                "INSERT INTO knx_group_addresses "
                "(address, label, is_sensitive, created_at, updated_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (ga, "Sensitive GA", flag, now, now),
            )
        else:
            await self._db.execute(
                "UPDATE knx_group_addresses SET is_sensitive = ?, updated_at = ? WHERE address = ?",
                (flag, now, ga),
            )

    # --- Burst-Detector (Iter 40, Feature C) --------------------------------

    async def burst_detect(
        self,
        from_iso: str,
        to_iso: str,
        *,
        window_seconds: int = 5,
        threshold_pct: float = 30.0,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """Liefert Telegramm-Bursts ueber `threshold_pct` Buslast.

        Bucketing per Unix-Sekunden — gleiches Schema wie busload_timeseries,
        aber mit HAVING-Filter und Sortierung nach Burst-Hoehe absteigend.

        Pro Bucket: telegrams, busload_pct, ga_count (verschiedene GAs),
        source_count (verschiedene Geraete). Hilft, "10 Rolladen
        gleichzeitig" von "ein chattiges Geraet" zu unterscheiden.
        """
        ws = max(1, int(window_seconds))
        capped_limit = max(1, min(int(limit), 500))
        threshold_count = int(
            (max(0.01, threshold_pct) / 100.0) * (ws * KNX_TP_BAUDRATE_BPS) / KNX_AVG_TELEGRAM_BITS
        )
        threshold_count = max(threshold_count, 1)
        rows = await self._db.fetch_all(
            _BURSTS_SQL,
            (ws, ws, from_iso, to_iso, threshold_count, capped_limit),
        )
        denom = ws * KNX_TP_BAUDRATE_BPS
        out: list[dict[str, Any]] = []
        for row in rows:
            telegrams = int(row["telegrams"] or 0)
            pct = (telegrams * KNX_AVG_TELEGRAM_BITS / denom) * 100.0 if denom else 0.0
            out.append(
                {
                    "bucket": str(row["bucket"]),
                    "telegrams": telegrams,
                    "busload_pct": round(pct, 2),
                    "ga_count": int(row["ga_count"] or 0),
                    "source_count": int(row["source_count"] or 0),
                }
            )
        return out

    # --- Sibling-GAs (Iter 29) ----------------------------------------------

    async def gas_for_source(
        self, dev_source: str, from_iso: str, to_iso: str, *, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Liefert alle GAs eines Geraets (gleiche Source-Adresse) im Zeitraum.

        Wird vom Detail-Pane genutzt, damit der User sieht, welche
        anderen GAs dasselbe Geraet bedient — fuer „ist das ganze
        Gerat kaputt oder nur diese eine Gruppenadresse?"
        """
        if not dev_source:
            return []
        rows = await self._db.fetch_all(
            "SELECT r.destination AS ga, a.label AS label, COUNT(*) AS n "
            "FROM knx_raw_telegrams r "
            "LEFT JOIN knx_group_addresses a ON a.address = r.destination "
            "WHERE r.source = ? AND r.timestamp >= ? AND r.timestamp < ? "
            "GROUP BY r.destination, a.label "
            "ORDER BY n DESC "
            "LIMIT ?",
            (dev_source, from_iso, to_iso, max(1, min(limit, 100))),
        )
        return [
            {
                "ga": str(row["ga"]),
                "label": row["label"],
                "count": int(row["n"]),
            }
            for row in rows
        ]

    # --- Cleanup (Iter 24) --------------------------------------------------

    async def cleanup_raw_older_than(self, cutoff_iso: str) -> int:
        """Loescht alle knx_raw_telegrams aelter als cutoff_iso.

        Liefert die Anzahl der geloeschten Zeilen — fuer Logging.
        """
        cursor = await self._db.connection.execute(
            "DELETE FROM knx_raw_telegrams WHERE timestamp < ?", (cutoff_iso,)
        )
        await self._db.connection.commit()
        deleted = cursor.rowcount or 0
        await cursor.close()
        return int(deleted)

    async def cleanup_raw_hard_cap(self, max_rows: int) -> int:
        """DoS-Schutz: behaelt nur die juengsten max_rows Zeilen.

        Wird zusaetzlich zur Zeit-basierten Retention angewandt.
        """
        if max_rows <= 0:
            return 0
        cursor = await self._db.connection.execute(
            "DELETE FROM knx_raw_telegrams WHERE id IN ("
            "  SELECT id FROM knx_raw_telegrams "
            "  ORDER BY timestamp DESC, id DESC "
            "  LIMIT -1 OFFSET ?"
            ")",
            (max_rows,),
        )
        await self._db.connection.commit()
        deleted = cursor.rowcount or 0
        await cursor.close()
        return int(deleted)

    async def cleanup_counters_older_than(self, cutoff_iso: str) -> int:
        """Loescht knx_telegram_counters mit hour_bucket < cutoff_iso."""
        cursor = await self._db.connection.execute(
            "DELETE FROM knx_telegram_counters WHERE hour_bucket < ?",
            (cutoff_iso,),
        )
        await self._db.connection.commit()
        deleted = cursor.rowcount or 0
        await cursor.close()
        return int(deleted)

    # --- Raw-Erfassung (Iter 21, bus-weit) ----------------------------------

    async def insert_raw(
        self,
        *,
        timestamp: str,
        destination: str,
        source: str,
        telegramtype: str | None,
        value: object,
        repeated: bool,
    ) -> None:
        """Iter 21: schreibt jedes vom Bus gesehene Telegramm in
        knx_raw_telegrams — unabhaengig von der log_enabled-Whitelist.

        value wird als String serialisiert (json-konvertierter Repr).
        """
        import json as _json  # noqa: PLC0415

        try:
            value_str = _json.dumps(value, default=str, ensure_ascii=False)
        except (TypeError, ValueError):
            value_str = str(value)
        await self._db.execute(
            "INSERT INTO knx_raw_telegrams "
            "(timestamp, destination, source, telegramtype, value, repeated) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                timestamp,
                destination,
                source or "",
                telegramtype,
                value_str,
                1 if repeated else 0,
            ),
        )

    # --- Schatten-Counter (Iter 16, Phase-2-Vorbereitung) -------------------

    async def increment_counter(self, ga: str, hour_bucket: str) -> None:
        """UPSERT-Increment fuer (ga, hour_bucket).

        Phase-2-Schema: erlaubt schnelle Long-Term-Aggregation, ohne
        json_extract auf der grossen messages-Tabelle. Wird vom KNX-
        Listener nach erfolgreichem Insert aufgerufen.
        """
        await self._db.execute(
            """
            INSERT INTO knx_telegram_counters (ga, hour_bucket, count)
            VALUES (?, ?, 1)
            ON CONFLICT(ga, hour_bucket) DO UPDATE SET
                count = count + 1
            """,
            (ga, hour_bucket),
        )

    async def counter_total_for_ga(self, ga: str, from_iso: str, to_iso: str) -> int:
        """Liest aufsummierte Counter fuer eine GA aus dem Schatten-Cache."""
        row = await self._db.fetch_one(
            "SELECT SUM(count) AS n FROM knx_telegram_counters "
            "WHERE ga = ? AND hour_bucket >= ? AND hour_bucket < ?",
            (ga, from_iso, to_iso),
        )
        if row is None:
            return 0
        return int(row["n"] or 0)

    # --- Long-Term-Sicht (Iter 38, Feature B+J) -----------------------------
    #
    # Counter-Tabelle deckt bis zu 365 Tage ab — Raw-Tabelle nur 48h.
    # Die folgenden Queries sind der "degradierte Modus" fuer Perioden
    # > 48 h: keine Source-Adresse, keine Werte, nur Counts pro GA und
    # Stunden-/Tages-Bucket.

    async def counter_total(self, from_iso: str, to_iso: str) -> int:
        """Period-Total ueber alle GAs aus der Counter-Tabelle."""
        row = await self._db.fetch_one(
            "SELECT SUM(count) AS n FROM knx_telegram_counters "
            "WHERE hour_bucket >= ? AND hour_bucket < ?",
            (from_iso, to_iso),
        )
        if row is None:
            return 0
        return int(row["n"] or 0)

    async def counter_top_gas(
        self, from_iso: str, to_iso: str, *, limit: int = 50
    ) -> list[dict[str, Any]]:
        """Top-GAs nach Counter-Total im Zeitraum.

        Liefert auch Label aus knx_group_addresses, falls gepflegt.
        """
        capped = max(1, min(limit, 500))
        rows = await self._db.fetch_all(
            """
            SELECT
                c.ga       AS ga,
                a.label    AS label,
                a.dpt      AS dpt,
                SUM(c.count) AS n
            FROM knx_telegram_counters c
            LEFT JOIN knx_group_addresses a ON a.address = c.ga
            WHERE c.hour_bucket >= ?
              AND c.hour_bucket <  ?
            GROUP BY c.ga, a.label, a.dpt
            ORDER BY n DESC, c.ga ASC
            LIMIT ?
            """,
            (from_iso, to_iso, capped),
        )
        return [
            {
                "ga": str(row["ga"]),
                "label": row["label"],
                "dpt": row["dpt"],
                "count": int(row["n"] or 0),
            }
            for row in rows
        ]

    async def counter_timeseries(
        self,
        from_iso: str,
        to_iso: str,
        *,
        bucket: str = "hour",
        gas: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Zeitreihe der Counter, gruppiert nach hour oder day.

        - bucket="hour": 1 Eintrag pro hour_bucket, ueber alle GAs summiert
          (oder gefiltert, wenn `gas` gesetzt).
        - bucket="day": Aggregation auf Tagesebene.
        - sonst: Fallback auf "hour" (defensiv).
        """
        if bucket == "day":
            bucket_expr = "substr(hour_bucket, 1, 10) || 'T00:00:00'"
        else:
            bucket_expr = "hour_bucket"

        if gas:
            placeholders = ",".join("?" * len(gas))
            sql = (
                f"SELECT {bucket_expr} AS bucket, SUM(count) AS n "
                f"FROM knx_telegram_counters "
                f"WHERE hour_bucket >= ? AND hour_bucket < ? "
                f"  AND ga IN ({placeholders}) "
                f"GROUP BY bucket "
                f"ORDER BY bucket ASC"
            )
            params: list[Any] = [from_iso, to_iso, *gas]
        else:
            sql = (
                f"SELECT {bucket_expr} AS bucket, SUM(count) AS n "
                f"FROM knx_telegram_counters "
                f"WHERE hour_bucket >= ? AND hour_bucket < ? "
                f"GROUP BY bucket "
                f"ORDER BY bucket ASC"
            )
            params = [from_iso, to_iso]

        rows = await self._db.fetch_all(sql, params)
        return [{"bucket": str(row["bucket"]), "count": int(row["n"] or 0)} for row in rows]

    # --- Acknowledgements ---------------------------------------------------

    async def ack_set_bulk(
        self,
        gas: list[str],
        *,
        note: str | None = None,
        expiry_days: int | None = None,
    ) -> int:
        """Iter 33: setzt Acknowledge fuer eine Liste von GAs in einer
        Transaktion. Liefert die Anzahl der angelegten/aktualisierten
        Eintraege.

        Hard-Cap auf 100 GAs pro Call wird vom API-Layer enforced
        (Bulk-DoS-Schutz). Hier nehmen wir die Liste vertrauensvoll an.
        """
        if not gas:
            return 0
        now = datetime.now(UTC)
        expires: str | None = None
        if expiry_days and expiry_days > 0:
            expires = (now + timedelta(days=expiry_days)).isoformat(timespec="seconds")
        ts = now.isoformat(timespec="seconds")
        for ga in gas:
            await self._db.execute(
                """
                INSERT INTO knx_ga_acknowledgements (ga, note, acknowledged_at, expires_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(ga) DO UPDATE SET
                    note            = excluded.note,
                    acknowledged_at = excluded.acknowledged_at,
                    expires_at      = excluded.expires_at
                """,
                (ga, note, ts, expires),
            )
        return len(gas)

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
            "SELECT ga FROM knx_ga_acknowledgements WHERE expires_at IS NULL OR expires_at >= ?",
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
