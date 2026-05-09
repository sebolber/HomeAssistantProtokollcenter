"""Iter 28 (knx-findings): Prometheus-Counter pro Finding-Code.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.8.
Counter `messagehub_knx_finding_total{code="...", severity="..."} N`
unter `/metrics` sichtbar — erlaubt Alerting auf "heute kam ein neuer
Finding-Typ dazu".
"""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.processing.findings import Finding
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
    from datetime import UTC, datetime
    base = datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
    return Finding(
        code=code,
        schema_version=1,
        severity=severity,  # type: ignore[arg-type]
        ga=ga,
        source=None,
        evidence={"k": "v"},
        first_seen=base,
        last_seen=base,
        occurrence_count=1,
        detector_version=f"{code}/v1",
    )


class TestPrometheusFindingCounter:
    def test_format_prometheus_metrics_includes_finding_lines(self) -> None:
        # Arrange
        finding_total = {
            ("DPT_MISMATCH", "error"): 3,
            ("MULTI_RESPONDER", "warning"): 1,
        }

        # Act
        text = format_prometheus_metrics(
            total=0,
            severity_total={},
            severity_24h={},
            finding_total=finding_total,
        )

        # Assert
        assert "messagehub_knx_finding_total" in text
        assert (
            'messagehub_knx_finding_total{code="DPT_MISMATCH",severity="error"} 3'
            in text
        )
        assert (
            'messagehub_knx_finding_total{code="MULTI_RESPONDER",severity="warning"} 1'
            in text
        )

    def test_finding_counter_lines_sorted_for_reproducibility(self) -> None:
        # Arrange — Reihenfolge im Input darf das Output nicht beeinflussen
        # (verhindert flatternde Tests + Diff-freier Scrape).
        finding_total = {
            ("PATTERN_CONSTANT_VALUE", "warning"): 2,
            ("DPT_MISMATCH", "error"): 1,
        }
        finding_total_reversed = dict(reversed(list(finding_total.items())))

        # Act
        a = format_prometheus_metrics(
            total=0, severity_total={}, severity_24h={},
            finding_total=finding_total,
        )
        b = format_prometheus_metrics(
            total=0, severity_total={}, severity_24h={},
            finding_total=finding_total_reversed,
        )

        # Assert
        assert a == b

    def test_no_finding_lines_when_dict_empty(self) -> None:
        text = format_prometheus_metrics(
            total=0, severity_total={}, severity_24h={},
            finding_total={},
        )
        # HELP/TYPE Header bleiben (Grafana erwartet sie auch ohne Daten).
        assert "messagehub_knx_finding_total" in text


class TestPrometheusMetricIntegration:
    @pytest.mark.asyncio
    async def test_prometheus_metric_increments_on_finding_emit(
        self, db: Database
    ) -> None:
        """Test-zuerst-Artefakt aus §9.9 Iter 28.

        Repo persistiert Findings -> Aggregation liest Counter pro Code
        + Severity -> Prometheus-Output enthaelt den Counter.
        """
        # Arrange
        repo = FindingsRepository(db)
        await repo.record(_f(code="DPT_MISMATCH", severity="error"))
        await repo.record(_f(code="DPT_MISMATCH", severity="error", ga="1/2/4"))
        await repo.record(_f(code="MULTI_RESPONDER", severity="warning"))

        # Act
        finding_total = await _aggregate_finding_total(db)
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


async def _aggregate_finding_total(db: Database) -> dict[tuple[str, str], int]:
    """Helfer: SQL-Aggregation `(code, severity) -> count` aus knx_findings.

    Spiegelt exakt, was der Service-Layer beim Prometheus-Scrape macht.
    """
    rows = await db.fetch_all(
        "SELECT code, severity, COUNT(*) AS c "
        "FROM knx_findings GROUP BY code, severity"
    )
    return {(str(row["code"]), str(row["severity"])): int(row["c"]) for row in rows}
