"""Iter 32: Severity-Eskalation per Pattern."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..storage import Database


@dataclass(slots=True)
class EscalationRule:
    id: int | None
    source_pattern: str  # exakt oder LIKE-Pattern (mit %)
    severity: str  # triggernde Severity
    threshold_count: int
    window_seconds: int
    cooldown_seconds: int = 600
    target_severity: str = "error"
    last_fired_at: datetime | None = None
    enabled: bool = True


class EscalationEngine:
    """Wertet Regeln gegen die Messages-Tabelle aus."""

    def __init__(self, db: Database) -> None:
        self._db = db

    async def evaluate(self, rule: EscalationRule, *, now: datetime | None = None) -> bool:
        """Liefert True, wenn die Regel feuern sollte (und Cooldown vorbei ist)."""
        if not rule.enabled:
            return False
        now = now or datetime.now(UTC)
        if rule.last_fired_at:
            cooldown_until = rule.last_fired_at + timedelta(seconds=rule.cooldown_seconds)
            if now < cooldown_until:
                return False

        cutoff = (now - timedelta(seconds=rule.window_seconds)).isoformat(timespec="seconds")
        op = "LIKE" if "%" in rule.source_pattern else "="
        row = await self._db.fetch_one(
            f"SELECT COUNT(*) AS cnt FROM messages "
            f"WHERE source {op} ? AND severity = ? AND timestamp >= ? "
            f"AND source != 'messagehub.escalation'",
            (rule.source_pattern, rule.severity, cutoff),
        )
        cnt = int(row["cnt"]) if row is not None else 0
        return cnt >= rule.threshold_count
