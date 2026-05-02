"""v0.4-Tests: KNX-DPT-Formatter, MTTR, Severity-Time-Series."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_dpt import (
    format_value,
    is_alarm_active,
)
from custom_components.messagehub.storage import (
    Database,
    Message,
    MessageRepository,
    MigrationRunner,
    Severity,
)

# ─── KNX DPT-Formatter ───────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("dpt", "value", "expected"),
    [
        ("1.001", True, "ON"),
        ("1.001", False, "OFF"),
        ("1.001", 1, "ON"),
        ("1.001", 0, "OFF"),
        ("1.001", "true", "ON"),
        ("1.001", "FALSE", "OFF"),
        ("1.005", True, "Alarm"),
        ("1.005", False, "OK"),
        ("1.009", True, "Closed"),
        ("1.009", False, "Open"),
        ("1.018", True, "Occupied"),
        ("1.018", False, "Not occupied"),
    ],
)
def test_dpt_boolean_formatting(dpt: str, value: object, expected: str) -> None:
    assert format_value(dpt, value) == expected


@pytest.mark.parametrize(
    ("dpt", "value", "expected"),
    [
        ("9.001", 21.5, "21.5 °C"),
        ("9.001", 21.0, "21 °C"),
        ("9.001", -5.25, "-5.25 °C"),
        ("9.005", 4.2, "4.2 m/s"),
        ("9.007", 65.0, "65 %"),
        ("5.001", 75, "75 %"),
        ("13.013", 1234, "1234 kWh"),
        ("14.027", 230.5, "230.5 V"),
    ],
)
def test_dpt_numeric_formatting(dpt: str, value: object, expected: str) -> None:
    assert format_value(dpt, value) == expected


def test_dpt_string() -> None:
    assert format_value("16.000", "  Wohnzimmer  ") == "Wohnzimmer"


def test_dpt_rgb() -> None:
    assert format_value("232.600", {"red": 255, "green": 100, "blue": 50}) == ("RGB(255, 100, 50)")


def test_dpt_unknown_falls_back_to_str() -> None:
    assert format_value("99.999", 42) == "42"
    assert format_value(None, "raw") == "raw"
    assert format_value("9.001", None) == ""


def test_alarm_detection() -> None:
    assert is_alarm_active("1.005", True) is True
    assert is_alarm_active("1.005", False) is False
    assert is_alarm_active("1.005", "alarm") is True
    assert is_alarm_active("1.001", True) is None  # nicht 1.005
    assert is_alarm_active(None, True) is None


def test_dpt_date_11_001() -> None:
    # (day, month, year-2-stellig) → 01.05.2026
    assert format_value("11.001", (1, 5, 26)) == "01.05.2026"
    # year >= 90 = 19xx
    assert format_value("11.001", (15, 12, 99)) == "15.12.1999"
    # Garbage faellt durch zu str()
    assert format_value("11.001", "kein-tuple") == "kein-tuple"


def test_dpt_time_10_001() -> None:
    # byte0 = (dow=5 Fr) << 5 | hour=21 = 181
    assert format_value("10.001", (181, 59, 0)) == "Fr 21:59:00"
    # dow=0 → kein Wochentag-Praefix
    assert format_value("10.001", (8, 30, 15)) == "08:30:15"
    # Mo
    assert format_value("10.001", ((1 << 5) | 9, 0, 0)) == "Mo 09:00:00"


def test_dpt_datetime_19_001() -> None:
    # (126, 5, 1, 181, 59, 0, ...) → Fr 01.05.2026 21:59:00
    assert format_value("19.001", (126, 5, 1, 181, 59, 0, 33, 0)) == "Fr 01.05.2026 21:59:00"
    # ohne dow
    assert format_value("19.001", (126, 5, 1, 21, 59, 0)) == "01.05.2026 21:59:00"


# ─── MTTR / Severity-Time-Series ─────────────────────────────────────────────


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
async def test_severity_time_series_buckets(db_repo) -> None:  # type: ignore[no-untyped-def]
    _, repo = db_repo
    now = datetime.now(UTC)
    for i in range(5):
        await repo.insert(
            Message(
                severity=Severity.WARNING,
                source="x",
                text=f"#{i}",
                timestamp=now - timedelta(minutes=i),
            )
        )
    series = await repo.severity_time_series(hours=24)
    assert series
    warnings = [s for s in series if s["severity"] == "warning"]
    total = sum(int(s["count"]) for s in warnings)
    assert total == 5


@pytest.mark.asyncio
async def test_mttr_per_source_only_resolved_errors(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, repo = db_repo
    now = datetime.now(UTC)
    base = now - timedelta(hours=2)

    err_id = await repo.insert(
        Message(severity=Severity.ERROR, source="pihole", text="dns down", timestamp=base)
    )
    # MTTR = last_seen - first_seen, also brauchen wir update
    await db.execute(
        "UPDATE messages SET last_seen = ? WHERE id = ?",
        ((base + timedelta(seconds=600)).isoformat(timespec="seconds"), err_id),
    )
    await repo.set_status(err_id, "resolved")

    # Unresolved + andere Severity sollen nicht zaehlen
    await repo.insert(
        Message(severity=Severity.ERROR, source="pihole", text="other", timestamp=base)
    )
    await repo.insert(
        Message(severity=Severity.WARNING, source="pihole", text="warn", timestamp=base)
    )

    rows = await repo.mttr_per_source(days=30)
    pihole = next((r for r in rows if r["source"] == "pihole"), None)
    assert pihole is not None
    assert pihole["resolved_count"] == 1
    assert 590 < pihole["mttr_seconds"] < 610  # ~600s


@pytest.mark.asyncio
async def test_mttr_empty_when_no_resolved(db_repo) -> None:  # type: ignore[no-untyped-def]
    _, repo = db_repo
    await repo.insert(Message(severity=Severity.ERROR, source="x", text="y"))
    rows = await repo.mttr_per_source(days=30)
    assert rows == []
