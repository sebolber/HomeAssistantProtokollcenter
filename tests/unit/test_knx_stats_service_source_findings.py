"""Iter H (knx-detail-panes): Findings-Liste im Source-Detail.

Vertrag aus `docs/messagehub_knx_detail_panes_handover.md`:
- compute_source_detail liefert detail.findings mit allen Findings
  fuer die gegebene dev_source.
- FindingsRepository optional an Service uebergeben (Konstruktor-Kwarg);
  ohne FindingsRepo kommt detail.findings als leere Liste.
- Frontend rendert die Findings im Source-Detail-Pane.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.knx_stats_service import (
    KnxStatsService,
    source_detail_to_dict,
)
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


def _from_to() -> tuple[str, str]:
    return _ts(-60), _ts(3600)


async def _insert_telegram(
    db: Database,
    *,
    ga: str,
    ts: str,
    source: str = "1.1.10",
) -> None:
    await db.execute(
        "INSERT INTO knx_raw_telegrams "
        "(timestamp, destination, source, telegramtype, value, repeated) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (ts, ga, source, "GroupValueWrite", '"1"', 0),
    )


def _make_finding(
    *,
    source: str | None,
    code: str = "RECONNECT_STORM",
    ga: str | None = None,
    severity: str = "warning",
) -> Finding:
    # ON CONFLICT in knx_findings ist (code, ga, evidence_hash, schema_version)
    # — wir baken source in evidence ein, damit zwei Findings mit
    # gleichem code/ga aber unterschiedlicher source nicht dedup'pen.
    now = datetime.now(UTC).replace(microsecond=0)
    return Finding(
        code=code,
        schema_version=1,
        severity=severity,  # type: ignore[arg-type]
        ga=ga,
        source=source,
        evidence={"source": source, "sample": "data"},
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=f"{code}/v1",
    )


class TestSourceDetailFindings:
    @pytest.mark.asyncio
    async def test_source_detail_includes_findings_for_source(
        self, db: Database
    ) -> None:
        # Arrange: ein Telegramm + ein Finding fuer dieselbe Source.
        await _insert_telegram(db, ga="1/1/1", ts=_ts(0), source="1.1.10")
        findings_repo = FindingsRepository(db)
        await findings_repo.record(
            _make_finding(source="1.1.10", code="RECONNECT_STORM"),
        )
        await findings_repo.record(
            _make_finding(source="1.1.10", code="DPT_MISMATCH", ga="1/1/1"),
        )
        # Andere Source darf NICHT auftauchen.
        await findings_repo.record(
            _make_finding(source="1.1.99", code="RECONNECT_STORM"),
        )

        svc = KnxStatsService(
            KnxStatsRepository(db), findings_repo=findings_repo,
        )
        from_iso, to_iso = _from_to()

        # Act
        detail = await svc.compute_source_detail("1.1.10", from_iso, to_iso)

        # Assert
        assert detail is not None
        codes = sorted(f.code for f in detail.findings)
        assert codes == ["DPT_MISMATCH", "RECONNECT_STORM"]
        # Keine Findings einer fremden Source.
        for f in detail.findings:
            assert f.source == "1.1.10"

    @pytest.mark.asyncio
    async def test_source_detail_findings_empty_when_repo_not_provided(
        self, db: Database
    ) -> None:
        # Service ohne findings_repo: findings sollte [] sein, NICHT crashen.
        await _insert_telegram(db, ga="1/1/1", ts=_ts(0), source="1.1.10")
        svc = KnxStatsService(KnxStatsRepository(db))
        from_iso, to_iso = _from_to()
        detail = await svc.compute_source_detail("1.1.10", from_iso, to_iso)

        assert detail is not None
        assert detail.findings == []

    @pytest.mark.asyncio
    async def test_source_detail_findings_empty_when_no_findings_match(
        self, db: Database
    ) -> None:
        # FindingsRepo vorhanden, aber kein Finding fuer 1.1.10.
        await _insert_telegram(db, ga="1/1/1", ts=_ts(0), source="1.1.10")
        findings_repo = FindingsRepository(db)
        await findings_repo.record(
            _make_finding(source="1.1.99", code="RECONNECT_STORM"),
        )

        svc = KnxStatsService(
            KnxStatsRepository(db), findings_repo=findings_repo,
        )
        from_iso, to_iso = _from_to()
        detail = await svc.compute_source_detail("1.1.10", from_iso, to_iso)

        assert detail is not None
        assert detail.findings == []


class TestSourceDetailFindingsSerialisation:
    @pytest.mark.asyncio
    async def test_source_detail_to_dict_includes_findings_key(
        self, db: Database
    ) -> None:
        await _insert_telegram(db, ga="1/1/1", ts=_ts(0), source="1.1.10")
        findings_repo = FindingsRepository(db)
        await findings_repo.record(
            _make_finding(source="1.1.10", code="RECONNECT_STORM"),
        )
        svc = KnxStatsService(
            KnxStatsRepository(db), findings_repo=findings_repo,
        )
        from_iso, to_iso = _from_to()
        detail = await svc.compute_source_detail("1.1.10", from_iso, to_iso)
        assert detail is not None

        result = source_detail_to_dict(detail)
        assert "findings" in result
        assert isinstance(result["findings"], list)
        assert len(result["findings"]) == 1
        first = result["findings"][0]
        # Erwartete Felder fuer das Frontend.
        assert first["code"] == "RECONNECT_STORM"
        assert first["source"] == "1.1.10"
        assert "severity" in first
        assert "title" in first
