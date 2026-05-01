"""Iter 40: Health-Score 0..100 pro Source.

Formel: 100 - (severity_weight * frequency * recency_decay).
Severity-Weights:
    error   = 8
    warning = 3
    info    = 1
    debug   = 0

frequency: COUNT in Window / window_minutes (msgs/min)
recency_decay: 1.0 fuer juengste Nachricht in window, 0 fuer aelteste.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..storage import Database


SEVERITY_WEIGHT = {"error": 8, "warning": 3, "info": 1, "debug": 0}


async def compute_health_score(
    db: Database, source: str, *, window_minutes: int = 60, now: datetime | None = None
) -> int:
    """Liefert Health-Score (0..100) fuer eine Source."""
    now = now or datetime.now(UTC)
    cutoff = (now - timedelta(minutes=window_minutes)).isoformat(timespec="seconds")
    rows = await db.fetch_all(
        "SELECT severity, COUNT(*) AS cnt FROM messages "
        "WHERE source = ? AND timestamp >= ? GROUP BY severity",
        (source, cutoff),
    )
    if not rows:
        return 100

    total_penalty = 0.0
    for row in rows:
        sev = str(row["severity"])
        cnt = int(row["cnt"])
        weight = SEVERITY_WEIGHT.get(sev, 0)
        # Frequenz in Nachrichten / Minute, mit cap.
        freq = cnt / max(window_minutes, 1)
        total_penalty += weight * freq

    score = round(max(0.0, 100.0 - total_penalty * 5.0))
    return min(100, max(0, score))
