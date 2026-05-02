"""Iter 56: KnxAddressRepository.bulk_patch — Multi-Address-Update.

Wendet ein Patch (Subset von log_enabled / log_severity / severity_on_*
auf eine Liste von GAs an. Felder, die nicht im Patch sind, bleiben
unveraendert.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_repo import (
    KnxAddress,
    KnxAddressRepository,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.migrations import MigrationRunner


@pytest.fixture
async def db(tmp_path: Path) -> Database:
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


async def _seed(repo: KnxAddressRepository, *gas: str) -> None:
    for ga in gas:
        await repo.upsert(
            KnxAddress(
                address=ga,
                label=f"Label {ga}",
                log_enabled=False,
                log_severity="info",
            )
        )


class TestBulkPatch:
    @pytest.mark.asyncio
    async def test_empty_address_list_returns_zero(self, db: Database) -> None:
        repo = KnxAddressRepository(db)
        assert await repo.bulk_patch([], log_enabled=True) == 0

    @pytest.mark.asyncio
    async def test_no_patch_fields_returns_zero(self, db: Database) -> None:
        repo = KnxAddressRepository(db)
        await _seed(repo, "1/0/1", "1/0/2")
        # Kein Patch-Feld -> kein DB-Hit, kein Update
        assert await repo.bulk_patch(["1/0/1"]) == 0

    @pytest.mark.asyncio
    async def test_set_log_enabled_true_for_multiple(self, db: Database) -> None:
        repo = KnxAddressRepository(db)
        await _seed(repo, "1/0/1", "1/0/2", "1/0/3")
        updated = await repo.bulk_patch(["1/0/1", "1/0/2"], log_enabled=True)
        assert updated == 2
        items = {it.address: it for it in await repo.list_all()}
        assert items["1/0/1"].log_enabled is True
        assert items["1/0/2"].log_enabled is True
        assert items["1/0/3"].log_enabled is False  # nicht in der Liste

    @pytest.mark.asyncio
    async def test_set_severity_only(self, db: Database) -> None:
        repo = KnxAddressRepository(db)
        await _seed(repo, "1/0/1", "1/0/2")
        # log_enabled bleibt unveraendert; nur Severity aendert sich
        await repo.bulk_patch(["1/0/1"], log_severity="error")
        items = {it.address: it for it in await repo.list_all()}
        assert items["1/0/1"].log_severity == "error"
        assert items["1/0/1"].log_enabled is False  # unveraendert
        assert items["1/0/2"].log_severity == "info"  # nicht in der Liste

    @pytest.mark.asyncio
    async def test_invalid_address_aborts_before_db_write(self, db: Database) -> None:
        repo = KnxAddressRepository(db)
        await _seed(repo, "1/0/1")
        with pytest.raises(ValueError):
            await repo.bulk_patch(["1/0/1", "INVALID-GA"], log_enabled=True)
        # 1/0/1 darf NICHT bereits aktualisiert sein, weil wir vor dem
        # DB-Write validieren.
        items = {it.address: it for it in await repo.list_all()}
        assert items["1/0/1"].log_enabled is False

    @pytest.mark.asyncio
    async def test_invalid_severity_aborts(self, db: Database) -> None:
        repo = KnxAddressRepository(db)
        await _seed(repo, "1/0/1")
        with pytest.raises(ValueError):
            await repo.bulk_patch(["1/0/1"], log_severity="not-a-severity")

    @pytest.mark.asyncio
    async def test_set_severity_on_true_to_null(self, db: Database) -> None:
        # Setzen auf NULL muss explizit moeglich sein, weil das ein
        # gueltiger Wert ist. Sentinel-Logik: None heisst "auf NULL setzen",
        # _SENTINEL_KEEP heisst "unveraendert lassen".
        repo = KnxAddressRepository(db)
        await repo.upsert(
            KnxAddress(
                address="1/0/1",
                label="X",
                log_severity="auto",
                severity_on_true="error",
                severity_on_false="info",
            )
        )
        await repo.bulk_patch(["1/0/1"], severity_on_true=None)
        items = {it.address: it for it in await repo.list_all()}
        assert items["1/0/1"].severity_on_true is None
        # severity_on_false bleibt, weil nicht im Patch
        assert items["1/0/1"].severity_on_false == "info"
