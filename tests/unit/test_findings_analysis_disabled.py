"""Iter A3: ANALYSIS_DISABLED-Finding wenn Bus-Analyse-Toggle aus ist.

Konzept-Schwaeche A3: Wenn der Listener-Toggle ausgeschaltet ist,
laufen alle Detektoren weiter, aber knx_raw_telegrams ist leer —
Findings-Tab zeigt "alles OK", obwohl die Datenquelle abgeklemmt ist.
Loesung: Vor dem Detector-Run pruefen wir den Toggle; bei OFF wird
genau EIN Finding ``ANALYSIS_DISABLED`` (severity=warning) emittiert.
"""

from __future__ import annotations

from datetime import UTC, datetime

import pytest

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings_runner import (
    build_analysis_disabled_finding,
)


def test_analysis_disabled_emits_warning_finding() -> None:
    finding = build_analysis_disabled_finding(now=datetime.now(UTC))
    assert isinstance(finding, Finding)
    assert finding.code == "ANALYSIS_DISABLED"
    assert finding.severity == "warning"
    # Ein bus-weites Finding — keine GA, keine spezifische Source.
    assert finding.ga is None
    assert finding.source is None
    # Evidence enthaelt einen erklaerenden Hinweis fuer die UI.
    assert "reason" in finding.evidence


@pytest.mark.asyncio
async def test_run_bus_wide_detectors_with_disabled_returns_disabled_only(
    tmp_path,  # type: ignore[no-untyped-def]
) -> None:
    """Wenn der Toggle aus ist, laeuft KEIN Detektor — nur ANALYSIS_DISABLED."""
    from custom_components.messagehub.processing.findings_runner import (
        run_bus_wide_detectors,
    )
    from custom_components.messagehub.processing.knx_repo import (
        KnxAddressRepository,
    )
    from custom_components.messagehub.storage.database import Database
    from custom_components.messagehub.storage.findings_repo import (
        FindingsRepository,
    )
    from custom_components.messagehub.storage.knx_stats_repo import (
        KnxStatsRepository,
    )
    from custom_components.messagehub.storage.migrations import (
        MigrationRunner,
        discover_migrations,
    )

    db = Database(tmp_path / "test.db")
    await db.open()
    try:
        await MigrationRunner(db, migrations=discover_migrations()).run()
        findings_repo = FindingsRepository(db)
        recorded = await run_bus_wide_detectors(
            findings_repo=findings_repo,
            address_repo=KnxAddressRepository(db),
            stats_repo=KnxStatsRepository(db),
            period_from="2026-05-08T00:00:00",
            period_to="2026-05-08T23:59:59",
            now=datetime(2026, 5, 8, 23, 59, 59),
            bus_analysis_enabled=False,
        )
        assert recorded == 1
        items = await findings_repo.list_findings()
        assert len(items) == 1
        assert items[0].code == "ANALYSIS_DISABLED"
        assert items[0].severity == "warning"
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_run_bus_wide_detectors_with_enabled_runs_detectors(
    tmp_path,  # type: ignore[no-untyped-def]
) -> None:
    """Wenn der Toggle an ist, laufen die Detektoren wie gewohnt — ohne
    ANALYSIS_DISABLED-Eintrag."""
    from custom_components.messagehub.processing.findings_runner import (
        run_bus_wide_detectors,
    )
    from custom_components.messagehub.processing.knx_repo import (
        KnxAddressRepository,
    )
    from custom_components.messagehub.storage.database import Database
    from custom_components.messagehub.storage.findings_repo import (
        FindingsRepository,
    )
    from custom_components.messagehub.storage.knx_stats_repo import (
        KnxStatsRepository,
    )
    from custom_components.messagehub.storage.migrations import (
        MigrationRunner,
        discover_migrations,
    )

    db = Database(tmp_path / "test.db")
    await db.open()
    try:
        await MigrationRunner(db, migrations=discover_migrations()).run()
        findings_repo = FindingsRepository(db)
        # Default-Argument testen — bus_analysis_enabled muss True bleiben.
        recorded = await run_bus_wide_detectors(
            findings_repo=findings_repo,
            address_repo=KnxAddressRepository(db),
            stats_repo=KnxStatsRepository(db),
            period_from="2026-05-08T00:00:00",
            period_to="2026-05-08T23:59:59",
            now=datetime(2026, 5, 8, 23, 59, 59),
        )
        # Leere DB liefert vermutlich 0 Findings, aber kein ANALYSIS_DISABLED.
        items = await findings_repo.list_findings()
        codes = {it.code for it in items}
        assert "ANALYSIS_DISABLED" not in codes
        assert recorded == len(items)
    finally:
        await db.close()
