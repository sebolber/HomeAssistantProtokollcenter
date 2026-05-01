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
        from ..processing.deduplication import compute_fingerprint  # noqa: PLC0415

        fp = compute_fingerprint(message.source, message.severity.value, message.text)
        ts = message.timestamp_iso
        cursor = await self._db.connection.execute(
            """
            INSERT INTO messages
                (timestamp, severity, source, text, metadata, webhook_id,
                 fingerprint, count, first_seen, last_seen, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'new')
            """,
            (
                ts,
                message.severity.value,
                message.source,
                message.text,
                message.metadata_json,
                message.webhook_id,
                fp,
                ts,
                ts,
            ),
        )
        await self._db.connection.commit()
        new_id = cursor.lastrowid
        await cursor.close()
        if new_id is None:
            raise RuntimeError("INSERT did not produce a lastrowid")
        message.id = new_id
        return new_id

    async def insert_or_aggregate(
        self, message: Message, *, window_minutes: int = 10
    ) -> tuple[int, bool]:
        """Iter 27: aggregiert in einem aktiven Eintrag mit gleichem Fingerprint
        innerhalb des Zeitfensters; sonst regulaerer Insert.

        Returns (id, was_aggregated).
        """
        from datetime import UTC, datetime, timedelta  # noqa: PLC0415

        from ..processing.deduplication import compute_fingerprint  # noqa: PLC0415

        if window_minutes <= 0:
            return await self.insert(message), False

        fp = compute_fingerprint(message.source, message.severity.value, message.text)
        cutoff = (datetime.now(UTC) - timedelta(minutes=window_minutes)).isoformat(
            timespec="seconds"
        )
        row = await self._db.fetch_one(
            """
            SELECT id, count FROM messages
            WHERE fingerprint = ?
              AND status IN ('new', 'acknowledged')
              AND last_seen >= ?
            ORDER BY last_seen DESC
            LIMIT 1
            """,
            (fp, cutoff),
        )
        if row is None:
            return await self.insert(message), False

        msg_id = int(row["id"])
        new_count = int(row["count"]) + 1
        await self._db.execute(
            "UPDATE messages SET count = ?, last_seen = ? WHERE id = ?",
            (new_count, message.timestamp_iso, msg_id),
        )
        message.id = msg_id
        return msg_id, True

    async def set_status(self, message_id: int, status: str) -> bool:
        """Iter 28: Status-Lifecycle setzen."""
        if status not in {"new", "acknowledged", "resolved", "expired"}:
            raise ValueError(f"invalid status {status!r}")
        cursor = await self._db.connection.execute(
            "UPDATE messages SET status = ? WHERE id = ?",
            (status, message_id),
        )
        await self._db.connection.commit()
        ok = cursor.rowcount > 0
        await cursor.close()
        return ok

    async def delete_filtered(
        self,
        *,
        severities: list[str] | None = None,
        source: str | None = None,
        search: str | None = None,
        from_iso: str | None = None,
        to_iso: str | None = None,
    ) -> int:
        """Loescht alle Nachrichten, die zu den Filtern passen. Liefert die Anzahl."""
        clauses: list[str] = []
        params: list[object] = []
        if severities:
            placeholders = ",".join("?" * len(severities))
            clauses.append(f"severity IN ({placeholders})")
            params.extend(severities)
        if source:
            if "*" in source:
                clauses.append("source LIKE ?")
                params.append(source.replace("*", "%"))
            else:
                clauses.append("source = ?")
                params.append(source)
        if search:
            clauses.append("text LIKE ?")
            params.append(f"%{search}%")
        if from_iso:
            clauses.append("timestamp >= ?")
            params.append(from_iso)
        if to_iso:
            clauses.append("timestamp <= ?")
            params.append(to_iso)
        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        cursor = await self._db.connection.execute(
            f"DELETE FROM messages {where}", params
        )
        await self._db.connection.commit()
        deleted = cursor.rowcount or 0
        await cursor.close()
        return int(deleted)

    async def count_unacknowledged_errors(self) -> int:
        """Iter 29: Counter fuer den binary_sensor."""
        row = await self._db.fetch_one(
            "SELECT COUNT(*) AS cnt FROM messages "
            "WHERE severity = 'error' AND status IN ('new', 'acknowledged')"
        )
        return int(row["cnt"]) if row is not None else 0

    async def add_tag(self, message_id: int, tag: str) -> None:
        """Iter 42: Tag setzen (idempotent)."""
        await self._db.execute(
            "INSERT OR IGNORE INTO message_tags (message_id, tag) VALUES (?, ?)",
            (message_id, tag),
        )

    async def remove_tag(self, message_id: int, tag: str) -> None:
        await self._db.execute(
            "DELETE FROM message_tags WHERE message_id = ? AND tag = ?",
            (message_id, tag),
        )

    async def get_tags(self, message_id: int) -> list[str]:
        rows = await self._db.fetch_all(
            "SELECT tag FROM message_tags WHERE message_id = ? ORDER BY tag",
            (message_id,),
        )
        return [str(row["tag"]) for row in rows]

    async def heatmap_hour_weekday(self, days: int = 30) -> list[dict[str, int]]:
        """Iter 41: Heatmap (hour x weekday) ueber die letzten N Tage."""
        from datetime import UTC, datetime, timedelta  # noqa: PLC0415

        cutoff = (datetime.now(UTC) - timedelta(days=days)).isoformat(timespec="seconds")
        rows = await self._db.fetch_all(
            """
            SELECT strftime('%H', timestamp) AS hour,
                   strftime('%w', timestamp) AS weekday,
                   COUNT(*) AS cnt
              FROM messages
             WHERE timestamp >= ?
             GROUP BY hour, weekday
            """,
            (cutoff,),
        )
        return [
            {
                "hour": int(row["hour"]),
                "weekday": int(row["weekday"]),
                "count": int(row["cnt"]),
            }
            for row in rows
        ]

    async def top_sources(self, *, limit: int = 10, days: int = 30) -> list[dict[str, object]]:
        from datetime import UTC, datetime, timedelta  # noqa: PLC0415

        cutoff = (datetime.now(UTC) - timedelta(days=days)).isoformat(timespec="seconds")
        rows = await self._db.fetch_all(
            "SELECT source, COUNT(*) AS cnt FROM messages "
            "WHERE timestamp >= ? GROUP BY source ORDER BY cnt DESC LIMIT ?",
            (cutoff, limit),
        )
        return [{"source": str(row["source"]), "count": int(row["cnt"])} for row in rows]

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

    async def list_filtered(
        self,
        *,
        severities: list[str] | None = None,
        source: str | None = None,
        search: str | None = None,
        from_iso: str | None = None,
        to_iso: str | None = None,
        trace_id: str | None = None,
        limit: int = 100,
        offset: int = 0,
        order: str = "desc",
    ) -> list[Message]:
        """Filter-Query. search nutzt FTS5 (Iter 33), wenn vorhanden — sonst LIKE."""
        clauses: list[str] = []
        params: list[object] = []
        if severities:
            placeholders = ",".join("?" * len(severities))
            clauses.append(f"severity IN ({placeholders})")
            params.extend(severities)
        if source:
            if "*" in source:
                clauses.append("source LIKE ?")
                params.append(source.replace("*", "%"))
            else:
                clauses.append("source = ?")
                params.append(source)
        if search:
            # FTS5: rowid-IN-Subquery, Fallback LIKE.
            clauses.append(
                "(id IN (SELECT rowid FROM messages_fts WHERE messages_fts MATCH ?) OR text LIKE ?)"
            )
            params.append(search)
            params.append(f"%{search}%")
        if from_iso:
            clauses.append("timestamp >= ?")
            params.append(from_iso)
        if to_iso:
            clauses.append("timestamp <= ?")
            params.append(to_iso)
        if trace_id:
            clauses.append("trace_id = ?")
            params.append(trace_id)

        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        direction = "DESC" if order.lower() != "asc" else "ASC"
        sql = (
            f"SELECT * FROM messages {where} "
            f"ORDER BY timestamp {direction}, id {direction} LIMIT ? OFFSET ?"
        )
        params.extend([max(0, limit), max(0, offset)])
        rows = await self._db.fetch_all(sql, params)
        return [_row_to_message(row) for row in rows]

    async def count_filtered(
        self,
        *,
        severities: list[str] | None = None,
        source: str | None = None,
        search: str | None = None,
        from_iso: str | None = None,
        to_iso: str | None = None,
    ) -> int:
        clauses: list[str] = []
        params: list[object] = []
        if severities:
            placeholders = ",".join("?" * len(severities))
            clauses.append(f"severity IN ({placeholders})")
            params.extend(severities)
        if source:
            if "*" in source:
                clauses.append("source LIKE ?")
                params.append(source.replace("*", "%"))
            else:
                clauses.append("source = ?")
                params.append(source)
        if search:
            clauses.append("text LIKE ?")
            params.append(f"%{search}%")
        if from_iso:
            clauses.append("timestamp >= ?")
            params.append(from_iso)
        if to_iso:
            clauses.append("timestamp <= ?")
            params.append(to_iso)
        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        row = await self._db.fetch_one(f"SELECT COUNT(*) AS cnt FROM messages {where}", params)
        return int(row["cnt"]) if row is not None else 0

    async def distinct_sources(self) -> list[str]:
        rows = await self._db.fetch_all("SELECT DISTINCT source FROM messages ORDER BY source ASC")
        return [str(row["source"]) for row in rows]

    async def stats_severity_last_24h(self) -> dict[str, int]:
        from datetime import UTC, datetime, timedelta  # noqa: PLC0415

        cutoff = (datetime.now(UTC) - timedelta(hours=24)).isoformat(timespec="seconds")
        rows = await self._db.fetch_all(
            "SELECT severity, COUNT(*) AS cnt FROM messages WHERE timestamp >= ? GROUP BY severity",
            (cutoff,),
        )
        counts = {row["severity"]: int(row["cnt"]) for row in rows}
        for sev in ("debug", "info", "warning", "error"):
            counts.setdefault(sev, 0)
        return counts

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
    timestamp_str: str = row["timestamp"]  # type: ignore[index]
    metadata_str: str | None = row["metadata"]  # type: ignore[index]
    msg = Message(
        id=int(row["id"]),  # type: ignore[index]
        timestamp=datetime.fromisoformat(timestamp_str).astimezone(UTC),
        severity=Severity(row["severity"]),  # type: ignore[index]
        source=row["source"],  # type: ignore[index]
        text=row["text"],  # type: ignore[index]
        metadata=json.loads(metadata_str) if metadata_str else None,
        webhook_id=row["webhook_id"],  # type: ignore[index]
    )
    return msg
