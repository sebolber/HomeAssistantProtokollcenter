"""Iter 29c (knx-findings): Prometheus-Aggregation verdrahten — Smoke-Test.

Vertrag aus dem Wiring-Audit (Iter 28 partial wired): Iter 28 lieferte
`format_prometheus_metrics(finding_total=...)`, der MetricsView fuetterte
den Param aber NIE — die Aggregation `(code, severity) -> count` aus
`knx_findings` lief im Produktiv-Code nicht.

Iter 29c: Service-Helper `aggregate_finding_total(repo)` baut die
Mapping-Struktur, MetricsView ruft sie auf und reicht sie an
`format_prometheus_metrics` durch.
"""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

import pytest

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings_service import (
    aggregate_finding_total,
)
from custom_components.messagehub.processing.prometheus import (
    format_prometheus_metrics,
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


def _f(*, code: str, severity: str = "error", ga: str = "1/2/3") -> Finding:
    base = datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
    return Finding(
        code=code,
        schema_version=1,
        severity=severity,  # type: ignore[arg-type]
        ga=ga,
        source=None,
        evidence={"ga": ga},
        first_seen=base,
        last_seen=base,
        occurrence_count=1,
        detector_version=f"{code}/v1",
    )


class TestAggregateFindingTotal:
    @pytest.mark.asyncio
    async def test_prometheus_endpoint_includes_finding_counter_after_findings_recorded(
        self, db: Database
    ) -> None:
        """Iter 29c-Smoke: Repo-Findings -> SQL-Aggregation -> Prometheus-Output."""
        # Arrange
        repo = FindingsRepository(db)
        await repo.record(_f(code="DPT_MISMATCH", severity="error", ga="1/2/3"))
        await repo.record(_f(code="DPT_MISMATCH", severity="error", ga="1/2/4"))
        await repo.record(_f(code="MULTI_RESPONDER", severity="warning"))

        # Act — Service-Aggregation (das ruft MetricsView.get auf).
        finding_total = await aggregate_finding_total(repo)
        text = format_prometheus_metrics(
            total=0, severity_total={}, severity_24h={},
            finding_total=finding_total,
        )

        # Assert
        assert (
            'messagehub_knx_finding_total{code="DPT_MISMATCH",severity="error"} 2'
            in text
        )
        assert (
            'messagehub_knx_finding_total{code="MULTI_RESPONDER",severity="warning"} 1'
            in text
        )

    @pytest.mark.asyncio
    async def test_aggregate_returns_empty_dict_for_empty_repo(
        self, db: Database
    ) -> None:
        repo = FindingsRepository(db)
        result = await aggregate_finding_total(repo)
        assert result == {}

    @pytest.mark.asyncio
    async def test_aggregate_groups_by_code_and_severity_independently(
        self, db: Database
    ) -> None:
        # Same code, different severity => zwei getrennte Buckets.
        repo = FindingsRepository(db)
        await repo.record(_f(code="DPT_MISMATCH", severity="error"))
        await repo.record(_f(code="DPT_MISMATCH", severity="info", ga="1/2/4"))
        result = await aggregate_finding_total(repo)
        assert result.get(("DPT_MISMATCH", "error")) == 1
        assert result.get(("DPT_MISMATCH", "info")) == 1
