"""Iter 92 / K1: Repository fuer Saved Filters.

Filter-Presets pro Scope (messages / knx-stats / audit). Schluessel:
(scope, name) — Unique-Index garantiert keine Duplikate.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from .database import Database


@dataclass(frozen=True, slots=True)
class SavedFilter:
    id: int | None
    name: str
    scope: str
    filters: dict[str, Any]
    created_at: str
    updated_at: str


_VALID_SCOPES = {"messages", "knx-stats", "audit"}
_MAX_NAME_LEN = 80


def _validate_scope(scope: str) -> None:
    if scope not in _VALID_SCOPES:
        raise ValueError(f"invalid scope {scope!r} — must be one of {sorted(_VALID_SCOPES)}")


class SavedFiltersRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    async def list_by_scope(self, scope: str) -> list[SavedFilter]:
        """Liefert alle Saved Filters fuer einen Scope."""
        _validate_scope(scope)
        rows = await self._db.fetch_all(
            "SELECT id, name, scope, filters, created_at, updated_at "
            "FROM saved_filters WHERE scope = ? ORDER BY name ASC",
            (scope,),
        )
        return [self._row_to_filter(row) for row in rows]

    async def get(self, filter_id: int) -> SavedFilter | None:
        rows = await self._db.fetch_all(
            "SELECT id, name, scope, filters, created_at, updated_at "
            "FROM saved_filters WHERE id = ? LIMIT 1",
            (filter_id,),
        )
        if not rows:
            return None
        return self._row_to_filter(rows[0])

    async def upsert(self, *, name: str, scope: str, filters: dict[str, Any]) -> SavedFilter:
        """Anlegen oder Aktualisieren — UNIQUE(scope, name) verhindert
        Duplikate."""
        _validate_scope(scope)
        if not isinstance(name, str) or not name.strip():
            raise ValueError("name must be a non-empty string")
        if len(name) > _MAX_NAME_LEN:
            raise ValueError(f"name must be <= {_MAX_NAME_LEN} chars")
        if not isinstance(filters, dict):
            raise ValueError("filters must be a dict")  # noqa: TRY004
        now = datetime.now(UTC).isoformat(timespec="seconds")
        filters_json = json.dumps(filters, ensure_ascii=False)
        await self._db.execute(
            """
            INSERT INTO saved_filters (name, scope, filters, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(scope, name) DO UPDATE SET
                filters    = excluded.filters,
                updated_at = excluded.updated_at
            """,
            (name, scope, filters_json, now, now),
        )
        rows = await self._db.fetch_all(
            "SELECT id, name, scope, filters, created_at, updated_at "
            "FROM saved_filters WHERE scope = ? AND name = ? LIMIT 1",
            (scope, name),
        )
        return self._row_to_filter(rows[0])

    async def delete(self, filter_id: int) -> bool:
        """Loescht einen Filter; True wenn ein Eintrag entfernt wurde."""
        rows = await self._db.fetch_all(
            "SELECT id FROM saved_filters WHERE id = ? LIMIT 1",
            (filter_id,),
        )
        if not rows:
            return False
        await self._db.execute("DELETE FROM saved_filters WHERE id = ?", (filter_id,))
        return True

    @staticmethod
    def _row_to_filter(row: Any) -> SavedFilter:
        try:
            filters = json.loads(row["filters"])
        except (ValueError, TypeError):
            filters = {}
        return SavedFilter(
            id=int(row["id"]) if row["id"] is not None else None,
            name=str(row["name"]),
            scope=str(row["scope"]),
            filters=filters if isinstance(filters, dict) else {},
            created_at=str(row["created_at"]),
            updated_at=str(row["updated_at"]),
        )


def saved_filter_to_dict(item: SavedFilter) -> dict[str, Any]:
    return {
        "id": item.id,
        "name": item.name,
        "scope": item.scope,
        "filters": item.filters,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }
