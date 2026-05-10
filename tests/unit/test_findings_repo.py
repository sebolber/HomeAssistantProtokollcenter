"""Iter 2 (knx-findings): FindingsRepository — Insert/List + Dedup.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.1
(Append-only-Log mit Dedup-Schluessel `(ga, finding_code, evidence_hash)`).
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.findings import Finding
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


def _finding(
    *,
    code: str = "DPT_MISMATCH",
    ga: str | None = "1/2/3",
    source: str | None = "1.1.5",
    evidence: dict | None = None,
    when: datetime | None = None,
    severity: str = "error",
) -> Finding:
    base_time = when or datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
    return Finding(
        code=code,
        schema_version=1,
        severity=severity,  # type: ignore[arg-type]
        ga=ga,
        source=source,
        evidence=evidence or {"project_dpt": "9.001", "inferred_dpt": "1.001", "confidence": 0.94},
        first_seen=base_time,
        last_seen=base_time,
        occurrence_count=1,
        detector_version=f"{code}/v1",
    )


class TestFindingsRepoInsert:
    @pytest.mark.asyncio
    async def test_insert_persists_finding(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        finding = _finding()

        # Act
        await repo.record(finding)

        # Assert
        rows = await repo.list_findings()
        assert len(rows) == 1
        assert rows[0].code == "DPT_MISMATCH"
        assert rows[0].ga == "1/2/3"
        assert rows[0].source == "1.1.5"
        assert rows[0].severity == "error"
        assert rows[0].evidence["project_dpt"] == "9.001"
        assert rows[0].occurrence_count == 1


class TestFindingsRepoDedup:
    @pytest.mark.asyncio
    async def test_findings_repo_insert_dedups_by_evidence_hash(self, db: Database) -> None:
        # Arrange — gleiche GA, gleicher Code, gleiche Evidence -> ein Row.
        repo = FindingsRepository(db)
        first = _finding(when=datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC))
        second = _finding(when=datetime(2026, 5, 3, 8, 30, 0, tzinfo=UTC))

        # Act
        await repo.record(first)
        await repo.record(second)

        # Assert — Dedup griff: ein einziger Row mit erhoehtem Count.
        rows = await repo.list_findings()
        assert len(rows) == 1
        assert rows[0].occurrence_count == 2
        assert rows[0].first_seen == first.first_seen
        assert rows[0].last_seen == second.last_seen

    @pytest.mark.asyncio
    async def test_distinct_evidence_creates_separate_rows(self, db: Database) -> None:
        # Arrange — gleiche GA + Code, andere Evidence -> zwei Rows.
        repo = FindingsRepository(db)
        await repo.record(_finding(evidence={"project_dpt": "9.001", "inferred_dpt": "1.001"}))
        await repo.record(_finding(evidence={"project_dpt": "9.001", "inferred_dpt": "5.001"}))

        # Act
        rows = await repo.list_findings()

        # Assert
        assert len(rows) == 2

    @pytest.mark.asyncio
    async def test_distinct_ga_creates_separate_rows(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await repo.record(_finding(ga="1/2/3"))
        await repo.record(_finding(ga="1/2/4"))

        # Act
        rows = await repo.list_findings()

        # Assert
        assert {r.ga for r in rows} == {"1/2/3", "1/2/4"}


class TestFindingsRepoListFilters:
    @pytest.mark.asyncio
    async def test_list_filters_by_code(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await repo.record(_finding(code="DPT_MISMATCH"))
        await repo.record(_finding(code="MULTI_RESPONDER", ga="1/2/4"))

        # Act
        rows = await repo.list_findings(code="DPT_MISMATCH")

        # Assert
        assert len(rows) == 1
        assert rows[0].code == "DPT_MISMATCH"

    @pytest.mark.asyncio
    async def test_list_filters_by_ga(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await repo.record(_finding(ga="1/2/3"))
        await repo.record(_finding(ga="1/2/4", code="MULTI_RESPONDER"))

        # Act
        rows = await repo.list_findings(ga="1/2/3")

        # Assert
        assert len(rows) == 1
        assert rows[0].ga == "1/2/3"

    @pytest.mark.asyncio
    async def test_list_filters_by_severity(self, db: Database) -> None:
        # Arrange
        repo = FindingsRepository(db)
        await repo.record(_finding(severity="error"))
        await repo.record(_finding(severity="warning", ga="1/2/4", code="MULTI_RESPONDER"))

        # Act
        rows = await repo.list_findings(severity="warning")

        # Assert
        assert len(rows) == 1
        assert rows[0].severity == "warning"

    @pytest.mark.asyncio
    async def test_list_orders_by_last_seen_desc(self, db: Database) -> None:
        # Arrange — neueres Finding muss zuerst kommen.
        repo = FindingsRepository(db)
        old = _finding(ga="1/2/3", when=datetime(2026, 5, 1, 8, 0, 0, tzinfo=UTC))
        new = _finding(
            ga="1/2/4",
            code="MULTI_RESPONDER",
            when=datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC),
        )
        await repo.record(old)
        await repo.record(new)

        # Act
        rows = await repo.list_findings()

        # Assert
        assert rows[0].ga == "1/2/4"
        assert rows[1].ga == "1/2/3"


class TestFindingsRepoSchemaVersion:
    @pytest.mark.asyncio
    async def test_same_evidence_different_schema_version_not_deduped(self, db: Database) -> None:
        # Arrange — Tuning eines Detectors -> schema_version=2; alte
        # v1-Findings bleiben sichtbar, neue v2 daneben (siehe §9.5).
        repo = FindingsRepository(db)
        v1 = _finding()
        v2 = Finding(
            code="DPT_MISMATCH",
            schema_version=2,
            severity="error",
            ga="1/2/3",
            source="1.1.5",
            evidence={
                "project_dpt": "9.001",
                "inferred_dpt": "1.001",
                "confidence": 0.94,
            },
            first_seen=datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC) + timedelta(hours=1),
            last_seen=datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC) + timedelta(hours=1),
            occurrence_count=1,
            detector_version="DPT_MISMATCH/v2",
        )
        await repo.record(v1)
        await repo.record(v2)

        # Act
        rows = await repo.list_findings()

        # Assert
        assert len(rows) == 2
        assert {r.schema_version for r in rows} == {1, 2}
