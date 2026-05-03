"""Iter 6 (knx-findings): API GET /findings (Filter + Pagination).

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.9
Iter 6:
- Filter: severity, code, ga, source
- Pagination: limit + offset
- Antwort enthaelt items + total

Wir testen den Service-Layer (`list_findings_response`); der View ist
ein duenner aiohttp-Wrapper darueber. Damit laeuft der Test ohne den
HA-HTTP-Stack.
"""

from __future__ import annotations

import ast
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings_service import (
    list_findings_response,
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


def _f(
    *,
    code: str = "DPT_MISMATCH",
    ga: str | None = "1/2/3",
    severity: str = "error",
    when: datetime | None = None,
    evidence: dict | None = None,
) -> Finding:
    base = when or datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
    return Finding(
        code=code,
        schema_version=1,
        severity=severity,  # type: ignore[arg-type]
        ga=ga,
        source="1.1.5",
        title="t",
        description="d",
        evidence=evidence or {"k": "v"},
        first_seen=base,
        last_seen=base,
        occurrence_count=1,
        detector_version=f"{code}/v1",
    )


class TestFindingsListResponse:
    @pytest.mark.asyncio
    async def test_returns_items_and_total(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await repo.record(_f(ga="1/2/3"))
        await repo.record(_f(ga="1/2/4"))

        # Act
        resp = await list_findings_response(repo)

        # Assert
        assert resp["total"] == 2
        assert len(resp["items"]) == 2
        assert {item["ga"] for item in resp["items"]} == {"1/2/3", "1/2/4"}

    @pytest.mark.asyncio
    async def test_findings_endpoint_filters_by_severity_and_paginates(
        self, db: Database
    ) -> None:
        # Arrange — 5x error, 3x warning, 2x info
        repo = FindingsRepository(db)
        for i in range(5):
            await repo.record(_f(ga=f"1/0/{i}", severity="error"))
        for i in range(3):
            await repo.record(_f(ga=f"1/1/{i}", severity="warning"))
        for i in range(2):
            await repo.record(_f(ga=f"1/2/{i}", severity="info"))

        # Act — Filter severity=warning, limit=2, offset=0
        page1 = await list_findings_response(repo, severity="warning", limit=2, offset=0)

        # Assert
        assert page1["total"] == 3
        assert len(page1["items"]) == 2
        assert page1["limit"] == 2
        assert page1["offset"] == 0
        for item in page1["items"]:
            assert item["severity"] == "warning"

        # Act — Page 2 (offset=2)
        page2 = await list_findings_response(repo, severity="warning", limit=2, offset=2)

        # Assert
        assert page2["total"] == 3
        assert len(page2["items"]) == 1
        assert page2["offset"] == 2

    @pytest.mark.asyncio
    async def test_filter_by_code(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await repo.record(_f(code="DPT_MISMATCH"))
        await repo.record(_f(code="MULTI_RESPONDER", ga="1/2/4"))

        # Act
        resp = await list_findings_response(repo, code="MULTI_RESPONDER")

        # Assert
        assert resp["total"] == 1
        assert resp["items"][0]["code"] == "MULTI_RESPONDER"

    @pytest.mark.asyncio
    async def test_filter_by_ga(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await repo.record(_f(ga="1/2/3"))
        await repo.record(_f(ga="1/2/4", code="MULTI_RESPONDER"))

        # Act
        resp = await list_findings_response(repo, ga="1/2/3")

        # Assert
        assert resp["total"] == 1
        assert resp["items"][0]["ga"] == "1/2/3"

    @pytest.mark.asyncio
    async def test_invalid_severity_raises_value_error(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)

        # Act / Assert
        with pytest.raises(ValueError, match="severity"):
            await list_findings_response(repo, severity="bogus")  # type: ignore[arg-type]

    @pytest.mark.asyncio
    async def test_response_items_serialise_finding_to_dict(
        self, db: Database
    ) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await repo.record(_f(evidence={"a": 1, "b": "x"}))

        # Act
        resp = await list_findings_response(repo)

        # Assert — eine items-Entry hat alle Vertrag-Felder als JSON-keys.
        item = resp["items"][0]
        for key in (
            "code",
            "schema_version",
            "severity",
            "ga",
            "source",
            "title",
            "description",
            "evidence",
            "first_seen",
            "last_seen",
            "occurrence_count",
            "detector_version",
        ):
            assert key in item
        assert item["evidence"]["a"] == 1


class TestFindingsAcknowledgedFlag:
    """F-004: list_findings_response liefert pro Item ein `acknowledged`-Flag,
    damit die UI einen Unack-Button rendern kann.
    """

    @pytest.mark.asyncio
    async def test_acknowledged_false_for_unacked_finding(self, db: Database) -> None:
        repo = FindingsRepository(db)
        await repo.record(_f(ga="1/2/3"))

        resp = await list_findings_response(repo)

        assert resp["items"][0]["acknowledged"] is False

    @pytest.mark.asyncio
    async def test_acknowledged_true_after_ack(self, db: Database) -> None:
        repo = FindingsRepository(db)
        await repo.record(_f(ga="1/2/3", code="DPT_MISMATCH"))
        await repo.acknowledge(ga="1/2/3", code="DPT_MISMATCH", actor="audit-test")

        resp = await list_findings_response(repo)

        assert resp["items"][0]["acknowledged"] is True

    @pytest.mark.asyncio
    async def test_per_item_ack_independent(self, db: Database) -> None:
        repo = FindingsRepository(db)
        await repo.record(_f(ga="1/2/3", code="DPT_MISMATCH"))
        await repo.record(_f(ga="1/2/4", code="DPT_MISMATCH"))
        # Nur 1/2/3 acken
        await repo.acknowledge(ga="1/2/3", code="DPT_MISMATCH", actor="audit-test")

        resp = await list_findings_response(repo)
        items = {it["ga"]: it for it in resp["items"]}

        assert items["1/2/3"]["acknowledged"] is True
        assert items["1/2/4"]["acknowledged"] is False

    @pytest.mark.asyncio
    async def test_global_finding_without_ga_is_never_acked(self, db: Database) -> None:
        """Bus-weite Findings (ga=None) koennen aktuell nicht acked werden —
        das DTO muss `acknowledged=False` melden, damit die UI keinen
        Unack-Knopf rendert."""
        repo = FindingsRepository(db)
        await repo.record(_f(ga=None, code="RECONNECT_STORM", severity="warning"))

        resp = await list_findings_response(repo)

        assert resp["items"][0]["ga"] is None
        assert resp["items"][0]["acknowledged"] is False


class TestFindingsApiViewRegistered:
    """Iter 6: FindingsListView muss in messages.async_register_views auftauchen.

    Ohne Registrierung -> 404 im Panel. Statisch via AST geprueft, damit
    der Test ohne HA-Stack laeuft.
    """

    def test_findings_list_view_is_registered(self) -> None:
        api_dir = (
            Path(__file__).resolve().parents[2]
            / "custom_components"
            / "messagehub"
            / "api"
        )
        src = (api_dir / "messages.py").read_text(encoding="utf-8")
        assert "FindingsListView" in src, (
            "FindingsListView fehlt in messages.async_register_views — Frontend bekommt 404."
        )

    def test_findings_module_exists(self) -> None:
        api_dir = (
            Path(__file__).resolve().parents[2]
            / "custom_components"
            / "messagehub"
            / "api"
        )
        findings_module = api_dir / "findings.py"
        assert findings_module.exists(), "api/findings.py muss existieren"
        # AST: `class FindingsListView` mit `url = "/api/messagehub/findings"`.
        tree = ast.parse(findings_module.read_text(encoding="utf-8"))
        view_class = next(
            (
                n
                for n in ast.walk(tree)
                if isinstance(n, ast.ClassDef) and n.name == "FindingsListView"
            ),
            None,
        )
        assert view_class is not None, "FindingsListView class nicht gefunden"
        url = ""
        for stmt in view_class.body:
            if (
                isinstance(stmt, ast.Assign)
                and len(stmt.targets) == 1
                and isinstance(stmt.targets[0], ast.Name)
                and stmt.targets[0].id == "url"
                and isinstance(stmt.value, ast.Constant)
            ):
                url = str(stmt.value.value)
        assert url == "/api/messagehub/findings", (
            f"FindingsListView hat falsche URL: {url!r}"
        )


class TestRepoCount:
    @pytest.mark.asyncio
    async def test_count_filters_match_list_filters(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        for i in range(3):
            await repo.record(_f(ga=f"1/0/{i}", severity="error"))
        for i in range(2):
            await repo.record(_f(ga=f"1/1/{i}", severity="warning"))

        # Act
        n_total = await repo.count_findings()
        n_error = await repo.count_findings(severity="error")
        n_warning = await repo.count_findings(severity="warning")

        # Assert
        assert n_total == 5
        assert n_error == 3
        assert n_warning == 2

    @pytest.mark.asyncio
    async def test_offset_skips_items(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        for i in range(5):
            await repo.record(
                _f(
                    ga=f"1/0/{i}",
                    when=datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC) + timedelta(seconds=i),
                )
            )

        # Act
        first = await repo.list_findings(limit=2, offset=0)
        second = await repo.list_findings(limit=2, offset=2)

        # Assert
        assert len(first) == 2
        assert len(second) == 2
        # Keine Ueberlappung.
        first_gas = {f.ga for f in first}
        second_gas = {f.ga for f in second}
        assert first_gas.isdisjoint(second_gas)
