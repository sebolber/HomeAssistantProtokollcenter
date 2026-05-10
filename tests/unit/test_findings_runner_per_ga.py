"""Iter 29a (knx-findings): Per-GA-Detector-Runner — Smoke-Test.

Vertrag aus dem Wiring-Audit (docs/messagehub_knx_findings_wiring_audit.md):
Der Runner verbindet die Bausteine aus Iter 11-22 zu einem End-to-End-
Pfad. Der Smoke-Test wird erst gruen, wenn alle Bausteine zusammen-
stecken: Schema-Migration -> Detector -> Runner -> Repo -> API.

Naming-Konvention `test_<feature>_visible_after_<trigger>`.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.findings_runner import (
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


@pytest.fixture
async def db(tmp_path: Path):
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


def _ts(offset_seconds: float, *, base: datetime | None = None) -> str:
    base_dt = base or datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
    return (base_dt + timedelta(seconds=offset_seconds)).isoformat(timespec="seconds")


async def _insert_telegram(
    db: Database,
    *,
    ga: str,
    ts: str,
    value: object,
    dev_source: str = "1.1.5",
    telegramtype: str = "GroupValueWrite",
) -> None:
    await db.execute(
        "INSERT INTO knx_raw_telegrams "
        "(timestamp, destination, source, telegramtype, value, repeated) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (ts, ga, dev_source, telegramtype, json.dumps(value, default=str), 0),
    )


async def _insert_ga(db: Database, *, ga: str, dpt: str, label: str = "Sensor") -> None:
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (ga, label, dpt, now, now),
    )


class TestPerGaDetectorRunnerSmoke:
    @pytest.mark.asyncio
    async def test_dpt_mismatch_finding_visible_via_api_after_telegrams_inserted(
        self, db: Database
    ) -> None:
        """Iter 29a-Smoke: Soll-DPT 9.001 + 0/1-Telegramme -> DPT_MISMATCH.

        Verkettet: Telegram-Insert -> Runner -> infer_dpt_from_samples ->
        set_dpt_inferred -> detect_dpt_mismatch -> resolve_severity ->
        record -> list_findings_response.
        """
        # Arrange — GA mit Soll-DPT 9.001 (Temperatur), aber 30 Telegramme
        # mit 0/1-Werten (Auto-Erkenner liefert 1.001).
        ga = "1/2/3"
        await _insert_ga(db, ga=ga, dpt="9.001", label="Temperatur Bad")
        for i in range(30):
            await _insert_telegram(
                db,
                ga=ga,
                ts=_ts(i),
                value=i % 2,
            )

        repo = FindingsRepository(db)
        knx_repo = KnxAddressRepository(db)
        stats_repo = KnxStatsRepository(db)
        now = datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC)

        # Act — Runner manuell triggern (im Service-/API-Pfad ist das
        # in Iter 29a der POST /findings/refresh-Handler).
        await run_per_ga_detectors(
            ga=ga,
            findings_repo=repo,
            address_repo=knx_repo,
            stats_repo=stats_repo,
            period_from=_ts(-3600),
            period_to=_ts(3600),
            now=now,
        )

        # Assert — Finding sichtbar via Service-Layer (= API-Endpoint).
        resp = await list_findings_response(repo, ga=ga, code="DPT_MISMATCH")
        assert resp["total"] == 1, resp
        item = resp["items"][0]
        assert item["code"] == "DPT_MISMATCH"
        assert item["ga"] == ga
        assert item["evidence"]["project_dpt"] == "9.001"
        assert item["evidence"]["inferred_dpt"] == "1.001"
        # Confidence muss ueber dem Detector-Threshold liegen.
        assert item["evidence"]["confidence"] >= 0.85

    @pytest.mark.asyncio
    async def test_set_dpt_inferred_persisted_after_runner(self, db: Database) -> None:
        """Iter 11-Wiring: Runner persistiert das Inferenz-Ergebnis."""
        ga = "1/2/4"
        await _insert_ga(db, ga=ga, dpt="9.001")
        for i in range(30):
            await _insert_telegram(db, ga=ga, ts=_ts(i), value=i % 2)

        repo = FindingsRepository(db)
        knx_repo = KnxAddressRepository(db)
        stats_repo = KnxStatsRepository(db)
        await run_per_ga_detectors(
            ga=ga,
            findings_repo=repo,
            address_repo=knx_repo,
            stats_repo=stats_repo,
            period_from=_ts(-3600),
            period_to=_ts(3600),
            now=datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC),
        )

        # Inferenz-Ergebnis muss in knx_group_addresses landen.
        result = await knx_repo.get_dpt_inferred(ga)
        assert result is not None
        inferred_dpt, confidence, _at = result
        assert inferred_dpt == "1.001"
        assert confidence >= 0.85

    @pytest.mark.asyncio
    async def test_value_out_of_range_finding_visible_via_api_after_runner(
        self, db: Database
    ) -> None:
        """Iter 13-Wiring: Per-Sample VALUE_OUT_OF_RANGE."""
        ga = "1/2/5"
        await _insert_ga(db, ga=ga, dpt="5.001")  # Prozent 0-100
        # Ein Wert weit ausserhalb (200).
        await _insert_telegram(db, ga=ga, ts=_ts(0), value=200)

        repo = FindingsRepository(db)
        knx_repo = KnxAddressRepository(db)
        stats_repo = KnxStatsRepository(db)
        await run_per_ga_detectors(
            ga=ga,
            findings_repo=repo,
            address_repo=knx_repo,
            stats_repo=stats_repo,
            period_from=_ts(-3600),
            period_to=_ts(3600),
            now=datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC),
        )

        resp = await list_findings_response(repo, ga=ga, code="VALUE_OUT_OF_RANGE")
        assert resp["total"] == 1
        assert resp["items"][0]["evidence"]["value"] == 200.0

    @pytest.mark.asyncio
    async def test_severity_override_applied_when_set(self, db: Database) -> None:
        """Iter 4-Wiring: User-Override greift im Runner via resolve_severity."""
        # Arrange — User setzt VALUE_OUT_OF_RANGE Default-Severity error
        # ueber auf info.
        ga = "1/2/6"
        await _insert_ga(db, ga=ga, dpt="5.001")
        await _insert_telegram(db, ga=ga, ts=_ts(0), value=200)

        repo = FindingsRepository(db)
        await repo.set_severity_override(
            code="VALUE_OUT_OF_RANGE",
            severity="info",
            actor="testuser",
        )

        knx_repo = KnxAddressRepository(db)
        stats_repo = KnxStatsRepository(db)
        await run_per_ga_detectors(
            ga=ga,
            findings_repo=repo,
            address_repo=knx_repo,
            stats_repo=stats_repo,
            period_from=_ts(-3600),
            period_to=_ts(3600),
            now=datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC),
        )

        # Severity muss als "info" landen, nicht als "error".
        resp = await list_findings_response(repo, ga=ga, code="VALUE_OUT_OF_RANGE")
        assert resp["total"] == 1
        assert resp["items"][0]["severity"] == "info"

    @pytest.mark.asyncio
    async def test_runner_safe_for_unknown_ga_without_telegrams(self, db: Database) -> None:
        """Defensiv: GA ohne Telegramme darf den Runner nicht crashen."""
        repo = FindingsRepository(db)
        knx_repo = KnxAddressRepository(db)
        stats_repo = KnxStatsRepository(db)
        await run_per_ga_detectors(
            ga="9/9/9",
            findings_repo=repo,
            address_repo=knx_repo,
            stats_repo=stats_repo,
            period_from=_ts(-3600),
            period_to=_ts(3600),
            now=datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC),
        )
        resp = await list_findings_response(repo, ga="9/9/9")
        assert resp["total"] == 0


class TestRefreshFindingsResponse:
    """Iter 29a: Service-Layer fuer POST /findings/refresh."""

    @pytest.mark.asyncio
    async def test_refresh_endpoint_runs_runner_and_reports_count(self, db: Database) -> None:
        from custom_components.messagehub.processing.findings_service import (
            refresh_findings_response,
        )

        ga = "1/2/7"
        await _insert_ga(db, ga=ga, dpt="5.001")
        await _insert_telegram(db, ga=ga, ts=_ts(0), value=200)

        repo = FindingsRepository(db)
        knx_repo = KnxAddressRepository(db)
        stats_repo = KnxStatsRepository(db)
        result = await refresh_findings_response(
            repo,
            ga=ga,
            period_days=1,
            address_repo=knx_repo,
            stats_repo=stats_repo,
            now=datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC),
        )

        assert result["ga"] == ga
        assert result["period_days"] == 1
        assert result["findings_recorded"] >= 1

    @pytest.mark.asyncio
    async def test_refresh_rejects_invalid_ga(self, db: Database) -> None:
        from custom_components.messagehub.processing.findings_service import (
            refresh_findings_response,
        )

        repo = FindingsRepository(db)
        knx_repo = KnxAddressRepository(db)
        stats_repo = KnxStatsRepository(db)
        with pytest.raises(ValueError):
            await refresh_findings_response(
                repo,
                ga="not-a-ga",
                period_days=7,
                address_repo=knx_repo,
                stats_repo=stats_repo,
                now=datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC),
            )

    @pytest.mark.asyncio
    async def test_refresh_clamps_period_days(self, db: Database) -> None:
        from custom_components.messagehub.processing.findings_service import (
            MAX_REFRESH_PERIOD_DAYS,
            MIN_REFRESH_PERIOD_DAYS,
            refresh_findings_response,
        )

        ga = "1/2/8"
        await _insert_ga(db, ga=ga, dpt="5.001")
        repo = FindingsRepository(db)
        knx_repo = KnxAddressRepository(db)
        stats_repo = KnxStatsRepository(db)
        # period_days > MAX → clamped auf MAX.
        result = await refresh_findings_response(
            repo,
            ga=ga,
            period_days=99999,
            address_repo=knx_repo,
            stats_repo=stats_repo,
            now=datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC),
        )
        assert result["period_days"] == MAX_REFRESH_PERIOD_DAYS

        # period_days < MIN → clamped auf MIN.
        result_min = await refresh_findings_response(
            repo,
            ga=ga,
            period_days=0,
            address_repo=knx_repo,
            stats_repo=stats_repo,
            now=datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC),
        )
        assert result_min["period_days"] == MIN_REFRESH_PERIOD_DAYS
