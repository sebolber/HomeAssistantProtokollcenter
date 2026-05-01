"""Recurring-Pattern-Mining (v0.3).

Analysiert Fingerprint-Vorkommen und erkennt regelmaessige Wiederholungen
(stuendlich, taeglich, woechentlich). Gibt Liste von erkannten Pattern
zurueck — die werden im Job zu Meta-Nachrichten umgewandelt.
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..storage import Database


_HOURLY_SECONDS = 3600
_DAILY_SECONDS = 86_400
_WEEKLY_SECONDS = 604_800
_TOLERANCE = 0.10
_MIN_OCCURRENCES = 5
_MIN_CONFIDENCE = 0.6


@dataclass(slots=True)
class Pattern:
    fingerprint: str
    source: str
    severity: str
    text_sample: str
    occurrences: int
    period: str  # 'hourly' | 'daily' | 'weekly'
    confidence: float


def _classify_period(median_seconds: float) -> str | None:
    targets = [
        ("hourly", _HOURLY_SECONDS),
        ("daily", _DAILY_SECONDS),
        ("weekly", _WEEKLY_SECONDS),
    ]
    for label, target in targets:
        if abs(median_seconds - target) / target <= _TOLERANCE:
            return label
    return None


def _confidence(intervals: list[float], target_seconds: float) -> float:
    """Anteil der Intervalle, die innerhalb der Toleranz liegen."""
    if not intervals:
        return 0.0
    hits = sum(
        1 for delta in intervals if abs(delta - target_seconds) / target_seconds <= _TOLERANCE
    )
    return hits / len(intervals)


async def detect_patterns(db: Database, *, days: int = 30) -> list[Pattern]:
    """Liefert erkannte Pattern aus den letzten N Tagen."""
    cutoff = (datetime.now(UTC) - timedelta(days=days)).isoformat(timespec="seconds")
    rows = await db.fetch_all(
        "SELECT fingerprint, COUNT(*) AS cnt, MAX(source) AS source, "
        "       MAX(severity) AS severity, MAX(text) AS text_sample "
        "  FROM messages "
        " WHERE timestamp >= ? AND fingerprint IS NOT NULL "
        " GROUP BY fingerprint "
        " HAVING cnt >= ?",
        (cutoff, _MIN_OCCURRENCES),
    )

    patterns: list[Pattern] = []
    for row in rows:
        fp = str(row["fingerprint"])
        ts_rows = await db.fetch_all(
            "SELECT timestamp FROM messages "
            "WHERE fingerprint = ? AND timestamp >= ? "
            "ORDER BY timestamp ASC",
            (fp, cutoff),
        )
        timestamps = [datetime.fromisoformat(str(r["timestamp"])).timestamp() for r in ts_rows]
        if len(timestamps) < _MIN_OCCURRENCES:
            continue
        intervals = [timestamps[i + 1] - timestamps[i] for i in range(len(timestamps) - 1)]
        if not intervals:
            continue
        median = statistics.median(intervals)
        period = _classify_period(median)
        if period is None:
            continue
        target = {
            "hourly": _HOURLY_SECONDS,
            "daily": _DAILY_SECONDS,
            "weekly": _WEEKLY_SECONDS,
        }[period]
        conf = _confidence(intervals, target)
        if conf < _MIN_CONFIDENCE:
            continue
        patterns.append(
            Pattern(
                fingerprint=fp,
                source=str(row["source"]),
                severity=str(row["severity"]),
                text_sample=str(row["text_sample"])[:200],
                occurrences=int(row["cnt"]),
                period=period,
                confidence=round(conf, 2),
            )
        )
    return patterns
