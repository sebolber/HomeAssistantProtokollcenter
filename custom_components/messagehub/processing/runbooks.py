"""Iter 43: Runbook-Lookup pro Source/Fingerprint.

Spezifische Eintraege (mit fingerprint) ueberschreiben generische
(nur source-pattern). LIKE-Patterns mit `%` werden unterstuetzt.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import aiosqlite

    from ..storage import Database


@dataclass(slots=True)
class Runbook:
    id: int | None
    source_pattern: str
    fingerprint: str | None
    title: str
    markdown: str


class RunbookRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    async def add(self, rb: Runbook) -> int:
        from datetime import UTC, datetime  # noqa: PLC0415

        cursor = await self._db.connection.execute(
            "INSERT INTO runbooks (source_pattern, fingerprint, title, markdown, created_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (
                rb.source_pattern,
                rb.fingerprint,
                rb.title,
                rb.markdown,
                datetime.now(UTC).isoformat(timespec="seconds"),
            ),
        )
        await self._db.connection.commit()
        new_id = cursor.lastrowid or 0
        await cursor.close()
        rb.id = new_id
        return new_id

    async def find_for(self, source: str, fingerprint: str | None) -> Runbook | None:
        # 1. exakte fingerprint-Match
        if fingerprint:
            row = await self._db.fetch_one(
                "SELECT * FROM runbooks WHERE fingerprint = ? LIMIT 1",
                (fingerprint,),
            )
            if row is not None:
                return _row_to_runbook(row)

        # 2. source-Pattern (exakt oder LIKE) — generisch
        rows = await self._db.fetch_all(
            "SELECT * FROM runbooks WHERE fingerprint IS NULL ORDER BY id DESC"
        )
        for row in rows:
            pat = str(row["source_pattern"])
            if pat == source:
                return _row_to_runbook(row)
            if "%" in pat:
                # SQL LIKE -> Python: % -> .*
                import re  # noqa: PLC0415

                regex = re.escape(pat).replace("%", ".*")
                if re.fullmatch(regex, source):
                    return _row_to_runbook(row)
        return None


def _row_to_runbook(row: aiosqlite.Row) -> Runbook:
    # Sonar `python:S5864`: Flow-Analysis sieht `aiosqlite.Row.__getitem__`
    # nicht (TYPE_CHECKING-Import). `dict(row)`-Materialisierung umgeht das.
    d: dict[str, Any] = dict(row)
    return Runbook(
        id=int(d["id"]),
        source_pattern=str(d["source_pattern"]),
        fingerprint=d["fingerprint"],
        title=str(d["title"]),
        markdown=str(d["markdown"]),
    )
