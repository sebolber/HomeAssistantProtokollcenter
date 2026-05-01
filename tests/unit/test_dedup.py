"""Tests fuer Fingerprint und Aggregation."""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.processing.deduplication import (
    compute_fingerprint,
    normalise_text,
)
from custom_components.messagehub.storage import (
    Database,
    Message,
    MessageRepository,
    MigrationRunner,
    Severity,
)


def test_normalise_replaces_numbers_uuids_ips() -> None:
    text = "Telegramm 1234 von 192.168.1.10 mit ID 11111111-2222-3333-4444-555555555555"
    out = normalise_text(text)
    assert "N" in out
    assert "IP" in out
    assert "UUID" in out
    assert "1234" not in out
    assert "192.168.1.10" not in out


def test_fingerprint_stable_across_numeric_variants() -> None:
    fp1 = compute_fingerprint("knx-bus", "warning", "Telegramm 1234 verloren")
    fp2 = compute_fingerprint("knx-bus", "warning", "Telegramm 5678 verloren")
    assert fp1 == fp2


def test_fingerprint_distinct_for_different_sources() -> None:
    fp1 = compute_fingerprint("a", "warning", "x")
    fp2 = compute_fingerprint("b", "warning", "x")
    assert fp1 != fp2


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
async def test_aggregation_increments_existing(repo: MessageRepository) -> None:
    m = Message(severity=Severity.WARNING, source="x", text="Telegramm 1 lost")
    id1, was_aggregated_1 = await repo.insert_or_aggregate(m, window_minutes=10)
    assert was_aggregated_1 is False

    m2 = Message(severity=Severity.WARNING, source="x", text="Telegramm 999 lost")
    id2, was_aggregated_2 = await repo.insert_or_aggregate(m2, window_minutes=10)
    assert was_aggregated_2 is True
    assert id1 == id2

    rows = await repo._db.fetch_all("SELECT id, count FROM messages")
    assert len(rows) == 1
    assert int(rows[0]["count"]) == 2


@pytest.mark.asyncio
async def test_resolved_message_does_not_aggregate(repo: MessageRepository) -> None:
    m = Message(severity=Severity.WARNING, source="x", text="event 1")
    id1, _ = await repo.insert_or_aggregate(m)
    await repo.set_status(id1, "resolved")

    m2 = Message(severity=Severity.WARNING, source="x", text="event 2")
    id2, was_aggregated = await repo.insert_or_aggregate(m2)
    assert was_aggregated is False
    assert id1 != id2


@pytest.mark.asyncio
async def test_status_transitions(repo: MessageRepository) -> None:
    m = Message(severity=Severity.ERROR, source="x", text="x")
    mid = await repo.insert(m)
    assert await repo.set_status(mid, "acknowledged") is True
    assert await repo.set_status(mid, "resolved") is True


@pytest.mark.asyncio
async def test_count_unacknowledged_errors(repo: MessageRepository) -> None:
    e1 = await repo.insert(Message(severity=Severity.ERROR, source="x", text="a"))
    await repo.insert(Message(severity=Severity.ERROR, source="x", text="b"))
    await repo.insert(Message(severity=Severity.INFO, source="x", text="c"))

    assert await repo.count_unacknowledged_errors() == 2

    await repo.set_status(e1, "resolved")
    assert await repo.count_unacknowledged_errors() == 1
