"""Iter 8 (knx-findings): API GET / PUT / DELETE /findings/severity-overrides.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.9
Iter 8. Service-Layer
(`list_severity_overrides_response` / `set_severity_override_response`)
gibt der UI eine schmale CRUD-Schnittstelle ueber
`knx_finding_severity_overrides`.

Test-zuerst-Artefakt: `test_severity_override_endpoint_creates_and_updates`.
"""

from __future__ import annotations

import ast
from pathlib import Path

import pytest

from custom_components.messagehub.processing.findings_service import (
    clear_severity_override_response,
    list_severity_overrides_response,
    set_severity_override_response,
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


class TestListEndpoint:
    @pytest.mark.asyncio
    async def test_returns_default_when_no_overrides(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act
        resp = await list_severity_overrides_response(repo)

        # Assert
        # Antwort enthaelt sowohl Defaults (alle bekannten Codes) als
        # auch explizite Overrides — damit kann die UI eine vollstaendige
        # Tabelle "Code | Default | Override" rendern, ohne separates
        # Konstanten-Lookup im Browser.
        assert "items" in resp
        codes = {item["code"] for item in resp["items"]}
        assert "DPT_MISMATCH" in codes
        for item in resp["items"]:
            assert item["default_severity"] in {"debug", "info", "warning", "error"}
            assert item["override_severity"] is None  # noch keine Overrides

    @pytest.mark.asyncio
    async def test_lists_overrides(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await repo.set_severity_override(
            code="DPT_MISMATCH", severity="warning", actor="u"
        )

        # Act
        resp = await list_severity_overrides_response(repo)

        # Assert
        dpt_item = next(i for i in resp["items"] if i["code"] == "DPT_MISMATCH")
        assert dpt_item["default_severity"] == "error"
        assert dpt_item["override_severity"] == "warning"


class TestSetEndpoint:
    @pytest.mark.asyncio
    async def test_severity_override_endpoint_creates_and_updates(
        self, db: Database
    ) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act — Create
        first = await set_severity_override_response(
            repo,
            code="DPT_MISMATCH",
            severity="warning",
            actor="u",
            note="Bei mir ok",
        )

        # Assert — Create
        assert first["code"] == "DPT_MISMATCH"
        assert first["severity"] == "warning"
        rows = await repo.list_severity_overrides()
        assert len(rows) == 1

        # Act — Update auf gleicher Code (idempotent)
        second = await set_severity_override_response(
            repo,
            code="DPT_MISMATCH",
            severity="info",
            actor="u",
        )

        # Assert — Update
        assert second["severity"] == "info"
        rows = await repo.list_severity_overrides()
        assert len(rows) == 1  # immer noch ein Row
        assert rows[0]["severity"] == "info"

    @pytest.mark.asyncio
    async def test_set_validates_severity(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act / Assert
        with pytest.raises(ValueError, match="severity"):
            await set_severity_override_response(
                repo,
                code="DPT_MISMATCH",
                severity="not_a_severity",  # type: ignore[arg-type]
                actor="u",
            )

    @pytest.mark.asyncio
    async def test_set_validates_code_known(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act / Assert
        with pytest.raises(ValueError, match="code"):
            await set_severity_override_response(
                repo,
                code="NOT_A_CODE",
                severity="warning",
                actor="u",
            )

    @pytest.mark.asyncio
    async def test_set_writes_audit_log(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act
        await set_severity_override_response(
            repo, code="DPT_MISMATCH", severity="info", actor="u"
        )

        # Assert
        audit = await db.fetch_all(
            "SELECT * FROM audit_log "
            "WHERE target_type = 'knx_finding_severity_override'"
        )
        assert len(audit) == 1


class TestClearEndpoint:
    @pytest.mark.asyncio
    async def test_clear_removes_override(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await set_severity_override_response(
            repo, code="DPT_MISMATCH", severity="info", actor="u"
        )

        # Act
        resp = await clear_severity_override_response(
            repo, code="DPT_MISMATCH", actor="u"
        )

        # Assert
        assert resp["cleared"] is True
        rows = await repo.list_severity_overrides()
        assert rows == []

    @pytest.mark.asyncio
    async def test_clear_idempotent(self, db: Database) -> None:
        # Arrange — kein Override existiert.
        repo = FindingsRepository(db)

        # Act / Assert — kein Fehler.
        resp = await clear_severity_override_response(
            repo, code="DPT_MISMATCH", actor="u"
        )
        assert resp["cleared"] is True


class TestEndpointRegistered:
    """AST-Check: Severity-Override-Views muessen registriert sein."""

    def _api_dir(self) -> Path:
        return (
            Path(__file__).resolve().parents[2]
            / "custom_components"
            / "messagehub"
            / "api"
        )

    def test_views_in_messages_register(self) -> None:
        src = (self._api_dir() / "messages.py").read_text(encoding="utf-8")
        for name in (
            "FindingsSeverityOverridesView",
            "FindingsSeverityOverrideDetailView",
        ):
            assert name in src, f"{name} fehlt in messages.async_register_views"

    def test_views_have_correct_urls(self) -> None:
        src = (self._api_dir() / "findings.py").read_text(encoding="utf-8")
        tree = ast.parse(src)
        urls: dict[str, str] = {}
        for node in ast.walk(tree):
            if not isinstance(node, ast.ClassDef):
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
        assert (
            urls.get("FindingsSeverityOverridesView")
            == "/api/messagehub/findings/severity-overrides"
        )
        assert (
            urls.get("FindingsSeverityOverrideDetailView")
            == "/api/messagehub/findings/severity-overrides/{code}"
        )
