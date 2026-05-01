"""Persistenz-Layer fuer messagehub: parametrisierte SQL-Queries.

Alle Statements verwenden gebundene Parameter (`?`) — keine String-Konkatenation,
also SQL-Injection-sicher.
"""

from __future__ import annotations

import json
import secrets
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from .models import Message, Severity, WebhookConfig

if TYPE_CHECKING:
    from .database import Database


class MessageRepository:
    """CRUD-Operationen fuer die Tabelle `messages`."""

    def __init__(self, database: Database) -> None:
        self._db = database

    async def insert(self, message: Message) -> int:
        """Fuegt eine Nachricht ein und gibt die generierte ID zurueck."""
        cursor = await self._db.connection.execute(
            """
            INSERT INTO messages (timestamp, severity, source, text, metadata, webhook_id)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                message.timestamp_iso,
                message.severity.value,
                message.source,
                message.text,
                message.metadata_json,
                message.webhook_id,
            ),
        )
        await self._db.connection.commit()
        new_id = cursor.lastrowid
        await cursor.close()
        if new_id is None:
            raise RuntimeError("INSERT did not produce a lastrowid")
        message.id = new_id
        return new_id

    async def get_by_id(self, message_id: int) -> Message | None:
        """Liefert eine Nachricht per ID oder None."""
        row = await self._db.fetch_one(
            "SELECT * FROM messages WHERE id = ?",
            (message_id,),
        )
        return _row_to_message(row) if row is not None else None

    async def delete_by_id(self, message_id: int) -> bool:
        """Loescht eine Nachricht. True, wenn etwas geloescht wurde."""
        cursor = await self._db.connection.execute(
            "DELETE FROM messages WHERE id = ?",
            (message_id,),
        )
        await self._db.connection.commit()
        deleted = cursor.rowcount > 0
        await cursor.close()
        return deleted

    async def list_recent(self, limit: int = 100) -> list[Message]:
        """Liefert die juengsten `limit` Nachrichten (timestamp DESC, dann id DESC)."""
        if limit <= 0:
            return []
        rows = await self._db.fetch_all(
            """
            SELECT * FROM messages
            ORDER BY timestamp DESC, id DESC
            LIMIT ?
            """,
            (limit,),
        )
        return [_row_to_message(row) for row in rows]

    async def count_total(self) -> int:
        """Liefert die Gesamtanzahl der Nachrichten."""
        row = await self._db.fetch_one("SELECT COUNT(*) AS cnt FROM messages")
        if row is None:
            return 0
        return int(row["cnt"])

    async def count_by_severity_since(self, severity: str, since_iso: str) -> int:
        """Counter pro Severity ab `since_iso` (inklusiv)."""
        row = await self._db.fetch_one(
            "SELECT COUNT(*) AS cnt FROM messages WHERE severity = ? AND timestamp >= ?",
            (severity, since_iso),
        )
        return int(row["cnt"]) if row is not None else 0


class WebhookConfigRepository:
    """CRUD fuer Webhook-Konfigurationen."""

    def __init__(self, database: Database) -> None:
        self._db = database

    @staticmethod
    def generate_webhook_id() -> str:
        """32-stellige URL-sichere ID."""
        return secrets.token_urlsafe(24)[:32]

    async def add(self, cfg: WebhookConfig) -> int:
        cursor = await self._db.connection.execute(
            """
            INSERT INTO webhook_configs
                (name, webhook_id, default_severity, default_source,
                 field_map_json, enabled, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                cfg.name,
                cfg.webhook_id,
                cfg.default_severity.value,
                cfg.default_source,
                cfg.field_map_json,
                1 if cfg.enabled else 0,
                cfg.created_at.astimezone(UTC).isoformat(timespec="seconds"),
            ),
        )
        await self._db.connection.commit()
        new_id = cursor.lastrowid
        await cursor.close()
        if new_id is None:
            raise RuntimeError("INSERT did not produce a lastrowid")
        cfg.id = new_id
        return new_id

    async def get(self, webhook_id: str) -> WebhookConfig | None:
        row = await self._db.fetch_one(
            "SELECT * FROM webhook_configs WHERE webhook_id = ?", (webhook_id,)
        )
        return _row_to_webhook(row) if row is not None else None

    async def get_by_name(self, name: str) -> WebhookConfig | None:
        row = await self._db.fetch_one("SELECT * FROM webhook_configs WHERE name = ?", (name,))
        return _row_to_webhook(row) if row is not None else None

    async def update(self, cfg: WebhookConfig) -> None:
        if cfg.id is None:
            raise ValueError("WebhookConfig.id required for update")
        await self._db.execute(
            """
            UPDATE webhook_configs
               SET name = ?, default_severity = ?, default_source = ?,
                   field_map_json = ?, enabled = ?
             WHERE id = ?
            """,
            (
                cfg.name,
                cfg.default_severity.value,
                cfg.default_source,
                cfg.field_map_json,
                1 if cfg.enabled else 0,
                cfg.id,
            ),
        )

    async def delete(self, webhook_id: str) -> bool:
        cursor = await self._db.connection.execute(
            "DELETE FROM webhook_configs WHERE webhook_id = ?", (webhook_id,)
        )
        await self._db.connection.commit()
        deleted = cursor.rowcount > 0
        await cursor.close()
        return deleted

    async def list_all(self) -> list[WebhookConfig]:
        rows = await self._db.fetch_all("SELECT * FROM webhook_configs ORDER BY created_at DESC")
        return [_row_to_webhook(row) for row in rows]


def _row_to_webhook(row: object) -> WebhookConfig:
    field_map_str: str | None = row["field_map_json"]  # type: ignore[index]
    return WebhookConfig(
        id=int(row["id"]),  # type: ignore[index]
        name=row["name"],  # type: ignore[index]
        webhook_id=row["webhook_id"],  # type: ignore[index]
        default_severity=Severity(row["default_severity"]),  # type: ignore[index]
        default_source=row["default_source"],  # type: ignore[index]
        field_map=json.loads(field_map_str) if field_map_str else None,
        enabled=bool(row["enabled"]),  # type: ignore[index]
        created_at=datetime.fromisoformat(row["created_at"]).astimezone(UTC),  # type: ignore[index]
    )


def _row_to_message(row: object) -> Message:
    """Konvertiert eine aiosqlite.Row in ein Message-Dataclass."""
    # row supports __getitem__ via aiosqlite.Row, das wir hier via dict-Zugriff nutzen.
    timestamp_str: str = row["timestamp"]  # type: ignore[index]
    metadata_str: str | None = row["metadata"]  # type: ignore[index]
    return Message(
        id=int(row["id"]),  # type: ignore[index]
        timestamp=datetime.fromisoformat(timestamp_str).astimezone(UTC),
        severity=Severity(row["severity"]),  # type: ignore[index]
        source=row["source"],  # type: ignore[index]
        text=row["text"],  # type: ignore[index]
        metadata=json.loads(metadata_str) if metadata_str else None,
        webhook_id=row["webhook_id"],  # type: ignore[index]
    )
