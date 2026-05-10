"""Iter B1: Dedup-Hash basiert auf Identitaets-Feldern, nicht auf
kompletter Evidence.

Konzept-Schwaeche B1: Detektoren mit kontinuierlich variabler Evidence
(RECONNECT_STORM, SEND_CYCLE_DRIFT, REPEAT_APPROXIMATION) hashen heute
ueber die ganze Evidence — der Hash wechselt pro Detector-Run, der
UNIQUE-Index greift nicht, occurrence_count bleibt bei 1, Tabelle
explodiert.

Loesung: Pro Code wird ein Set von ``identity_fields`` definiert. Hash
geht nur ueber diese Felder. Variable Werte (burst_count, factor,
ratio, ...) bleiben in der Evidence gespeichert (UI rendert sie),
fliessen aber nicht in den Dedup-Schluessel ein. Beim zweiten Run mit
gleicher Identitaet greift die UPSERT-Logik und ``occurrence_count``
zaehlt korrekt.
"""

from __future__ import annotations

from datetime import datetime

import pytest

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.findings_repo import FindingsRepository
from custom_components.messagehub.storage.migrations import (
    MigrationRunner,
    discover_migrations,
)


def _now() -> datetime:
    return datetime(2026, 5, 8, 12, 0, 0)


def _reconnect_storm_finding(*, source: str, burst_count: int, factor: float) -> Finding:
    """Builder fuer RECONNECT_STORM mit variabler Evidence."""
    return Finding(
        code="RECONNECT_STORM",
        schema_version=1,
        severity="warning",
        ga=None,
        source=source,
        evidence={
            # Zeitstempel + Variablen wechseln pro Detector-Run.
            "silence_until": "2026-05-08T11:00:00",
            "burst_count": burst_count,
            "normal_avg": 5.0,
            "factor": factor,
        },
        first_seen=_now(),
        last_seen=_now(),
        occurrence_count=1,
        detector_version="RECONNECT_STORM/v1",
    )


@pytest.fixture
async def repo(tmp_path):  # type: ignore[no-untyped-def]
    db = Database(tmp_path / "test.db")
    await db.open()
    await MigrationRunner(db, migrations=discover_migrations()).run()
    try:
        yield FindingsRepository(db)
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_repeat_record_with_changing_evidence_dedups(
    repo: FindingsRepository,
) -> None:
    """RECONNECT_STORM: gleicher Code+Source, aber wechselnde
    burst_count/factor — soll als EIN Finding mit occurrence_count=N
    persistiert werden."""
    for burst, factor in [(50, 10.0), (62, 12.4), (48, 9.6)]:
        await repo.record(
            _reconnect_storm_finding(source="1.1.5", burst_count=burst, factor=factor)
        )
    items = await repo.list_findings(code="RECONNECT_STORM")
    assert len(items) == 1
    assert items[0].source == "1.1.5"
    assert items[0].occurrence_count == 3


@pytest.mark.asyncio
async def test_different_sources_yield_separate_findings(
    repo: FindingsRepository,
) -> None:
    """Verschiedene Source-IAs sind unterschiedliche Identitaeten."""
    await repo.record(_reconnect_storm_finding(source="1.1.5", burst_count=50, factor=10.0))
    await repo.record(_reconnect_storm_finding(source="1.1.6", burst_count=80, factor=15.0))
    items = await repo.list_findings(code="RECONNECT_STORM")
    assert len(items) == 2
    sources = {it.source for it in items}
    assert sources == {"1.1.5", "1.1.6"}


@pytest.mark.asyncio
async def test_different_codes_dont_collide(repo: FindingsRepository) -> None:
    """RECONNECT_STORM und HEALTH_BUSLOAD auf gleicher (ga, source)
    bleiben getrennt."""
    finding_a = _reconnect_storm_finding(source="1.1.5", burst_count=50, factor=10.0)
    finding_b = Finding(
        code="HEALTH_BUSLOAD",
        schema_version=1,
        severity="warning",
        ga=None,
        source=None,
        evidence={"busload_max_pct": 35.0, "threshold": 20.0},
        first_seen=_now(),
        last_seen=_now(),
        occurrence_count=1,
        detector_version="HEALTH_BUSLOAD/v1",
    )
    await repo.record(finding_a)
    await repo.record(finding_b)
    items = await repo.list_findings()
    codes = {it.code for it in items}
    assert codes == {"RECONNECT_STORM", "HEALTH_BUSLOAD"}


@pytest.mark.asyncio
async def test_repeat_approximation_dedups_per_ga(
    repo: FindingsRepository,
) -> None:
    """REPEAT_APPROXIMATION: gleiche GA, wechselnde repeats_per_day —
    soll dedupliziert werden."""
    for repeats, total in [(5.0, 5), (8.5, 9), (12.0, 12)]:
        finding = Finding(
            code="REPEAT_APPROXIMATION",
            schema_version=1,
            severity="warning",
            ga="1/2/3",
            source=None,
            evidence={
                "repeats_per_day": repeats,
                "total_repeats": total,
                "period_days": 1.0,
            },
            first_seen=_now(),
            last_seen=_now(),
            occurrence_count=1,
            detector_version="REPEAT_APPROXIMATION/v1",
        )
        await repo.record(finding)
    items = await repo.list_findings(code="REPEAT_APPROXIMATION")
    assert len(items) == 1
    assert items[0].occurrence_count == 3


@pytest.mark.asyncio
async def test_evidence_overwrites_with_latest_values(
    repo: FindingsRepository,
) -> None:
    """Beim Re-Insert sollen die neuen Evidence-Werte sichtbar sein —
    der User will den AKTUELLEN Stand sehen, nicht das Erst-Sample."""
    await repo.record(_reconnect_storm_finding(source="1.1.5", burst_count=50, factor=10.0))
    await repo.record(_reconnect_storm_finding(source="1.1.5", burst_count=80, factor=16.0))
    items = await repo.list_findings(code="RECONNECT_STORM")
    assert len(items) == 1
    assert items[0].evidence["burst_count"] == 80
    assert items[0].evidence["factor"] == 16.0


@pytest.mark.asyncio
async def test_send_cycle_drift_dedups_per_ga(
    repo: FindingsRepository,
) -> None:
    """SEND_CYCLE_DRIFT mit wechselnder ratio darf nicht zu N Rows
    explodieren."""
    for ratio in [0.4, 0.35, 0.42]:
        finding = Finding(
            code="SEND_CYCLE_DRIFT",
            schema_version=1,
            severity="info",
            ga="1/2/3",
            source=None,
            evidence={
                "recent_median_dt": 60.0,
                "baseline_median_dt": 150.0 / ratio,
                "ratio": ratio,
            },
            first_seen=_now(),
            last_seen=_now(),
            occurrence_count=1,
            detector_version="SEND_CYCLE_DRIFT/v1",
        )
        await repo.record(finding)
    items = await repo.list_findings(code="SEND_CYCLE_DRIFT")
    assert len(items) == 1
    assert items[0].occurrence_count == 3
