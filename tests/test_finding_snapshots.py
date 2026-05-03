"""Iter 30 (knx-findings): Snapshot-Fixtures pro Detector.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.9
Iter 30: pro Detector ein anonymisiertes SQL-Snapshot in
`tests/fixtures/knx_findings/`. Test laedt das Snapshot in eine frische
DB, ruft den passenden Runner (per-GA oder bus-wide) und prueft, dass
genau die erwartete Finding-Klasse herauskommt.

Damit werden Heuristik-Regressionen sichtbar — wenn ein Detector seine
Schwellen so verschiebt, dass das Snapshot nicht mehr triggert, faellt
der Test sofort um.
"""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

import pytest

from custom_components.messagehub.processing.findings_runner import (
    run_bus_wide_detectors,
    run_per_ga_detectors,
)
from custom_components.messagehub.processing.findings_service import (
    list_findings_response,
)
from custom_components.messagehub.processing.knx_repo import KnxAddressRepository
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.findings_repo import FindingsRepository
from custom_components.messagehub.storage.knx_stats_repo import KnxStatsRepository
from custom_components.messagehub.storage.migrations import MigrationRunner

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "knx_findings"


@pytest.fixture
async def db(tmp_path: Path):
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


async def _load_snapshot(db: Database, name: str) -> None:
    sql_text = (FIXTURES_DIR / f"{name}.sql").read_text(encoding="utf-8")
    # Wir nutzen executescript, damit mehrere Statements + WITH RECURSIVE
    # funktionieren. Der MigrationRunner hat dieselbe Strategie.
    await db.connection.executescript(sql_text)
    await db.connection.commit()


def _now() -> datetime:
    return datetime(2026, 5, 3, 8, 30, 0, tzinfo=UTC)


def _wide_period() -> tuple[str, str]:
    """Periode 60 Tage rueckwaerts bis 1 h nach _now() — deckt alle
    Snapshot-Szenarien ab (Recent/Baseline/Stale brauchen lange Spannen)."""
    return (
        datetime(2026, 3, 1, 0, 0, 0, tzinfo=UTC).isoformat(timespec="seconds"),
        datetime(2026, 5, 3, 9, 30, 0, tzinfo=UTC).isoformat(timespec="seconds"),
    )


async def _run_per_ga(
    db: Database, ga: str, *, period: tuple[str, str] | None = None
) -> None:
    period_from, period_to = period or _wide_period()
    await run_per_ga_detectors(
        ga=ga,
        findings_repo=FindingsRepository(db),
        address_repo=KnxAddressRepository(db),
        stats_repo=KnxStatsRepository(db),
        period_from=period_from,
        period_to=period_to,
        now=_now(),
    )


async def _run_bus_wide(db: Database) -> None:
    period_from, period_to = _wide_period()
    await run_bus_wide_detectors(
        findings_repo=FindingsRepository(db),
        address_repo=KnxAddressRepository(db),
        stats_repo=KnxStatsRepository(db),
        period_from=period_from,
        period_to=period_to,
        now=_now(),
    )


class TestPerGaSnapshots:
    @pytest.mark.asyncio
    async def test_snapshot_fixture_dpt_mismatch_yields_expected_finding_set(
        self, db: Database
    ) -> None:
        """Iter 30-Smoke-Test: laedt Snapshot, ruft Runner, prueft Finding-Set."""
        await _load_snapshot(db, "dpt_mismatch")
        await _run_per_ga(db, "1/2/3")
        codes = await _codes(db)
        assert "DPT_MISMATCH" in codes

    @pytest.mark.asyncio
    async def test_snapshot_value_out_of_range(self, db: Database) -> None:
        await _load_snapshot(db, "value_out_of_range")
        await _run_per_ga(db, "1/2/4")
        codes = await _codes(db)
        assert "VALUE_OUT_OF_RANGE" in codes

    @pytest.mark.asyncio
    async def test_snapshot_multi_responder(self, db: Database) -> None:
        await _load_snapshot(db, "multi_responder")
        await _run_per_ga(db, "1/2/5")
        codes = await _codes(db)
        assert "MULTI_RESPONDER" in codes

    @pytest.mark.asyncio
    async def test_snapshot_read_no_response(self, db: Database) -> None:
        await _load_snapshot(db, "read_no_response")
        await _run_per_ga(db, "1/2/6")
        codes = await _codes(db)
        assert "READ_NO_RESPONSE" in codes

    @pytest.mark.asyncio
    async def test_snapshot_toggle_loop(self, db: Database) -> None:
        await _load_snapshot(db, "toggle_loop")
        await _run_per_ga(db, "1/2/7")
        codes = await _codes(db)
        assert "TOGGLE_LOOP" in codes

    @pytest.mark.asyncio
    async def test_snapshot_repeat_approximation(self, db: Database) -> None:
        # REPEAT_APPROXIMATION normalisiert auf "pro Tag", deshalb hier
        # eine 1-Tag-Periode statt der ueblichen 64-Tage-Wide-Periode —
        # sonst verduennen sich die 6 Doppel-Telegramme zu < 5/Tag.
        await _load_snapshot(db, "repeat_approximation")
        period = (
            "2026-05-03T00:00:00+00:00",
            "2026-05-03T23:59:00+00:00",
        )
        await _run_per_ga(db, "1/2/9", period=period)
        codes = await _codes(db)
        assert "REPEAT_APPROXIMATION" in codes

    @pytest.mark.asyncio
    async def test_snapshot_send_to_nowhere(self, db: Database) -> None:
        await _load_snapshot(db, "send_to_nowhere")
        await _run_per_ga(db, "14/0/0")
        codes = await _codes(db)
        assert "SEND_TO_NOWHERE" in codes


class TestBusWideSnapshots:
    @pytest.mark.asyncio
    async def test_snapshot_multi_time_master(self, db: Database) -> None:
        await _load_snapshot(db, "multi_time_master")
        await _run_bus_wide(db)
        codes = await _codes(db)
        assert "MULTI_TIME_MASTER" in codes

    @pytest.mark.asyncio
    async def test_snapshot_orphan_ga(self, db: Database) -> None:
        await _load_snapshot(db, "orphan_ga")
        await _run_bus_wide(db)
        codes = await _codes(db)
        assert "ORPHAN_GA" in codes

    @pytest.mark.asyncio
    async def test_snapshot_stale_ga(self, db: Database) -> None:
        await _load_snapshot(db, "stale_ga")
        await _run_bus_wide(db)
        codes = await _codes(db)
        assert "STALE_GA" in codes

    @pytest.mark.asyncio
    async def test_snapshot_health_busload(self, db: Database) -> None:
        await _load_snapshot(db, "health_busload")
        await _run_bus_wide(db)
        codes = await _codes(db)
        assert "HEALTH_BUSLOAD" in codes

    @pytest.mark.asyncio
    async def test_snapshot_reconnect_storm(self, db: Database) -> None:
        await _load_snapshot(db, "reconnect_storm")
        await _run_bus_wide(db)
        codes = await _codes(db)
        assert "RECONNECT_STORM" in codes

    @pytest.mark.asyncio
    async def test_snapshot_send_cycle_drift(self, db: Database) -> None:
        await _load_snapshot(db, "send_cycle_drift")
        await _run_bus_wide(db)
        codes = await _codes(db)
        assert "SEND_CYCLE_DRIFT" in codes


async def _codes(db: Database) -> set[str]:
    repo = FindingsRepository(db)
    resp = await list_findings_response(repo, limit=200)
    return {item["code"] for item in resp["items"]}
