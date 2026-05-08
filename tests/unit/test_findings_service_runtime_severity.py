"""Iter B4: Severity wird beim List-Endpoint zur Laufzeit aufgeloest.

Konzept-Schwaeche B4: Bisher kam die Severity direkt aus der DB-Row.
User-Overrides oder ein Default-Wechsel im Code wirkten damit nur auf
Findings, die NACH der Aenderung neu geschrieben wurden — alte Rows
behielten ihre Severity, UI sortierte sich inkonsistent.

Loesung: ``list_findings_response`` ruft fuer jeden Item-Code
``repo.resolve_severity`` auf (mit Per-Code-Cache, damit es nicht
N+1 wird). Damit greifen Overrides immer.
"""

from __future__ import annotations

from datetime import datetime

import pytest

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings_service import (
    list_findings_response,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.findings_repo import FindingsRepository
from custom_components.messagehub.storage.migrations import (
    MigrationRunner,
    discover_migrations,
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


def _record(severity: str = "warning") -> Finding:
    return Finding(
        code="DPT_MISMATCH",
        schema_version=2,
        severity=severity,  # type: ignore[arg-type]
        ga="1/2/3",
        source=None,
        evidence={
            "project_dpt": "9.001",
            "inferred_dpt": "1.001",
            "confidence": 0.9,
            "samples": 50,
        },
        first_seen=datetime(2026, 5, 8, 10, 0, 0),
        last_seen=datetime(2026, 5, 8, 10, 0, 0),
        occurrence_count=1,
        detector_version="DPT_MISMATCH/v2",
    )


@pytest.mark.asyncio
async def test_response_severity_picks_up_override(
    repo: FindingsRepository,
) -> None:
    """User stuft DPT_MISMATCH von ``warning`` (Default) auf ``error``
    hoch. Bestehende Rows in der DB hatten ``warning`` als Severity —
    die API soll ``error`` liefern."""
    await repo.record(_record(severity="warning"))
    await repo.set_severity_override(
        code="DPT_MISMATCH", severity="error", actor="u",
    )

    resp = await list_findings_response(repo)
    assert len(resp["items"]) == 1
    assert resp["items"][0]["severity"] == "error"


@pytest.mark.asyncio
async def test_response_severity_falls_back_to_default(
    repo: FindingsRepository,
) -> None:
    """Ohne Override liefert die Response den Default aus ``const.py``."""
    await repo.record(_record(severity="info"))  # Stale Row mit altem Wert
    resp = await list_findings_response(repo)
    # KNX_FINDING_DEFAULT_SEVERITIES["DPT_MISMATCH"] = "warning" (Iter B2).
    assert resp["items"][0]["severity"] == "warning"


@pytest.mark.asyncio
async def test_response_severity_caches_per_code(
    repo: FindingsRepository,
) -> None:
    """N Items mit gleichem Code → resolve_severity wird nur einmal
    pro Code aufgerufen (kein N+1)."""
    for i in range(5):
        f = _record(severity="warning")
        f_evidence = dict(f.evidence)
        f_evidence["confidence"] = 0.9 + i * 0.01
        # neuer Hash je iter — also wird's KEIN Dedup.
        # Aber Code bleibt gleich -> nur 1 resolve_severity-Call gewuenscht.
        await repo.record(
            Finding(
                code=f.code,
                schema_version=f.schema_version,
                severity=f.severity,
                ga=f"1/2/{i}",  # andere GA -> andere Identitaet
                source=None,
                evidence=f_evidence,
                first_seen=f.first_seen,
                last_seen=f.last_seen,
                occurrence_count=1,
                detector_version=f.detector_version,
            )
        )
    calls: list[str] = []
    original = repo.resolve_severity

    async def _spy(code: str) -> str:
        calls.append(code)
        return await original(code)

    repo.resolve_severity = _spy  # type: ignore[method-assign]
    resp = await list_findings_response(repo)
    assert len(resp["items"]) == 5
    # 5 Items, gleicher Code -> 1 Aufloesungs-Call dank Cache.
    assert calls.count("DPT_MISMATCH") == 1
