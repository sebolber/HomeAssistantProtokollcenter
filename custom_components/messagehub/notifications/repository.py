"""Repository fuer Notification-Channels (Iter 30/31).

Persistiert pro Channel: Name, Typ (telegram/pushover/ntfy/signal/notify),
Severity-Threshold, Quiet Hours, Throttle, Channel-spezifische Config-JSON.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from ..storage import Database


_VALID_TYPES = {"telegram", "pushover", "ntfy", "signal", "notify"}
_VALID_SEVS = {"debug", "info", "warning", "error"}


@dataclass(slots=True)
class Channel:
    id: int | None
    name: str
    channel_type: str
    enabled: bool = True
    severity_threshold: str = "warning"
    quiet_start: str | None = None
    quiet_end: str | None = None
    quiet_bypass_error: bool = True
    throttle_seconds: int = 600
    config: dict[str, Any] | None = None


class ChannelRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    @staticmethod
    def _validate(item: Channel) -> None:
        if not item.name or not item.name.strip():
            raise ValueError("name must not be empty")
        if item.channel_type not in _VALID_TYPES:
            raise ValueError(f"invalid channel_type {item.channel_type!r}; expected {_VALID_TYPES}")
        if item.severity_threshold not in _VALID_SEVS:
            raise ValueError(
                f"invalid severity_threshold {item.severity_threshold!r}; expected {_VALID_SEVS}"
            )
        if item.throttle_seconds < 0:
            raise ValueError("throttle_seconds must be >= 0")

    async def add(self, item: Channel) -> int:
        self._validate(item)
        cursor = await self._db.connection.execute(
            "INSERT INTO notification_channels "
            "(name, channel_type, enabled, severity_threshold, "
            " quiet_start, quiet_end, quiet_bypass_error, throttle_seconds, "
            " config_json, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                item.name.strip(),
                item.channel_type,
                1 if item.enabled else 0,
                item.severity_threshold,
                item.quiet_start,
                item.quiet_end,
                1 if item.quiet_bypass_error else 0,
                item.throttle_seconds,
                json.dumps(item.config or {}),
                datetime.now(UTC).isoformat(timespec="seconds"),
            ),
        )
        await self._db.connection.commit()
        new_id = cursor.lastrowid or 0
        await cursor.close()
        item.id = int(new_id)
        return int(new_id)

    async def update(self, item: Channel) -> None:
        if item.id is None:
            raise ValueError("id required for update")
        self._validate(item)
        await self._db.execute(
            "UPDATE notification_channels SET "
            "name = ?, channel_type = ?, enabled = ?, severity_threshold = ?, "
            "quiet_start = ?, quiet_end = ?, quiet_bypass_error = ?, "
            "throttle_seconds = ?, config_json = ? "
            "WHERE id = ?",
            (
                item.name.strip(),
                item.channel_type,
                1 if item.enabled else 0,
                item.severity_threshold,
                item.quiet_start,
                item.quiet_end,
                1 if item.quiet_bypass_error else 0,
                item.throttle_seconds,
                json.dumps(item.config or {}),
                item.id,
            ),
        )

    async def delete(self, channel_id: int) -> bool:
        cursor = await self._db.connection.execute(
            "DELETE FROM notification_channels WHERE id = ?", (channel_id,)
        )
        await self._db.connection.commit()
        deleted = cursor.rowcount > 0
        await cursor.close()
        return deleted

    async def list_all(self) -> list[Channel]:
        rows = await self._db.fetch_all("SELECT * FROM notification_channels ORDER BY name")
        return [_row_to_channel(row) for row in rows]

    async def list_enabled(self) -> list[Channel]:
        rows = await self._db.fetch_all(
            "SELECT * FROM notification_channels WHERE enabled = 1 ORDER BY name"
        )
        return [_row_to_channel(row) for row in rows]


def _row_to_channel(row: Any) -> Channel:
    cfg_str = row["config_json"] or "{}"
    try:
        cfg = json.loads(cfg_str)
    except (ValueError, TypeError):
        cfg = {}
    return Channel(
        id=int(row["id"]),
        name=str(row["name"]),
        channel_type=str(row["channel_type"]),
        enabled=bool(row["enabled"]),
        severity_threshold=str(row["severity_threshold"]),
        quiet_start=row["quiet_start"],
        quiet_end=row["quiet_end"],
        quiet_bypass_error=bool(row["quiet_bypass_error"]),
        throttle_seconds=int(row["throttle_seconds"]),
        config=cfg,
    )


def channel_to_dict(item: Channel) -> dict[str, Any]:
    out = asdict(item)
    return out
