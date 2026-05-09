"""Iter F2: Repair-Issue ``knx_unavailable`` nur bei aktiver KNX-Nutzung.

Konzept-Schwaeche F2: Bisher feuerte ``report_knx_unavailable`` immer,
sobald xknx beim Setup nicht da war. Bei Installationen ohne KNX
spammte das Issue-Center.

Loesung: ``_report_knx_repair_if_user_wants_it`` prueft, ob der User
mind. eine GA mit ``log_enabled=1`` hat — sonst kein Issue.
"""

from __future__ import annotations

from typing import Any

import pytest

from custom_components.messagehub.listeners.knx import (
    _report_knx_repair_if_user_wants_it,
)
from custom_components.messagehub.processing.knx_repo import (
    KnxAddress,
    KnxAddressRepository,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.migrations import (
    MigrationRunner,
    discover_migrations,
)


class _IssueRecordingHass:
    def __init__(self) -> None:
        self.created: list[str] = []

    async def async_add_executor_job(self, *args: Any, **_kw: Any) -> Any:
        return None


@pytest.fixture
async def db(tmp_path):  # type: ignore[no-untyped-def]
    database = Database(tmp_path / "test.db")
    await database.open()
    await MigrationRunner(database, migrations=discover_migrations()).run()
    try:
        yield database
    finally:
        await database.close()


@pytest.mark.asyncio
async def test_no_issue_when_no_logged_addresses(
    monkeypatch, db: Database
) -> None:
    """Frisch installierte Anlage ohne GA-Whitelist → kein Repair-Issue."""
    called: list[bool] = []
    monkeypatch.setattr(
        "custom_components.messagehub.listeners.knx.report_knx_unavailable",
        lambda _hass: called.append(True),
    )
    repo = KnxAddressRepository(db)
    await _report_knx_repair_if_user_wants_it(
        _IssueRecordingHass(), repo
    )
    assert called == []


@pytest.mark.asyncio
async def test_issue_when_at_least_one_log_enabled_address(
    monkeypatch, db: Database
) -> None:
    """User hat eine GA aktiv geloggt → Repair-Issue greift."""
    called: list[bool] = []
    monkeypatch.setattr(
        "custom_components.messagehub.listeners.knx.report_knx_unavailable",
        lambda _hass: called.append(True),
    )
    repo = KnxAddressRepository(db)
    await repo.upsert(
        KnxAddress(
            address="1/2/3",
            label="Wohnzimmer",
            log_enabled=True,
        )
    )
    await _report_knx_repair_if_user_wants_it(
        _IssueRecordingHass(), repo
    )
    assert called == [True]


@pytest.mark.asyncio
async def test_no_issue_when_addresses_exist_but_none_log_enabled(
    monkeypatch, db: Database
) -> None:
    """ETS-Sync hat Adressen importiert, aber ohne log_enabled=1 →
    kein Issue."""
    called: list[bool] = []
    monkeypatch.setattr(
        "custom_components.messagehub.listeners.knx.report_knx_unavailable",
        lambda _hass: called.append(True),
    )
    repo = KnxAddressRepository(db)
    await repo.upsert(
        KnxAddress(
            address="1/2/3",
            label="Wohnzimmer",
            log_enabled=False,
        )
    )
    await _report_knx_repair_if_user_wants_it(
        _IssueRecordingHass(), repo
    )
    assert called == []
