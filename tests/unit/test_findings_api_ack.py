"""Iter 7 (knx-findings): API POST /findings/ack + DELETE.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.9
Iter 7. Service-Layer (`ack_finding_response` /
`unack_finding_response`) wird hier getestet — der View ist ein
duenner aiohttp-Wrapper darueber.

Test-zuerst-Artefakt: `test_ack_endpoint_persists_and_creates_audit_entry`.
"""

from __future__ import annotations

import ast
from pathlib import Path

import pytest

from custom_components.messagehub.processing.findings_service import (
    ack_finding_response,
    unack_finding_response,
)
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


class TestAckEndpoint:
    @pytest.mark.asyncio
    async def test_ack_endpoint_persists_and_creates_audit_entry(
        self, db: Database
    ) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act
        resp = await ack_finding_response(
            repo,
            ga="1/2/3",
            code="DPT_MISMATCH",
            actor="user_x",
            note="Sammel-GA, bekannt",
            sticky=False,
        )

        # Assert — Persistenz
        rows = await repo.list_acknowledgements()
        assert len(rows) == 1
        assert rows[0]["ga"] == "1/2/3"
        assert rows[0]["finding_code"] == "DPT_MISMATCH"
        # Assert — Audit-Log
        audit = await db.fetch_all(
            "SELECT * FROM audit_log WHERE target_type = 'knx_finding_ack'"
        )
        assert len(audit) == 1
        assert str(audit[0]["actor"]) == "user_x"
        # Assert — Response
        assert resp["acknowledged"] is True
        assert resp["ga"] == "1/2/3"
        assert resp["code"] == "DPT_MISMATCH"

    @pytest.mark.asyncio
    async def test_ack_endpoint_supports_sticky(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act
        await ack_finding_response(
            repo, ga="1/2/3", code="DPT_MISMATCH", actor="u", sticky=True
        )

        # Assert
        row = await db.fetch_one(
            "SELECT expires_at FROM knx_finding_acknowledgements"
        )
        assert row is not None
        assert row["expires_at"] is None

    @pytest.mark.asyncio
    async def test_ack_endpoint_validates_ga_format(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act / Assert — leere GA / falsches Format -> ValueError.
        with pytest.raises(ValueError, match="ga"):
            await ack_finding_response(repo, ga="", code="DPT_MISMATCH", actor="u")

    @pytest.mark.asyncio
    async def test_ack_endpoint_validates_code_known(self, db: Database) -> None:
        # Arrange — Code muss im Default-Severity-Mapping sein, sonst Tippfehler.
        repo = FindingsRepository(db)

        # Act / Assert
        with pytest.raises(ValueError, match="code"):
            await ack_finding_response(
                repo, ga="1/2/3", code="UNKNOWN_CODE", actor="u"
            )


class TestUnackEndpoint:
    @pytest.mark.asyncio
    async def test_unack_endpoint_removes_row_and_audit(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await ack_finding_response(
            repo, ga="1/2/3", code="DPT_MISMATCH", actor="u"
        )

        # Act
        resp = await unack_finding_response(
            repo, ga="1/2/3", code="DPT_MISMATCH", actor="u"
        )

        # Assert
        rows = await repo.list_acknowledgements()
        assert rows == []
        unack_audit = await db.fetch_all(
            "SELECT * FROM audit_log WHERE action = 'unack-finding'"
        )
        assert len(unack_audit) == 1
        assert resp["acknowledged"] is False

    @pytest.mark.asyncio
    async def test_unack_idempotent_for_missing_ack(self, db: Database) -> None:
        # Arrange — kein Ack existiert.
        repo = FindingsRepository(db)

        # Act
        resp = await unack_finding_response(
            repo, ga="1/2/3", code="DPT_MISMATCH", actor="u"
        )

        # Assert — kein Fehler, Audit wird trotzdem geschrieben (siehe Iter 3).
        assert resp["acknowledged"] is False


class TestAckEndpointRegistered:
    """AST-Check: FindingsAckView + FindingsAckDetailView muessen registriert sein."""

    def _api_dir(self) -> Path:
        return (
            Path(__file__).resolve().parents[2]
            / "custom_components"
            / "messagehub"
            / "api"
        )

    def test_ack_views_in_messages_register(self) -> None:
        src = (self._api_dir() / "messages.py").read_text(encoding="utf-8")
        for name in ("FindingsAckView", "FindingsAckDetailView"):
            assert name in src, (
                f"{name} fehlt in messages.async_register_views — Frontend bekommt 404."
            )

    def test_ack_views_have_correct_urls(self) -> None:
        src = (self._api_dir() / "findings.py").read_text(encoding="utf-8")
        tree = ast.parse(src)
        urls: dict[str, str] = {}
        for node in ast.walk(tree):
            if not (isinstance(node, ast.ClassDef) and node.name.startswith("Findings")):
                continue
            for stmt in node.body:
                if (
                    isinstance(stmt, ast.Assign)
                    and len(stmt.targets) == 1
                    and isinstance(stmt.targets[0], ast.Name)
                    and stmt.targets[0].id == "url"
                    and isinstance(stmt.value, ast.Constant)
                ):
                    urls[node.name] = str(stmt.value.value)
        assert urls.get("FindingsAckView") == "/api/messagehub/findings/ack"
        assert (
            urls.get("FindingsAckDetailView")
            == "/api/messagehub/findings/ack/{ga}/{code}"
        )
