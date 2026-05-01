"""Tests fuer KnxAddressRepository (Iter 48 UI-Variante)."""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_repo import (
    KnxAddress,
    KnxAddressRepository,
    validate_address,
)
from custom_components.messagehub.storage import Database, MigrationRunner


@pytest.fixture
async def repo(tmp_path: Path):  # type: ignore[no-untyped-def]
    db = Database(tmp_path / "m.db")
    await db.open()
    await MigrationRunner(db).run()
    try:
        yield KnxAddressRepository(db)
    finally:
        await db.close()


def test_validate_address_accepts_valid() -> None:
    assert validate_address("1/2/3") == "1/2/3"
    assert validate_address("31/7/255") == "31/7/255"


@pytest.mark.parametrize(
    "addr",
    ["", "1/2", "abc", "1/2/3/4", "1//3", "/1/2"],
)
def test_validate_address_rejects_invalid(addr: str) -> None:
    with pytest.raises(ValueError, match="invalid KNX"):
        validate_address(addr)


@pytest.mark.asyncio
async def test_upsert_and_lookup(repo: KnxAddressRepository) -> None:
    await repo.upsert(KnxAddress(address="1/2/3", label="Wohnzimmer Deckenlicht"))
    assert await repo.lookup("1/2/3") == "Wohnzimmer Deckenlicht"
    assert await repo.lookup("9/9/9") is None


@pytest.mark.asyncio
async def test_upsert_overwrites(repo: KnxAddressRepository) -> None:
    await repo.upsert(KnxAddress(address="1/2/3", label="alt"))
    await repo.upsert(KnxAddress(address="1/2/3", label="neu", dpt="1.001"))
    items = await repo.list_all()
    assert len(items) == 1
    assert items[0].label == "neu"
    assert items[0].dpt == "1.001"


@pytest.mark.asyncio
async def test_delete(repo: KnxAddressRepository) -> None:
    await repo.upsert(KnxAddress(address="1/2/3", label="x"))
    assert await repo.delete("1/2/3") is True
    assert await repo.delete("1/2/3") is False


@pytest.mark.asyncio
async def test_bulk_import_csv(repo: KnxAddressRepository) -> None:
    csv_content = (
        "address,name,type\n"
        "1/0/0,Wohnzimmer Schalter,DPT_1.001\n"
        "1/0/1,Wohnzimmer Dimmer,DPT_5.001\n"
        "invalid/ga/format/extra,foo,DPT_1\n"
    )
    stats = await repo.bulk_import_csv(csv_content)
    assert stats["imported"] == 2
    items = await repo.list_all()
    addresses = {it.address for it in items}
    assert addresses == {"1/0/0", "1/0/1"}


@pytest.mark.asyncio
async def test_upsert_rejects_invalid(repo: KnxAddressRepository) -> None:
    with pytest.raises(ValueError, match="invalid KNX"):
        await repo.upsert(KnxAddress(address="bad", label="x"))
    with pytest.raises(ValueError, match="empty"):
        await repo.upsert(KnxAddress(address="1/2/3", label="  "))
