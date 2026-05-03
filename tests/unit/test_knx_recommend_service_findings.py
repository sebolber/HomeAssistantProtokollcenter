"""Iter L3.1: Layer-3-Findings-Override im Service-Lauf."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.knx_recommend_service import (
    RELEVANT_FINDING_CODES_FOR_RECOMMENDATIONS,
    _apply_findings_override,
    compute_device_recommendation,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.findings_repo import FindingsRepository
from custom_components.messagehub.storage.knx_stats_repo import KnxStatsRepository
from custom_components.messagehub.storage.migrations import MigrationRunner


_NOW = datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)


@pytest.fixture
async def db(tmp_path: Path):
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


def _ts(offset_s: float) -> str:
    return (_NOW + timedelta(seconds=offset_s)).isoformat(timespec="seconds")


# ---------------------------------------------------------------------------
# Pure-Logic
# ---------------------------------------------------------------------------


def _make_finding(
    *,
    code: str = "SEND_CYCLE_DRIFT",
    ga: str | None = "1/2/3",
    source: str | None = "1.1.10",
) -> Finding:
    naive_now = datetime(2026, 5, 3, 8, 0, 0)
    return Finding(
        code=code,
        schema_version=1,
        severity="warning",
        ga=ga,
        source=source,
        title=f"{code} title",
        description=f"{code} desc",
        first_seen=naive_now,
        last_seen=naive_now,
        occurrence_count=1,
        detector_version=f"{code}/v1",
    )


def _build_ga_reco(ga: str = "1/2/3", severity: str = "warn") -> object:
    from custom_components.messagehub.processing.knx_recommend_service import (
        GaRecommendation,
        SendModeObservation,
    )
    obs = SendModeObservation(
        mode="cyclic",
        confidence="high",
        sample_count=40,
        value_changes=0,
        median_interval_s=60.0,
        stdev_interval_s=1.0,
    )
    return GaRecommendation(
        ga=ga,
        label="test",
        dpt="9.001",
        observed=obs,
        recommended_mode="hybrid",
        recommended_cycle_minutes=(5, 15),
        recommended_hysteresis=">= 0.2 K",
        severity=severity,  # type: ignore[arg-type]
        rationale="...",
    )


class TestApplyFindingsOverride:
    def test_no_findings_unchanged(self) -> None:
        ga = _build_ga_reco(severity="ok")
        result = _apply_findings_override([ga], active_findings=[])
        assert result[0].severity == "ok"  # type: ignore[union-attr]

    def test_finding_on_ga_promotes_to_deviation(self) -> None:
        ga = _build_ga_reco("1/2/3", severity="warn")
        finding = _make_finding(ga="1/2/3")
        result = _apply_findings_override([ga], active_findings=[finding])
        assert result[0].severity == "deviation"  # type: ignore[union-attr]

    def test_finding_on_other_ga_does_not_affect(self) -> None:
        ga = _build_ga_reco("1/2/3", severity="ok")
        finding = _make_finding(ga="9/9/9")
        result = _apply_findings_override([ga], active_findings=[finding])
        assert result[0].severity == "ok"  # type: ignore[union-attr]

    def test_bus_wide_finding_no_specific_ga(self) -> None:
        """Bus-weite Findings (ga=None) duerfen die GA-Severities nicht
        floechendeckend hochstufen."""
        ga = _build_ga_reco("1/2/3", severity="ok")
        finding = _make_finding(ga=None)
        result = _apply_findings_override([ga], active_findings=[finding])
        assert result[0].severity == "ok"  # type: ignore[union-attr]


def test_relevant_codes_pinned() -> None:
    """Konstante muss den vereinbarten Satz enthalten — Schutz gegen
    versehentliches Tunen."""
    expected = {
        "SEND_CYCLE_DRIFT",
        "REPEAT_APPROXIMATION",
        "TOGGLE_LOOP",
        "MULTI_RESPONDER",
    }
    assert RELEVANT_FINDING_CODES_FOR_RECOMMENDATIONS == frozenset(expected)


# ---------------------------------------------------------------------------
# Service-Roundtrip mit echter SQLite + FindingsRepository
# ---------------------------------------------------------------------------


async def _seed_temperature(db: Database, *, ga: str, source: str) -> None:
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (ga, "Temp", "9.001", now, now),
    )
    for i in range(40):
        await db.execute(
            "INSERT INTO knx_raw_telegrams "
            "(timestamp, destination, source, telegramtype, value, repeated) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                _ts(-3600 + i * 60), ga, source,
                "GroupValueWrite", json.dumps(21.5), 0,
            ),
        )


@pytest.mark.asyncio
async def test_active_finding_promotes_severity(db: Database) -> None:
    await _seed_temperature(db, ga="1/2/3", source="1.1.10")
    repo = KnxStatsRepository(db)
    findings_repo = FindingsRepository(db)
    await findings_repo.record(
        Finding(
            code="SEND_CYCLE_DRIFT",
            schema_version=1,
            severity="warning",
            ga="1/2/3",
            source="1.1.10",
            title="Sender-Drift erkannt",
            description="Cycle hat sich halbiert",
            evidence={"baseline_minutes": 5, "recent_minutes": 2},
            first_seen=datetime(2026, 5, 3, 6, 0, 0),
            last_seen=datetime(2026, 5, 3, 7, 0, 0),
            occurrence_count=1,
            detector_version="SEND_CYCLE_DRIFT/v1",
        )
    )

    reco = await compute_device_recommendation(
        repo, "1.1.10", _ts(-3700), _ts(60),
        findings_repo=findings_repo,
    )

    assert reco is not None
    ga = reco.ga_recommendations[0]
    assert ga.severity == "deviation"
    # Reasoning enthaelt Finding-Marker
    assert any(
        "Layer 3" in r and "SEND_CYCLE_DRIFT" in r
        for r in reco.reasoning
    )


@pytest.mark.asyncio
async def test_acknowledged_finding_does_not_override(db: Database) -> None:
    await _seed_temperature(db, ga="1/2/3", source="1.1.10")
    repo = KnxStatsRepository(db)
    findings_repo = FindingsRepository(db)
    await findings_repo.record(
        Finding(
            code="SEND_CYCLE_DRIFT",
            schema_version=1,
            severity="warning",
            ga="1/2/3",
            source="1.1.10",
            title="Sender-Drift",
            description="x",
            first_seen=datetime(2026, 5, 3, 6, 0, 0),
            last_seen=datetime(2026, 5, 3, 7, 0, 0),
            detector_version="SEND_CYCLE_DRIFT/v1",
        )
    )
    # Acknowledge — sticky (kein Expiry), damit der Test deterministisch
    # bleibt.
    await findings_repo.acknowledge(
        ga="1/2/3",
        code="SEND_CYCLE_DRIFT",
        actor="test",
        sticky=True,
    )

    reco = await compute_device_recommendation(
        repo, "1.1.10", _ts(-3700), _ts(60),
        findings_repo=findings_repo,
    )

    assert reco is not None
    # Acked Finding darf die Empfehlung nicht beeinflussen.
    assert not any("SEND_CYCLE_DRIFT" in r for r in reco.reasoning)


@pytest.mark.asyncio
async def test_irrelevant_finding_code_ignored(db: Database) -> None:
    """Nur die Whitelist-Codes greifen. ORPHAN_GA, DPT_MISMATCH etc.
    sollen die Empfehlung nicht aendern."""
    await _seed_temperature(db, ga="1/2/3", source="1.1.10")
    repo = KnxStatsRepository(db)
    findings_repo = FindingsRepository(db)
    await findings_repo.record(
        Finding(
            code="DPT_MISMATCH",
            schema_version=1,
            severity="info",
            ga="1/2/3",
            source="1.1.10",
            title="DPT-Konflikt",
            description="x",
            first_seen=datetime(2026, 5, 3, 6, 0, 0),
            last_seen=datetime(2026, 5, 3, 7, 0, 0),
            detector_version="DPT_MISMATCH/v1",
        )
    )

    reco = await compute_device_recommendation(
        repo, "1.1.10", _ts(-3700), _ts(60),
        findings_repo=findings_repo,
    )

    assert reco is not None
    assert not any("DPT_MISMATCH" in r for r in reco.reasoning)


@pytest.mark.asyncio
async def test_multiple_findings_listed_in_reasoning(db: Database) -> None:
    await _seed_temperature(db, ga="1/2/3", source="1.1.10")
    await _seed_temperature(db, ga="1/2/4", source="1.1.10")
    repo = KnxStatsRepository(db)
    findings_repo = FindingsRepository(db)
    for ga, code in (
        ("1/2/3", "SEND_CYCLE_DRIFT"),
        ("1/2/4", "TOGGLE_LOOP"),
    ):
        await findings_repo.record(
            Finding(
                code=code,
                schema_version=1,
                severity="warning",
                ga=ga,
                source="1.1.10",
                title=f"{code} title",
                description=f"{code} desc",
                first_seen=datetime(2026, 5, 3, 6, 0, 0),
                last_seen=datetime(2026, 5, 3, 7, 0, 0),
                detector_version=f"{code}/v1",
            )
        )

    reco = await compute_device_recommendation(
        repo, "1.1.10", _ts(-3700), _ts(60),
        findings_repo=findings_repo,
    )

    assert reco is not None
    matches = [r for r in reco.reasoning if "Layer 3" in r and "Finding" in r]
    assert len(matches) >= 2


@pytest.mark.asyncio
async def test_no_findings_repo_skips_layer3(db: Database) -> None:
    """Backwards-Compat: ohne findings_repo keine Layer-3-Findings-
    Reasoning."""
    await _seed_temperature(db, ga="1/2/3", source="1.1.10")
    repo = KnxStatsRepository(db)

    reco = await compute_device_recommendation(
        repo, "1.1.10", _ts(-3700), _ts(60),
    )

    assert reco is not None
    assert not any("Finding" in r for r in reco.reasoning)
