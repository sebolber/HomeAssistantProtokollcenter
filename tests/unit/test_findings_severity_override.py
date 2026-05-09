"""Iter 4 (knx-findings): Severity-Override pro Finding-Code.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.3.
- Default-Severity ist Eigenschaft der Finding-Definition (`const.py`).
- User-Override pro Code in `knx_finding_severity_overrides` ueberschreibt
  den Default.
- Resolver-Funktion: Default -> Override -> Ack-Suppression.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.const import KNX_FINDING_DEFAULT_SEVERITIES
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


class TestDefaultSeverity:
    def test_default_severities_cover_all_planned_codes(self) -> None:
        # Arrange: alle in §9.3 genannten Codes muessen in der Default-
        # Tabelle stehen (keine "stille" Default-info-Falle).
        expected = {
            "DPT_MISMATCH",
            "MULTI_RESPONDER",
            "READ_NO_RESPONSE",
            "TOGGLE_LOOP",
            "VALUE_OUT_OF_RANGE",
            "RECONNECT_STORM",
            "MULTI_TIME_MASTER",
            "SEND_CYCLE_DRIFT",
            "REPEAT_APPROXIMATION",
            "ORPHAN_GA",
            "STALE_GA",
        }
        # Act
        configured = set(KNX_FINDING_DEFAULT_SEVERITIES)
        # Assert
        missing = expected - configured
        assert not missing, f"Default-Severity fehlt fuer: {missing}"

    def test_dpt_mismatch_default_is_warning(self) -> None:
        # Iter B2: heruntergesetzt von 'error' auf 'warning' wegen
        # False-Positive-Risiko der werte-basierten Inferenz.
        assert KNX_FINDING_DEFAULT_SEVERITIES["DPT_MISMATCH"] == "warning"

    def test_multi_responder_default_is_warning(self) -> None:
        assert KNX_FINDING_DEFAULT_SEVERITIES["MULTI_RESPONDER"] == "warning"

    def test_send_cycle_drift_default_is_info(self) -> None:
        assert KNX_FINDING_DEFAULT_SEVERITIES["SEND_CYCLE_DRIFT"] == "info"


class TestResolveSeverity:
    @pytest.mark.asyncio
    async def test_resolve_returns_default_when_no_override(
        self, db: Database
    ) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act
        sev = await repo.resolve_severity("DPT_MISMATCH")

        # Assert — Iter B2: Default ist 'warning' (siehe Konzept B2).
        assert sev == "warning"

    @pytest.mark.asyncio
    async def test_severity_override_takes_precedence_over_default(
        self, db: Database
    ) -> None:
        # Arrange — DPT_MISMATCH default = "warning" (Iter B2),
        # User stuft auf "error" hoch, weil sein Projekt-DPT eindeutig ist.
        repo = FindingsRepository(db)
        await repo.set_severity_override(
            code="DPT_MISMATCH", severity="error", actor="u", note="ETS sauber"
        )

        # Act
        sev = await repo.resolve_severity("DPT_MISMATCH")

        # Assert
        assert sev == "error"

    @pytest.mark.asyncio
    async def test_resolve_unknown_code_raises(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act / Assert
        with pytest.raises(KeyError):
            await repo.resolve_severity("NEVER_HEARD_OF_IT")


class TestSetClearOverride:
    @pytest.mark.asyncio
    async def test_set_severity_override_persists_row(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act
        await repo.set_severity_override(
            code="DPT_MISMATCH", severity="info", actor="u", note="bei uns Sammel-GA"
        )

        # Assert
        rows = await repo.list_severity_overrides()
        assert len(rows) == 1
        assert rows[0]["finding_code"] == "DPT_MISMATCH"
        assert rows[0]["severity"] == "info"

    @pytest.mark.asyncio
    async def test_set_severity_override_writes_audit_log(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act
        await repo.set_severity_override(
            code="DPT_MISMATCH", severity="info", actor="u"
        )

        # Assert
        audit = await db.fetch_all(
            "SELECT * FROM audit_log "
            "WHERE target_type = 'knx_finding_severity_override'"
        )
        assert len(audit) == 1
        assert "DPT_MISMATCH" in str(audit[0]["target_id"])

    @pytest.mark.asyncio
    async def test_set_severity_override_updates_existing_row(
        self, db: Database
    ) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await repo.set_severity_override(
            code="DPT_MISMATCH", severity="info", actor="u"
        )

        # Act
        await repo.set_severity_override(
            code="DPT_MISMATCH", severity="warning", actor="u2"
        )

        # Assert
        rows = await repo.list_severity_overrides()
        assert len(rows) == 1
        assert rows[0]["severity"] == "warning"

    @pytest.mark.asyncio
    async def test_clear_severity_override_removes_row(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await repo.set_severity_override(
            code="DPT_MISMATCH", severity="info", actor="u"
        )

        # Act
        await repo.clear_severity_override(code="DPT_MISMATCH", actor="u")

        # Assert
        rows = await repo.list_severity_overrides()
        assert len(rows) == 0
        sev = await repo.resolve_severity("DPT_MISMATCH")
        # Iter B2: Default ist 'warning' (siehe Konzept B2).
        assert sev == "warning"

    @pytest.mark.asyncio
    async def test_set_invalid_severity_raises(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act / Assert
        with pytest.raises(ValueError, match="severity"):
            await repo.set_severity_override(
                code="DPT_MISMATCH",
                severity="bogus",  # type: ignore[arg-type]
                actor="u",
            )
