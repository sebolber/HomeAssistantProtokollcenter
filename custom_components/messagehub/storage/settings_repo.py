"""Iter 48 (N1): Persistente Integration-Settings als Key/Value.

Bewusst minimal: keine Versionierung, keine Schemas — nur ein Dict
fuer User-Toggles, die zwischen HA-Neustarts ueberleben muessen, ohne
einen Config-Flow-Reload auszuloesen.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .database import Database


class SettingsRepository:
    """Key/Value-Store fuer Integration-Toggles."""

    def __init__(self, db: Database) -> None:
        self._db = db

    async def get(self, key: str) -> str | None:
        row = await self._db.fetch_one(
            "SELECT value FROM messagehub_settings WHERE key = ?", (key,)
        )
        return None if row is None else str(row["value"])

    async def get_bool(self, key: str, *, default: bool) -> bool:
        raw = await self.get(key)
        if raw is None:
            return default
        return raw.strip().lower() in {"1", "true", "yes", "on"}

    async def set(self, key: str, value: str) -> None:
        now = datetime.now(UTC).isoformat(timespec="seconds")
        await self._db.execute(
            "INSERT INTO messagehub_settings (key, value, updated_at) "
            "VALUES (?, ?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value, "
            "updated_at = excluded.updated_at",
            (key, value, now),
        )

    async def set_bool(self, key: str, value: bool) -> None:
        await self.set(key, "true" if value else "false")
