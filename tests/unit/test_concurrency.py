"""v0.3 / Review-Befund #10: parallele Webhook-Hits auf gleichen Fingerprint.

Verifiziert, dass insert_or_aggregate atomar ist — bei N parallelen
Inserts mit demselben Fingerprint darf am Ende genau eine Row mit
count=N entstehen.
"""

from __future__ import annotations

import asyncio
from pathlib import Path

import pytest

from custom_components.messagehub.storage import (
    Database,
    Message,
    MessageRepository,
    MigrationRunner,
    Severity,
)


@pytest.fixture
async def repo(tmp_path: Path):  # type: ignore[no-untyped-def]
    db = Database(tmp_path / "m.db")
    await db.open()
    await MigrationRunner(db).run()
    try:
        yield MessageRepository(db)
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_parallel_inserts_same_fingerprint_aggregate_correctly(
    repo: MessageRepository,
) -> None:
    """20 parallele insert_or_aggregate auf gleicher Source/Severity/Text:
    erwartet entweder genau 1 Row mit count=20, oder mehrere Rows mit
    addiertem count=20."""

    async def fire() -> None:
        msg = Message(severity=Severity.WARNING, source="x", text="signal lost")
        await repo.insert_or_aggregate(msg, window_minutes=10)

    await asyncio.gather(*[fire() for _ in range(20)])

    rows = await repo._db.fetch_all("SELECT count FROM messages")
    total = sum(int(r["count"]) for r in rows)
    assert total == 20, (
        f"Erwartete count-Summe 20, war {total} (Rows: {[int(r['count']) for r in rows]})"
    )


@pytest.mark.asyncio
async def test_parallel_inserts_different_fingerprints(
    repo: MessageRepository,
) -> None:
    """Bei unterschiedlichem Text → verschiedene Fingerprints → alle als
    separate Rows persistiert."""

    async def fire(idx: int) -> None:
        msg = Message(
            severity=Severity.INFO,
            source=f"src.{idx}",
            text=f"event #{idx}",
        )
        await repo.insert_or_aggregate(msg, window_minutes=10)

    await asyncio.gather(*[fire(i) for i in range(15)])
    rows = await repo._db.fetch_all("SELECT id FROM messages")
    assert len(rows) == 15


@pytest.mark.asyncio
async def test_concurrent_aggregation_no_lost_count(repo: MessageRepository) -> None:
    """Stresst die Aggregation: 5 Bursts a 10 parallel mit demselben
    Fingerprint hintereinander."""
    for _ in range(5):

        async def fire() -> None:
            msg = Message(severity=Severity.ERROR, source="src", text="boom")
            await repo.insert_or_aggregate(msg, window_minutes=10)

        await asyncio.gather(*[fire() for _ in range(10)])

    rows = await repo._db.fetch_all("SELECT count FROM messages")
    total = sum(int(r["count"]) for r in rows)
    assert total == 50
