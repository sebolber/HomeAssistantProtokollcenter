"""Iter 29 (knx-findings): Markdown-Export der Findings.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §5.4 (E15).
Copy-Paste-Vorlage fuer die ETS-Notiz-Spalte; Tabellen-Layout mit
Code, GA, Severity und der wesentlichen Evidence.

Test-zuerst-Artefakt:
`test_findings_markdown_export_renders_table_with_evidence`.
"""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

import pytest

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings_markdown import (
    format_findings_markdown,
)
from custom_components.messagehub.processing.findings_service import (
    findings_markdown_response,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.findings_repo import FindingsRepository
from custom_components.messagehub.storage.migrations import MigrationRunner


def _f(
    *,
    code: str = "DPT_MISMATCH",
    ga: str = "1/2/3",
    severity: str = "error",
    evidence: dict | None = None,
) -> Finding:
    base = datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
    return Finding(
        code=code,
        schema_version=1,
        severity=severity,  # type: ignore[arg-type]
        ga=ga,
        source="1.1.5",
        evidence=evidence or {"project_dpt": "9.001", "inferred_dpt": "1.001"},
        first_seen=base,
        last_seen=base,
        occurrence_count=1,
        detector_version=f"{code}/v1",
    )


@pytest.fixture
async def db(tmp_path: Path):
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


class TestMarkdownFormatter:
    def test_findings_markdown_export_renders_table_with_evidence(self) -> None:
        # Arrange
        findings = [
            _f(
                code="DPT_MISMATCH",
                ga="1/2/3",
                severity="error",
                evidence={"project_dpt": "9.001", "inferred_dpt": "1.001"},
            ),
            _f(
                code="MULTI_RESPONDER",
                ga="1/2/4",
                severity="warning",
                evidence={"responding_sources": ["1.1.5", "1.1.6"]},
            ),
        ]

        # Act
        md = format_findings_markdown(findings)

        # Assert — Tabellen-Markdown.
        assert "| Code |" in md
        assert "| GA |" in md
        assert "| Severity |" in md
        assert "| Evidence |" in md
        assert "DPT_MISMATCH" in md
        assert "1/2/3" in md
        assert "error" in md
        assert "1.001" in md  # Evidence ist im Output sichtbar
        assert "MULTI_RESPONDER" in md
        assert "1.1.5" in md

    def test_empty_list_renders_placeholder(self) -> None:
        md = format_findings_markdown([])
        assert "Keine Findings" in md or "no findings" in md.lower()

    def test_evidence_dict_serialized_compactly(self) -> None:
        # Arrange — Evidence mit verschiedenen Wertetypen.
        finding = _f(
            evidence={
                "project_dpt": "9.001",
                "confidence": 0.94,
                "samples": 52,
            }
        )
        # Act
        md = format_findings_markdown([finding])
        # Assert — Werte erscheinen, Reihenfolge alphabetisch (sortable).
        assert "0.94" in md
        assert "52" in md
        # Markdown-Pipes ("|") in der Evidence muessen gefluechtet werden,
        # sonst zerbricht die Tabelle.
        risky = _f(evidence={"value": "a|b"})
        md_risky = format_findings_markdown([risky])
        assert "a|b" not in md_risky  # roher Pipe nicht erlaubt
        assert "a\\|b" in md_risky or "a&#124;b" in md_risky


class TestMarkdownEndpointService:
    @pytest.mark.asyncio
    async def test_findings_markdown_response_includes_persisted_findings(
        self, db: Database
    ) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await repo.record(_f(code="DPT_MISMATCH"))
        await repo.record(_f(code="MULTI_RESPONDER", ga="1/2/4"))

        # Act
        md = await findings_markdown_response(repo)

        # Assert
        assert "DPT_MISMATCH" in md
        assert "MULTI_RESPONDER" in md
