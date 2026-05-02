"""Tests fuer MessageRepository (CRUD)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
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
    """Liefert ein offenes Repository auf einer frischen DB."""
    db = Database(tmp_path / "messages.db")
    await db.open()
    await MigrationRunner(db).run()
    try:
        yield MessageRepository(db)
    finally:
        await db.close()


def _msg(**overrides: object) -> Message:
    """Helper: minimal valide Message mit Override-Optionen."""
    defaults: dict[str, object] = {
        "severity": Severity.INFO,
        "source": "test.source",
        "text": "hello world",
    }
    defaults.update(overrides)
    return Message(**defaults)  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_insert_message_returns_id(repo: MessageRepository) -> None:
    """insert() liefert eine numerische ID > 0 und setzt sie auf der Message."""
    msg = _msg()
    new_id = await repo.insert(msg)

    assert new_id > 0
    assert msg.id == new_id


@pytest.mark.asyncio
async def test_insert_persists_all_fields(repo: MessageRepository) -> None:
    """get_by_id() liefert die persistierten Felder identisch zurueck."""
    original = _msg(
        severity=Severity.ERROR,
        source="pihole",
        text="DNS unreachable",
        metadata={"host": "pi.hole", "code": 42},
        webhook_id="hook-12345",
    )
    new_id = await repo.insert(original)

    loaded = await repo.get_by_id(new_id)

    assert loaded is not None
    assert loaded.id == new_id
    assert loaded.severity is Severity.ERROR
    assert loaded.source == "pihole"
    assert loaded.text == "DNS unreachable"
    assert loaded.metadata == {"host": "pi.hole", "code": 42}
    assert loaded.webhook_id == "hook-12345"
    assert loaded.timestamp.tzinfo is UTC


@pytest.mark.asyncio
async def test_get_by_id_returns_none_when_missing(repo: MessageRepository) -> None:
    assert await repo.get_by_id(99999) is None


@pytest.mark.asyncio
async def test_delete_by_id_returns_true_when_deleted(repo: MessageRepository) -> None:
    new_id = await repo.insert(_msg())
    assert await repo.delete_by_id(new_id) is True
    assert await repo.get_by_id(new_id) is None


@pytest.mark.asyncio
async def test_delete_by_id_returns_false_when_missing(repo: MessageRepository) -> None:
    assert await repo.delete_by_id(99999) is False


@pytest.mark.asyncio
async def test_list_recent_orders_by_timestamp_desc(repo: MessageRepository) -> None:
    base = datetime(2026, 5, 1, 12, 0, 0, tzinfo=UTC)
    ids: list[int] = []
    for i in range(5):
        msg = _msg(text=f"#{i}", timestamp=base + timedelta(minutes=i))
        ids.append(await repo.insert(msg))

    recent = await repo.list_recent(limit=10)

    # Erwarte: juengstes zuerst -> ids[4], ids[3], ids[2], ids[1], ids[0]
    assert [m.id for m in recent] == list(reversed(ids))


@pytest.mark.asyncio
async def test_list_recent_respects_limit(repo: MessageRepository) -> None:
    for i in range(7):
        await repo.insert(_msg(text=f"#{i}"))

    assert len(await repo.list_recent(limit=3)) == 3
    assert len(await repo.list_recent(limit=100)) == 7
    assert await repo.list_recent(limit=0) == []
    assert await repo.list_recent(limit=-1) == []


@pytest.mark.asyncio
async def test_count_total_after_inserts(repo: MessageRepository) -> None:
    assert await repo.count_total() == 0
    for _ in range(3):
        await repo.insert(_msg())
    assert await repo.count_total() == 3


@pytest.mark.asyncio
async def test_metadata_roundtrip_with_unicode(repo: MessageRepository) -> None:
    msg = _msg(metadata={"name": "Wohnzimmer-Lampe", "ä": "ö"})
    new_id = await repo.insert(msg)

    loaded = await repo.get_by_id(new_id)

    assert loaded is not None
    assert loaded.metadata == {"name": "Wohnzimmer-Lampe", "ä": "ö"}


@pytest.mark.asyncio
async def test_repository_is_sql_injection_safe(repo: MessageRepository) -> None:
    """SQL-Injection-Versuche im Text werden als reine Daten persistiert."""
    payload = "'; DROP TABLE messages; --"
    new_id = await repo.insert(_msg(text=payload))

    loaded = await repo.get_by_id(new_id)
    assert loaded is not None
    assert loaded.text == payload
    # Tabelle existiert noch:
    assert await repo.count_total() == 1


@pytest.mark.asyncio
async def test_set_severity_updates_existing_message(repo: MessageRepository) -> None:
    new_id = await repo.insert(_msg(severity=Severity.INFO))

    ok = await repo.set_severity(new_id, "warning")

    assert ok is True
    loaded = await repo.get_by_id(new_id)
    assert loaded is not None
    assert loaded.severity == Severity.WARNING


@pytest.mark.asyncio
async def test_set_severity_returns_false_for_unknown_id(repo: MessageRepository) -> None:
    assert await repo.set_severity(99_999, "error") is False


@pytest.mark.asyncio
async def test_set_severity_rejects_invalid_value(repo: MessageRepository) -> None:
    new_id = await repo.insert(_msg())
    with pytest.raises(ValueError, match="invalid severity"):
        await repo.set_severity(new_id, "fatal")


@pytest.mark.asyncio
async def test_count_by_severity_all_time(repo: MessageRepository) -> None:
    """count_by_severity zaehlt unabhaengig vom Zeitfenster alle Eintraege."""
    for sev in (Severity.ERROR, Severity.ERROR, Severity.WARNING, Severity.INFO):
        await repo.insert(_msg(severity=sev))

    assert await repo.count_by_severity("error") == 2
    assert await repo.count_by_severity("warning") == 1
    assert await repo.count_by_severity("info") == 1
    assert await repo.count_by_severity("debug") == 0


@pytest.mark.asyncio
async def test_per_fingerprint_locks_parallelisieren_unterschiedliche_sources(
    repo: MessageRepository,
) -> None:
    """Inserts auf zwei verschiedenen Fingerprints muessen NICHT serialisiert
    werden — nur Aggregate auf identischen Fingerprint blockieren einander.

    Wir pruefen das indirekt: nach 10 parallelen Inserts auf 5 unterschiedlichen
    Sources liegt der Lock-dict-Inhalt korrekt vor (5 verschiedene Fingerprints,
    nicht ein globaler Lock fuer alle Inserts)."""
    sources = ["src.a", "src.b", "src.c", "src.d", "src.e"]
    # Pro Source eine eindeutige Message — wir wollen pro Source genau einen
    # Fingerprint-Lock sehen (Source + Severity + normalisierter-Text).
    inserts = [_msg(source=src, text="hallo welt") for src in sources]

    import asyncio  # noqa: PLC0415

    await asyncio.gather(*[repo.insert_or_aggregate(m, window_minutes=10) for m in inserts])

    # Nach den Inserts sollten 5 verschiedene Fingerprint-Locks existieren
    # (einer pro unique source — gleiche severity, gleicher Text).
    assert len(repo._fingerprint_locks) == 5


@pytest.mark.asyncio
async def test_count_since_aggregates_all_severities(repo: MessageRepository) -> None:
    """count_since zaehlt severity-uebergreifend ab dem Cutoff."""
    base = datetime(2026, 5, 1, 12, 0, 0, tzinfo=UTC)
    # 2 alte (vor dem Cutoff) + 3 neue
    for offset in (-120, -60, 5, 10, 30):
        await repo.insert(
            _msg(severity=Severity.INFO, timestamp=base + timedelta(minutes=offset))
        )

    cutoff = base.isoformat(timespec="seconds")
    assert await repo.count_since(cutoff) == 3

    cutoff_old = (base - timedelta(hours=3)).isoformat(timespec="seconds")
    assert await repo.count_since(cutoff_old) == 5

    cutoff_future = (base + timedelta(hours=3)).isoformat(timespec="seconds")
    assert await repo.count_since(cutoff_future) == 0
