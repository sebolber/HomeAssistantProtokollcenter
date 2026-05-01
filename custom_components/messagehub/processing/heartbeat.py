"""Iter 35: Heartbeat-Tracker fuer stille Quellen."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..storage import Database


@dataclass(slots=True)
class HeartbeatSource:
    source: str
    expected_interval_seconds: int
    last_seen: datetime | None = None
    silent_alert_active: bool = False
    enabled: bool = True


SILENT_FACTOR = 1.5


def is_silent(hb: HeartbeatSource, *, now: datetime | None = None) -> bool:
    """True, wenn `last_seen + 1.5 × expected` ueberschritten ist."""
    if not hb.enabled or hb.last_seen is None:
        return False
    now = now or datetime.now(UTC)
    threshold = hb.last_seen + timedelta(seconds=hb.expected_interval_seconds * SILENT_FACTOR)
    return now > threshold


class HeartbeatRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    async def upsert(self, hb: HeartbeatSource) -> None:
        await self._db.execute(
            """
            INSERT INTO heartbeat_sources
                (source, expected_interval_seconds, last_seen,
                 silent_alert_active, enabled, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(source) DO UPDATE SET
                expected_interval_seconds = excluded.expected_interval_seconds,
                enabled = excluded.enabled
            """,
            (
                hb.source,
                hb.expected_interval_seconds,
                hb.last_seen.isoformat(timespec="seconds") if hb.last_seen else None,
                1 if hb.silent_alert_active else 0,
                1 if hb.enabled else 0,
                datetime.now(UTC).isoformat(timespec="seconds"),
            ),
        )

    async def touch(self, source: str) -> None:
        await self._db.execute(
            """
            UPDATE heartbeat_sources
               SET last_seen = ?, silent_alert_active = 0
             WHERE source = ?
            """,
            (datetime.now(UTC).isoformat(timespec="seconds"), source),
        )

    async def list_all(self) -> list[HeartbeatSource]:
        rows = await self._db.fetch_all("SELECT * FROM heartbeat_sources")
        out: list[HeartbeatSource] = []
        for row in rows:
            ls_str = row["last_seen"]
            out.append(
                HeartbeatSource(
                    source=row["source"],
                    expected_interval_seconds=int(row["expected_interval_seconds"]),
                    last_seen=datetime.fromisoformat(ls_str).astimezone(UTC) if ls_str else None,
                    silent_alert_active=bool(row["silent_alert_active"]),
                    enabled=bool(row["enabled"]),
                )
            )
        return out

    async def set_silent(self, source: str, silent: bool) -> None:
        await self._db.execute(
            "UPDATE heartbeat_sources SET silent_alert_active = ? WHERE source = ?",
            (1 if silent else 0, source),
        )
