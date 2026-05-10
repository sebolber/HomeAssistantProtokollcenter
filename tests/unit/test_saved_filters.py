"""Iter 92 / K1: Saved-Filters-Repository."""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.storage import Database, MigrationRunner
from custom_components.messagehub.storage.saved_filters_repo import (
    SavedFilter,
    SavedFiltersRepository,
    saved_filter_to_dict,
)


@pytest.fixture
async def repo(tmp_path: Path):  # type: ignore[no-untyped-def]
    db = Database(tmp_path / "f.db")
    await db.open()
    await MigrationRunner(db).run()
    try:
        yield SavedFiltersRepository(db)
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_list_empty_returns_empty(repo: SavedFiltersRepository) -> None:
    assert await repo.list_by_scope("messages") == []


@pytest.mark.asyncio
async def test_upsert_creates_new_filter(repo: SavedFiltersRepository) -> None:
    item = await repo.upsert(
        name="Errors only",
        scope="messages",
        filters={"severity": ["error"]},
    )
    assert item.id is not None
    assert item.name == "Errors only"
    assert item.scope == "messages"
    assert item.filters == {"severity": ["error"]}


@pytest.mark.asyncio
async def test_upsert_updates_existing_by_unique_scope_name(
    repo: SavedFiltersRepository,
) -> None:
    first = await repo.upsert(name="Tag", scope="messages", filters={"tag": "x"})
    second = await repo.upsert(name="Tag", scope="messages", filters={"tag": "y"})
    # Gleiche ID, aktualisierte Filter.
    assert first.id == second.id
    assert second.filters == {"tag": "y"}
    items = await repo.list_by_scope("messages")
    assert len(items) == 1


@pytest.mark.asyncio
async def test_scopes_are_independent(repo: SavedFiltersRepository) -> None:
    await repo.upsert(name="x", scope="messages", filters={"a": 1})
    await repo.upsert(name="x", scope="knx-stats", filters={"b": 2})
    msgs = await repo.list_by_scope("messages")
    knx = await repo.list_by_scope("knx-stats")
    assert len(msgs) == 1 and msgs[0].filters == {"a": 1}
    assert len(knx) == 1 and knx[0].filters == {"b": 2}


@pytest.mark.asyncio
async def test_invalid_scope_raises(repo: SavedFiltersRepository) -> None:
    with pytest.raises(ValueError):
        await repo.list_by_scope("not-a-scope")
    with pytest.raises(ValueError):
        await repo.upsert(name="x", scope="not-a-scope", filters={})


@pytest.mark.asyncio
async def test_empty_name_rejected(repo: SavedFiltersRepository) -> None:
    with pytest.raises(ValueError):
        await repo.upsert(name="   ", scope="messages", filters={})
    with pytest.raises(ValueError):
        await repo.upsert(name="", scope="messages", filters={})


@pytest.mark.asyncio
async def test_long_name_rejected(repo: SavedFiltersRepository) -> None:
    with pytest.raises(ValueError):
        await repo.upsert(name="x" * 81, scope="messages", filters={})


@pytest.mark.asyncio
async def test_non_dict_filters_rejected(
    repo: SavedFiltersRepository,
) -> None:
    with pytest.raises(ValueError):
        await repo.upsert(
            name="x",
            scope="messages",
            filters=["not", "a", "dict"],  # type: ignore[arg-type]
        )


@pytest.mark.asyncio
async def test_delete_existing_returns_true(
    repo: SavedFiltersRepository,
) -> None:
    item = await repo.upsert(name="x", scope="messages", filters={})
    assert item.id is not None
    assert await repo.delete(item.id) is True
    assert await repo.delete(item.id) is False  # zweites Mal: not found


@pytest.mark.asyncio
async def test_get_by_id(repo: SavedFiltersRepository) -> None:
    item = await repo.upsert(name="x", scope="messages", filters={"a": 1})
    assert item.id is not None
    fetched = await repo.get(item.id)
    assert fetched is not None
    assert fetched.id == item.id
    assert fetched.filters == {"a": 1}


def test_saved_filter_to_dict_serializable() -> None:
    item = SavedFilter(
        id=1,
        name="Test",
        scope="messages",
        filters={"a": 1},
        created_at="2026-05-02T10:00:00",
        updated_at="2026-05-02T10:00:00",
    )
    d = saved_filter_to_dict(item)
    assert d["id"] == 1
    assert d["name"] == "Test"
    assert d["filters"] == {"a": 1}
