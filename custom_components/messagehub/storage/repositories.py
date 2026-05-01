"""Persistenz-Layer fuer messagehub: parametrisierte SQL-Queries.

Alle Statements verwenden gebundene Parameter (`?`) — keine String-Konkatenation,
also SQL-Injection-sicher.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from .models import Message, Severity

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
