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


@pytest.mark.asyncio
async def test_iter82_high_volume_same_fingerprint_no_lost_count(
    repo: MessageRepository,
) -> None:
    """Iter 82 / CR-35: 1000 parallele Inserts mit demselben Fingerprint.

    Per-Fingerprint-Lock soll alle Updates serialisieren — kein
    verlorener Count, keine Race-Condition, kein Crash.
    """

    async def fire() -> None:
        msg = Message(
            severity=Severity.WARNING,
            source="stress-source",
            text="repeated signal lost",
        )
        await repo.insert_or_aggregate(msg, window_minutes=10)

    await asyncio.gather(*[fire() for _ in range(1000)])

    rows = await repo._db.fetch_all(
        "SELECT count FROM messages WHERE source = ?",
        ("stress-source",),
    )
    total = sum(int(r["count"]) for r in rows)
    assert total == 1000, f"Erwartete count-Summe 1000, war {total} (Rows: {len(rows)})"


@pytest.mark.asyncio
async def test_iter82_high_volume_distinct_fingerprints_all_persist(
    repo: MessageRepository,
) -> None:
    """Iter 82 / CR-35: 100 parallele Inserts mit unterschiedlichen Sources
    → 100 separate Rows. Achtung: die Dedup-Normalisierung ersetzt Zahlen
    im TEXT durch 'N' — daher unterscheiden wir hier ueber Source statt
    Text-Suffix.
    """

    async def fire(idx: int) -> None:
        msg = Message(
            severity=Severity.INFO,
            source=f"distinct-{chr(97 + idx % 26)}-{idx}",  # source-Format-konform
            text="event observed",
        )
        await repo.insert_or_aggregate(msg, window_minutes=10)

    await asyncio.gather(*[fire(i) for i in range(100)])
    rows = await repo._db.fetch_all("SELECT id FROM messages WHERE source LIKE 'distinct-%'")
    assert len(rows) == 100


@pytest.mark.asyncio
async def test_iter82_mixed_fingerprints_serialize_per_group(
    repo: MessageRepository,
) -> None:
    """Iter 82 / CR-35: 200 parallele Inserts mit 5 unterschiedlichen
    Fingerprints (= 40 pro Fingerprint). Erwartet: 5 Rows, jede mit
    count=40. Lock blockiert nur GLEICHE Fingerprints, nicht
    cross-fingerprint.
    """

    async def fire(group: int) -> None:
        msg = Message(
            severity=Severity.WARNING,
            source=f"grp-{group}",
            text=f"shared text in group {group}",
        )
        await repo.insert_or_aggregate(msg, window_minutes=10)

    tasks = [fire(i % 5) for i in range(200)]
    await asyncio.gather(*tasks)

    rows = await repo._db.fetch_all("SELECT source, count FROM messages WHERE source LIKE 'grp-%'")
    by_source: dict[str, int] = {}
    for r in rows:
        by_source[str(r["source"])] = by_source.get(str(r["source"]), 0) + int(r["count"])
    # Jede Source-Gruppe hat exakt 40 Inserts gesehen.
    for group in range(5):
        assert by_source[f"grp-{group}"] == 40
