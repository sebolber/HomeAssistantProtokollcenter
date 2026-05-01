"""Iter 46: Wochenreport-Generator (Markdown)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..storage import Database


async def generate_weekly_report(db: Database, *, now: datetime | None = None) -> str:
    """Liefert Markdown-Report fuer die letzten 7 Tage."""
    now = now or datetime.now(UTC)
    cutoff = (now - timedelta(days=7)).isoformat(timespec="seconds")

    severity_rows = await db.fetch_all(
        "SELECT severity, COUNT(*) AS cnt FROM messages WHERE timestamp >= ? GROUP BY severity",
        (cutoff,),
    )
    counts = {row["severity"]: int(row["cnt"]) for row in severity_rows}

    top_rows = await db.fetch_all(
        "SELECT source, COUNT(*) AS cnt FROM messages "
        "WHERE timestamp >= ? GROUP BY source ORDER BY cnt DESC LIMIT 5",
        (cutoff,),
    )

    mttr_rows = await db.fetch_all(
        "SELECT AVG((julianday(last_seen) - julianday(first_seen)) * 86400) AS mttr_seconds "
        "FROM messages WHERE timestamp >= ? AND status = 'resolved' AND severity = 'error'",
        (cutoff,),
    )
    mttr_seconds = (
        float(mttr_rows[0]["mttr_seconds"])
        if mttr_rows and mttr_rows[0]["mttr_seconds"] is not None
        else 0.0
    )

    lines = [
        f"# Message Hub — Wochenreport ({now.date().isoformat()})",
        "",
        "## Counts pro Severity",
        f"- Errors: {counts.get('error', 0)}",
        f"- Warnings: {counts.get('warning', 0)}",
        f"- Info: {counts.get('info', 0)}",
        f"- Debug: {counts.get('debug', 0)}",
        "",
        "## Top-5 Quellen",
    ]
    for row in top_rows:
        lines.append(f"- {row['source']}: {int(row['cnt'])}")
    if not top_rows:
        lines.append("- (keine Aktivitaet)")
    lines.append("")
    lines.append(f"## MTTR (Errors)\n{mttr_seconds / 60:.1f} Minuten")
    return "\n".join(lines)
