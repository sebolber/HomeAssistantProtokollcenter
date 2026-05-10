"""Iter 11 (knx-findings): dpt_inferred-Persistenz auf knx_group_addresses.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.2.
Auto-Erkenner schreibt drei Felder, der spaetere DPT_MISMATCH-Detector
(Iter 12) liest sie.
"""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_repo import (
    KnxAddress,
    KnxAddressRepository,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.migrations import MigrationRunner


@pytest.fixture
async def db(tmp_path: Path):
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


class TestDptInferredPersistence:
    @pytest.mark.asyncio
    async def test_dpt_inferred_persists_with_confidence(self, db: Database) -> None:
        # Arrange — eine GA mit Soll-DPT.
        repo = KnxAddressRepository(db)
        await repo.upsert(KnxAddress(address="1/2/3", label="Sensor", dpt="9.001"))
        now = datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC).isoformat(timespec="seconds")

        # Act — Auto-Erkenner schreibt sein Ist via Repo-Methode.
        await repo.set_dpt_inferred(
            address="1/2/3",
            dpt_inferred="1.001",
            confidence=0.94,
            at=now,
        )

        # Assert — alle drei Felder lesbar.
        row = await db.fetch_one(
            "SELECT dpt, dpt_inferred, dpt_inferred_confidence, dpt_inferred_at "
            "FROM knx_group_addresses WHERE address = ?",
            ("1/2/3",),
        )
        assert row is not None
        assert row["dpt"] == "9.001"  # Soll bleibt
        assert row["dpt_inferred"] == "1.001"
        assert row["dpt_inferred_confidence"] == 0.94
        assert row["dpt_inferred_at"] == now

    @pytest.mark.asyncio
    async def test_set_dpt_inferred_creates_row_if_missing(self, db: Database) -> None:
        # Arrange — keine GA in der Whitelist.
        repo = KnxAddressRepository(db)

        # Act
        await repo.set_dpt_inferred(
            address="1/2/4",
            dpt_inferred="1.001",
            confidence=0.7,
            at="2026-05-03T08:00:00+00:00",
        )

        # Assert — Row mit Default-Label angelegt; Auto-Erkenner findet GAs
        # auch ausserhalb der Whitelist (knx_raw_telegrams).
        row = await db.fetch_one(
            "SELECT label, dpt_inferred FROM knx_group_addresses WHERE address = ?",
            ("1/2/4",),
        )
        assert row is not None
        assert row["dpt_inferred"] == "1.001"

    @pytest.mark.asyncio
    async def test_set_dpt_inferred_validates_confidence_range(self, db: Database) -> None:
        # Arrange
        repo = KnxAddressRepository(db)

        # Act / Assert — Confidence ausserhalb [0.0, 1.0] -> ValueError.
        with pytest.raises(ValueError, match="confidence"):
            await repo.set_dpt_inferred(
                address="1/2/3",
                dpt_inferred="1.001",
                confidence=1.5,
                at="2026-05-03T08:00:00+00:00",
            )
        with pytest.raises(ValueError, match="confidence"):
            await repo.set_dpt_inferred(
                address="1/2/3",
                dpt_inferred="1.001",
                confidence=-0.1,
                at="2026-05-03T08:00:00+00:00",
            )

    @pytest.mark.asyncio
    async def test_set_dpt_inferred_idempotent_replaces_previous(self, db: Database) -> None:
        # Arrange
        repo = KnxAddressRepository(db)
        await repo.upsert(KnxAddress(address="1/2/3", label="Sensor", dpt="9.001"))
        await repo.set_dpt_inferred(
            address="1/2/3",
            dpt_inferred="1.001",
            confidence=0.5,
            at="2026-05-03T08:00:00+00:00",
        )

        # Act — neue Inferenz mit hoeherer Confidence.
        await repo.set_dpt_inferred(
            address="1/2/3",
            dpt_inferred="1.001",
            confidence=0.95,
            at="2026-05-03T08:30:00+00:00",
        )

        # Assert
        row = await db.fetch_one(
            "SELECT dpt_inferred_confidence, dpt_inferred_at "
            "FROM knx_group_addresses WHERE address = ?",
            ("1/2/3",),
        )
        assert row is not None
        assert row["dpt_inferred_confidence"] == 0.95
        assert row["dpt_inferred_at"] == "2026-05-03T08:30:00+00:00"

    @pytest.mark.asyncio
    async def test_get_dpt_inferred_returns_tuple(self, db: Database) -> None:
        # Arrange
        repo = KnxAddressRepository(db)
        await repo.upsert(KnxAddress(address="1/2/3", label="Sensor", dpt="9.001"))
        await repo.set_dpt_inferred(
            address="1/2/3",
            dpt_inferred="1.001",
            confidence=0.9,
            at="2026-05-03T08:00:00+00:00",
        )

        # Act
        result = await repo.get_dpt_inferred("1/2/3")

        # Assert
        assert result == ("1.001", 0.9, "2026-05-03T08:00:00+00:00")

    @pytest.mark.asyncio
    async def test_get_dpt_inferred_returns_none_when_unset(self, db: Database) -> None:
        # Arrange
        repo = KnxAddressRepository(db)
        await repo.upsert(KnxAddress(address="1/2/3", label="Sensor", dpt="9.001"))

        # Act
        result = await repo.get_dpt_inferred("1/2/3")

        # Assert
        assert result is None
