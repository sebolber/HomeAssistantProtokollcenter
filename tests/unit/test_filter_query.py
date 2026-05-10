"""Tests fuer MessageRepository.list_filtered / count_filtered / distinct_sources."""

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
    db = Database(tmp_path / "m.db")
    await db.open()
    await MigrationRunner(db).run()
    r = MessageRepository(db)
    base = datetime(2026, 5, 1, 12, 0, 0, tzinfo=UTC)
    for i, sev in enumerate([Severity.INFO, Severity.WARNING, Severity.ERROR, Severity.ERROR]):
        await r.insert(
            Message(
                severity=sev,
                source=f"src.{i % 2}",
                text=f"hello {i}",
                timestamp=base + timedelta(minutes=i),
            )
        )
    try:
        yield r
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_filter_by_severity_csv(repo: MessageRepository) -> None:
    items = await repo.list_filtered(severities=["error"], limit=10)
    assert len(items) == 2
    assert all(m.severity is Severity.ERROR for m in items)


@pytest.mark.asyncio
async def test_filter_by_source_exact(repo: MessageRepository) -> None:
    items = await repo.list_filtered(source="src.0", limit=10)
    assert len(items) == 2
    assert all(m.source == "src.0" for m in items)


@pytest.mark.asyncio
async def test_filter_by_search_substring(repo: MessageRepository) -> None:
    items = await repo.list_filtered(search="hello 2", limit=10)
    assert len(items) == 1
    assert items[0].text == "hello 2"


@pytest.mark.asyncio
async def test_search_with_fts5_special_characters_no_syntax_error(
    repo: MessageRepository,
) -> None:
    # Iter 74 / CR-16: User-Input mit FTS5-Sonderzeichen (NEAR, ", *,
    # AND, OR, NOT) hat vorher SQLITE_ERROR: fts5: syntax error
    # geworfen — DoS via 500er und Info-Leak. Jetzt wrappen wir den
    # Input in Anführungszeichen, sodass beliebige Strings sicher als
    # Phrase-Suche durchlaufen.
    queries = [
        '"',  # nackte Anführungszeichen
        'foo"bar',  # eingebettete
        "NEAR(a b)",  # FTS5 NEAR-Operator
        "a OR b",  # boolean
        "col*",  # wildcard
        "AND OR NOT",  # alle Keywords
        "* hello",  # wildcard prefix
        "",  # leerer String wird ignoriert
    ]
    for q in queries:
        # Soll keine Exception werfen; Treffer-Anzahl ist egal,
        # uns geht's um die Robustheit.
        await repo.list_filtered(search=q, limit=10)
        await repo.count_filtered(search=q)


@pytest.mark.asyncio
async def test_filter_pagination(repo: MessageRepository) -> None:
    page1 = await repo.list_filtered(limit=2, offset=0)
    page2 = await repo.list_filtered(limit=2, offset=2)
    assert len(page1) == 2
    assert len(page2) == 2
    assert {m.id for m in page1}.isdisjoint({m.id for m in page2})


@pytest.mark.asyncio
async def test_count_filtered_matches_list(repo: MessageRepository) -> None:
    assert await repo.count_filtered(severities=["error"]) == 2
    assert await repo.count_filtered(source="src.0") == 2
    assert await repo.count_filtered(search="hello") == 4


@pytest.mark.asyncio
async def test_distinct_sources(repo: MessageRepository) -> None:
    sources = await repo.distinct_sources()
    assert sources == ["src.0", "src.1"]


@pytest.mark.asyncio
async def test_hide_knx_read_filters_groupvalueread_telegrams(tmp_path: Path) -> None:
    # Iter 61 / U15: hide_knx_read=True schliesst Eintraege aus, deren text
    # den Marker "(GroupValueRead)" enthaelt. Andere KNX-Telegramme
    # (GroupValueWrite/Response) bleiben sichtbar.
    db = Database(tmp_path / "knx_read.db")
    await db.open()
    await MigrationRunner(db).run()
    repo_local = MessageRepository(db)
    base = datetime(2026, 5, 1, 12, 0, 0, tzinfo=UTC)
    await repo_local.insert(
        Message(
            severity=Severity.INFO,
            source="knx-bus",
            text="R001 Diele - Alarm schalten (GroupValueRead)",
            timestamp=base,
        )
    )
    await repo_local.insert(
        Message(
            severity=Severity.INFO,
            source="knx-bus",
            text="R001 Diele - Alarm schalten = 1",
            timestamp=base + timedelta(seconds=1),
        )
    )
    await repo_local.insert(
        Message(
            severity=Severity.INFO,
            source="knx-bus",
            text="R013 Kellerflur - Alarm schalten = 0 (GroupValueResponse)",
            timestamp=base + timedelta(seconds=2),
        )
    )
    try:
        all_items = await repo_local.list_filtered(limit=10)
        assert len(all_items) == 3

        filtered = await repo_local.list_filtered(hide_knx_read=True, limit=10)
        assert len(filtered) == 2
        assert all("(GroupValueRead)" not in m.text for m in filtered)

        # Response-Telegramme bleiben sichtbar (heisst NICHT GroupValueRead).
        assert any("(GroupValueResponse)" in m.text for m in filtered)

        # count_filtered respektiert den Filter ebenfalls.
        assert await repo_local.count_filtered(hide_knx_read=True) == 2
        assert await repo_local.count_filtered(hide_knx_read=False) == 3
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_stats_severity_last_24h(repo: MessageRepository) -> None:
    stats = await repo.stats_severity_last_24h()
    assert set(stats.keys()) == {"debug", "info", "warning", "error"}
    # Alle 4 Nachrichten sind aus 2026-05-01 — abhaengig von "now" alle aelter
    # als 24h. Wir testen nur die Struktur und dass die Zahlen non-negative sind.
    assert all(v >= 0 for v in stats.values())
