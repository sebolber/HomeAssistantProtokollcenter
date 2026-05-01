"""Tests fuer Reports, Remediation, KNX (Iter 46-48)."""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx import (
    extract_group_address,
    load_ets_csv,
    lookup_label,
)
from custom_components.messagehub.processing.remediation import (
    RemediationHook,
    is_auto,
    matches,
)
from custom_components.messagehub.processing.reports import generate_weekly_report
from custom_components.messagehub.storage import (
    Database,
    Message,
    MessageRepository,
    MigrationRunner,
    Severity,
)


@pytest.fixture
async def db_repo(tmp_path: Path):  # type: ignore[no-untyped-def]
    db = Database(tmp_path / "m.db")
    await db.open()
    await MigrationRunner(db).run()
    try:
        yield db, MessageRepository(db)
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_weekly_report_contains_counts(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, repo = db_repo
    await repo.insert(Message(severity=Severity.ERROR, source="x", text="boom"))
    await repo.insert(Message(severity=Severity.WARNING, source="y", text="meh"))
    md = await generate_weekly_report(db)
    assert "Errors: 1" in md
    assert "Warnings: 1" in md
    assert "x: 1" in md
    assert "y: 1" in md


def test_remediation_suggestion_mode_does_not_execute() -> None:
    h = RemediationHook(
        id=None,
        name="x",
        source_pattern="x",
        fingerprint=None,
        automation_id="script.x",
        confirm_required=True,
    )
    assert is_auto(h) is False


def test_remediation_auto_mode_executes() -> None:
    h = RemediationHook(
        id=None,
        name="x",
        source_pattern="x",
        fingerprint=None,
        automation_id="script.x",
        confirm_required=False,
    )
    assert is_auto(h) is True


def test_remediation_matches_by_source() -> None:
    h = RemediationHook(
        id=None,
        name="x",
        source_pattern="pihole",
        fingerprint=None,
        automation_id="x",
    )
    assert matches(h, "pihole", None) is True
    assert matches(h, "anders", None) is False


def test_remediation_matches_by_fingerprint() -> None:
    h = RemediationHook(
        id=None,
        name="x",
        source_pattern="any",
        fingerprint="abc",
        automation_id="x",
    )
    assert matches(h, "any", "abc") is True


@pytest.mark.parametrize(
    ("text", "ga"),
    [
        ("Telegramm an 1/2/3 ok", "1/2/3"),
        ("noise 11/22/33 weiteres", "11/22/33"),
        ("nichts hier", None),
    ],
)
def test_knx_extract_group_address(text: str, ga: str | None) -> None:
    assert extract_group_address(text) == ga


def test_knx_load_csv_and_lookup() -> None:
    csv_content = (
        "address;name;type\n"
        "1/2/3;Wohnzimmer Deckenlicht;DPT_1.001\n"
        "4/5/6;Kueche Steckdose;DPT_1.001\n"
    )
    lookup = load_ets_csv(csv_content.replace(";", ","))
    assert lookup["1/2/3"] == "Wohnzimmer Deckenlicht"
    assert lookup_label("Telegramm an 1/2/3", lookup) == "Wohnzimmer Deckenlicht"
    assert lookup_label("Telegramm an 9/9/9", lookup) is None
