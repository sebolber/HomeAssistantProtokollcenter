"""Repository fuer Auto-Remediation-Hooks (Iter 47)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from ..storage import Database


@dataclass(slots=True)
class RemediationHook:
    id: int | None
    name: str
    source_pattern: str
    fingerprint: str | None
    automation_id: str  # script.xxx oder automation.xxx
    confirm_required: bool = True
    enabled: bool = True


class RemediationHookRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    @staticmethod
    def _validate(item: RemediationHook) -> None:
        if not item.name.strip():
            raise ValueError("name required")
        if not item.source_pattern.strip():
            raise ValueError("source_pattern required")
        if not item.automation_id or "." not in item.automation_id:
            raise ValueError(
                "automation_id required (format: domain.name, z. B. script.restart_ap)"
            )

    async def add(self, item: RemediationHook) -> int:
        self._validate(item)
        cursor = await self._db.connection.execute(
            "INSERT INTO remediation_hooks "
            "(name, source_pattern, fingerprint, automation_id, "
            " confirm_required, enabled, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                item.name.strip(),
                item.source_pattern,
                item.fingerprint,
                item.automation_id,
                1 if item.confirm_required else 0,
                1 if item.enabled else 0,
                datetime.now(UTC).isoformat(timespec="seconds"),
            ),
        )
        await self._db.connection.commit()
        new_id = cursor.lastrowid or 0
        await cursor.close()
        item.id = int(new_id)
        return int(new_id)

    async def update(self, item: RemediationHook) -> None:
        if item.id is None:
            raise ValueError("id required")
        self._validate(item)
        await self._db.execute(
            "UPDATE remediation_hooks SET name = ?, source_pattern = ?, fingerprint = ?, "
            "automation_id = ?, confirm_required = ?, enabled = ? WHERE id = ?",
            (
                item.name.strip(),
                item.source_pattern,
                item.fingerprint,
                item.automation_id,
                1 if item.confirm_required else 0,
                1 if item.enabled else 0,
                item.id,
            ),
        )

    async def delete(self, hook_id: int) -> bool:
        cursor = await self._db.connection.execute(
            "DELETE FROM remediation_hooks WHERE id = ?", (hook_id,)
        )
        await self._db.connection.commit()
        deleted = cursor.rowcount > 0
        await cursor.close()
        return bool(deleted)

    async def list_all(self) -> list[RemediationHook]:
        rows = await self._db.fetch_all("SELECT * FROM remediation_hooks ORDER BY name")
        return [_row_to_hook(row) for row in rows]

    async def list_enabled(self) -> list[RemediationHook]:
        rows = await self._db.fetch_all("SELECT * FROM remediation_hooks WHERE enabled = 1")
        return [_row_to_hook(row) for row in rows]


def _row_to_hook(row: Any) -> RemediationHook:
    return RemediationHook(
        id=int(row["id"]),
        name=str(row["name"]),
        source_pattern=str(row["source_pattern"]),
        fingerprint=row["fingerprint"],
        automation_id=str(row["automation_id"]),
        confirm_required=bool(row["confirm_required"]),
        enabled=bool(row["enabled"]),
    )
