"""Iter 44: Audit-Log Repository + helper."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from ..storage import Database


class AuditRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    async def record(
        self,
        *,
        actor: str,
        action: str,
        target_type: str,
        target_id: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        await self._db.execute(
            "INSERT INTO audit_log (timestamp, actor, action, target_type, target_id, details) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                datetime.now(UTC).isoformat(timespec="seconds"),
                actor,
                action,
                target_type,
                target_id,
                json.dumps(details) if details else None,
            ),
        )

    async def list_recent(self, limit: int = 100) -> list[dict[str, Any]]:
        rows = await self._db.fetch_all(
            "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?", (limit,)
        )
        return [
            {
                "id": int(row["id"]),
                "timestamp": str(row["timestamp"]),
                "actor": str(row["actor"]),
                "action": str(row["action"]),
                "target_type": str(row["target_type"]),
                "target_id": row["target_id"],
                "details": json.loads(row["details"]) if row["details"] else None,
            }
            for row in rows
        ]
