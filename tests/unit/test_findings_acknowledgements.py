"""Iter 3 (knx-findings): Finding-Acknowledgements + Auto-Expire.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.4.
- PK `(ga, finding_code)` — Whitelist-Granularitaet pro Code
- Default `expires_at = acknowledged_at + 90 Tage`, NULL = sticky
- Audit-Log-Eintrag bei jedem Ack/Un-Ack
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.const import DEFAULT_KNX_ACK_EXPIRY_DAYS
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.findings_repo import FindingsRepository
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


class TestAcknowledge:
    @pytest.mark.asyncio
    async def test_acknowledge_inserts_ack_row(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act
        await repo.acknowledge(ga="1/2/3", code="DPT_MISMATCH", actor="user_x")

        # Assert
        rows = await repo.list_acknowledgements()
        assert len(rows) == 1
        assert rows[0]["ga"] == "1/2/3"
        assert rows[0]["finding_code"] == "DPT_MISMATCH"

    @pytest.mark.asyncio
    async def test_acknowledge_writes_audit_log_entry(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act
        await repo.acknowledge(ga="1/2/3", code="DPT_MISMATCH", actor="user_x", note="Bekannt")

        # Assert — Audit-Log-Eintrag mit action "ack-finding"
        audit = await db.fetch_all("SELECT * FROM audit_log WHERE target_type = 'knx_finding_ack'")
        assert len(audit) == 1
        assert str(audit[0]["actor"]) == "user_x"
        assert "DPT_MISMATCH" in str(audit[0]["target_id"])

    @pytest.mark.asyncio
    async def test_default_expires_at_is_90_days_from_now(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        before = datetime.now(UTC)

        # Act
        await repo.acknowledge(ga="1/2/3", code="DPT_MISMATCH", actor="user_x")

        # Assert
        row = await db.fetch_one("SELECT expires_at FROM knx_finding_acknowledgements")
        assert row is not None
        assert row["expires_at"] is not None
        expires = datetime.fromisoformat(str(row["expires_at"]))
        delta = expires - before
        # Toleranz +/-1 Tag — Stichprobe zwischen Vor-/Nach-Zeitpunkten.
        assert (
            timedelta(days=DEFAULT_KNX_ACK_EXPIRY_DAYS - 1)
            <= delta
            <= timedelta(days=DEFAULT_KNX_ACK_EXPIRY_DAYS + 1)
        )

    @pytest.mark.asyncio
    async def test_sticky_ack_has_null_expires_at(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act
        await repo.acknowledge(ga="1/2/3", code="DPT_MISMATCH", actor="user_x", sticky=True)

        # Assert
        row = await db.fetch_one("SELECT expires_at FROM knx_finding_acknowledgements")
        assert row is not None
        assert row["expires_at"] is None


class TestUnacknowledge:
    @pytest.mark.asyncio
    async def test_unacknowledge_removes_ack_row_and_writes_audit(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await repo.acknowledge(ga="1/2/3", code="DPT_MISMATCH", actor="u")

        # Act
        await repo.unacknowledge(ga="1/2/3", code="DPT_MISMATCH", actor="u")

        # Assert
        rows = await repo.list_acknowledgements()
        assert len(rows) == 0
        audit_unack = await db.fetch_all("SELECT * FROM audit_log WHERE action = 'unack-finding'")
        assert len(audit_unack) == 1


class TestIsAcknowledged:
    @pytest.mark.asyncio
    async def test_finding_ack_filters_when_expires_at_in_past(self, db: Database) -> None:
        # Arrange — Ack mit expires_at in der Vergangenheit ist nicht mehr aktiv.
        repo = FindingsRepository(db)
        past = datetime.now(UTC) - timedelta(days=1)
        await repo.acknowledge(ga="1/2/3", code="DPT_MISMATCH", actor="u", expires_at=past)

        # Act
        active = await repo.is_acknowledged(ga="1/2/3", code="DPT_MISMATCH")

        # Assert
        assert active is False

    @pytest.mark.asyncio
    async def test_is_acknowledged_returns_true_when_ack_active(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        future = datetime.now(UTC) + timedelta(days=10)
        await repo.acknowledge(ga="1/2/3", code="DPT_MISMATCH", actor="u", expires_at=future)

        # Act
        active = await repo.is_acknowledged(ga="1/2/3", code="DPT_MISMATCH")

        # Assert
        assert active is True

    @pytest.mark.asyncio
    async def test_is_acknowledged_returns_true_for_sticky(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await repo.acknowledge(ga="1/2/3", code="DPT_MISMATCH", actor="u", sticky=True)

        # Act
        active = await repo.is_acknowledged(ga="1/2/3", code="DPT_MISMATCH")

        # Assert
        assert active is True

    @pytest.mark.asyncio
    async def test_is_acknowledged_returns_false_when_no_ack(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act
        active = await repo.is_acknowledged(ga="1/2/3", code="DPT_MISMATCH")

        # Assert
        assert active is False


class TestAckGranularity:
    @pytest.mark.asyncio
    async def test_ack_per_finding_code_not_per_ga(self, db: Database) -> None:
        # Arrange — Ack auf MULTI_RESPONDER fuer 1/2/3 darf DPT_MISMATCH
        # auf derselben GA NICHT stummschalten (siehe §9.4).
        repo = FindingsRepository(db)
        await repo.acknowledge(ga="1/2/3", code="MULTI_RESPONDER", actor="u")

        # Act
        dpt_active = await repo.is_acknowledged(ga="1/2/3", code="DPT_MISMATCH")
        mr_active = await repo.is_acknowledged(ga="1/2/3", code="MULTI_RESPONDER")

        # Assert
        assert dpt_active is False
        assert mr_active is True
