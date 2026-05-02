"""Repository fuer MQTT-Topic-Subscriptions (Iter 37).

Pro Eintrag: topic_pattern, source, severity, optional template fuer text.
Wildcards `+` und `#` werden via mqtt-Subscribe direkt durch HA aufgeloest.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from ..storage import Database


_VALID_SEVS = {"debug", "info", "warning", "error"}


@dataclass(slots=True)
class MqttTopic:
    id: int | None
    topic_pattern: str
    source: str
    severity: str = "info"
    enabled: bool = True


class MqttTopicRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    @staticmethod
    def _validate(item: MqttTopic) -> None:
        if not item.topic_pattern or "/" not in item.topic_pattern:
            raise ValueError("topic_pattern must contain at least one '/'")
        if item.severity not in _VALID_SEVS:
            raise ValueError(f"invalid severity {item.severity!r}")
        if not item.source or not item.source.strip():
            raise ValueError("source must not be empty")

    async def add(self, item: MqttTopic) -> int:
        self._validate(item)
        cursor = await self._db.connection.execute(
            "INSERT INTO mqtt_topics (topic_pattern, source, severity, enabled, created_at) "
            "VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(topic_pattern) DO UPDATE SET "
            "source = excluded.source, severity = excluded.severity, "
            "enabled = excluded.enabled",
            (
                item.topic_pattern,
                item.source.strip(),
                item.severity,
                1 if item.enabled else 0,
                datetime.now(UTC).isoformat(timespec="seconds"),
            ),
        )
        await self._db.connection.commit()
        new_id = cursor.lastrowid or 0
        await cursor.close()
        item.id = int(new_id)
        return int(new_id)

    async def update(self, item: MqttTopic) -> None:
        if item.id is None:
            raise ValueError("id required")
        self._validate(item)
        await self._db.execute(
            "UPDATE mqtt_topics SET topic_pattern = ?, source = ?, severity = ?, enabled = ? "
            "WHERE id = ?",
            (
                item.topic_pattern,
                item.source.strip(),
                item.severity,
                1 if item.enabled else 0,
                item.id,
            ),
        )

    async def delete(self, topic_id: int) -> bool:
        cursor = await self._db.connection.execute(
            "DELETE FROM mqtt_topics WHERE id = ?", (topic_id,)
        )
        await self._db.connection.commit()
        deleted = cursor.rowcount > 0
        await cursor.close()
        return bool(deleted)

    async def list_all(self) -> list[MqttTopic]:
        rows = await self._db.fetch_all("SELECT * FROM mqtt_topics ORDER BY topic_pattern")
        return [_row_to_topic(row) for row in rows]


def _row_to_topic(row: Any) -> MqttTopic:
    return MqttTopic(
        id=int(row["id"]),
        topic_pattern=str(row["topic_pattern"]),
        source=str(row["source"]),
        severity=str(row["severity"]),
        enabled=bool(row["enabled"]),
    )
