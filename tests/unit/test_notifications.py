"""Tests fuer Forwarder + Quiet Hours + Throttling + Escalation."""

from __future__ import annotations

from datetime import UTC, datetime, time, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.notifications.forwarder import (
    ChannelConfig,
    Forwarder,
)
from custom_components.messagehub.notifications.quiet_hours import (
    is_in_quiet_hours,
    parse_hhmm,
)
from custom_components.messagehub.processing.escalation import (
    EscalationEngine,
    EscalationRule,
)
from custom_components.messagehub.storage import (
    Database,
    Message,
    MessageRepository,
    MigrationRunner,
    Severity,
)


def test_parse_hhmm() -> None:
    assert parse_hhmm("22:00") == time(22, 0)
    assert parse_hhmm(None) is None
    assert parse_hhmm("xx") is None


def test_quiet_hours_simple_interval() -> None:
    assert is_in_quiet_hours(time(2, 0), time(1, 0), time(7, 0)) is True
    assert is_in_quiet_hours(time(8, 0), time(1, 0), time(7, 0)) is False


def test_quiet_hours_crosses_midnight() -> None:
    assert is_in_quiet_hours(time(23, 0), time(22, 0), time(7, 0)) is True
    assert is_in_quiet_hours(time(2, 0), time(22, 0), time(7, 0)) is True
    assert is_in_quiet_hours(time(12, 0), time(22, 0), time(7, 0)) is False


@pytest.mark.asyncio
async def test_forwarder_dispatches_to_enabled_channels() -> None:
    fwd = Forwarder()
    fwd.add_channel(ChannelConfig(name="a", channel_type="t", severity_threshold="warning"))
    fwd.add_channel(ChannelConfig(name="b", channel_type="t", severity_threshold="error"))
    sent: list[str] = []

    async def handler(ch: ChannelConfig, _msg: Message) -> None:
        sent.append(ch.name)

    fwd.register_handler("t", handler)
    msg = Message(severity=Severity.WARNING, source="x", text="hi")
    await fwd.dispatch(msg)
    assert sent == ["a"]


@pytest.mark.asyncio
async def test_quiet_hours_blocks_info_but_passes_error_when_bypass() -> None:
    fwd = Forwarder()
    fwd.add_channel(
        ChannelConfig(
            name="a",
            channel_type="t",
            severity_threshold="info",
            quiet_start="22:00",
            quiet_end="07:00",
            quiet_bypass_error=True,
        )
    )
    sent: list[str] = []

    async def handler(ch: ChannelConfig, _msg: Message) -> None:
        sent.append(ch.name)

    fwd.register_handler("t", handler)

    nighttime = datetime(2026, 5, 1, 23, 0, 0)
    msg_info = Message(severity=Severity.INFO, source="x", text="info")
    await fwd.dispatch(msg_info, now=nighttime)
    assert sent == []

    msg_err = Message(severity=Severity.ERROR, source="x", text="err")
    await fwd.dispatch(msg_err, now=nighttime)
    assert sent == ["a"]


@pytest.mark.asyncio
async def test_throttle_per_source() -> None:
    fwd = Forwarder()
    fwd.add_channel(
        ChannelConfig(
            name="a",
            channel_type="t",
            severity_threshold="info",
            throttle_seconds=10,
        )
    )
    sent: list[str] = []

    async def handler(ch: ChannelConfig, _msg: Message) -> None:
        sent.append(ch.name)

    fwd.register_handler("t", handler)

    msg = Message(severity=Severity.WARNING, source="x", text="x")
    await fwd.dispatch(msg)
    await fwd.dispatch(msg)
    assert sent == ["a"]


@pytest.mark.asyncio
async def test_escalation_fires_when_threshold_crossed(tmp_path: Path) -> None:
    db = Database(tmp_path / "m.db")
    await db.open()
    await MigrationRunner(db).run()
    repo = MessageRepository(db)

    base = datetime.now(UTC)
    for i in range(5):
        await repo.insert(
            Message(
                severity=Severity.ERROR,
                source="pihole",
                text=f"#{i}",
                timestamp=base - timedelta(seconds=i),
            )
        )

    engine = EscalationEngine(db)
    rule = EscalationRule(
        id=None,
        source_pattern="pihole",
        severity="error",
        threshold_count=3,
        window_seconds=600,
    )
    assert await engine.evaluate(rule) is True

    rule_too_high = EscalationRule(
        id=None,
        source_pattern="pihole",
        severity="error",
        threshold_count=99,
        window_seconds=600,
    )
    assert await engine.evaluate(rule_too_high) is False
    await db.close()


@pytest.mark.asyncio
async def test_escalation_cooldown_blocks_double_fire(tmp_path: Path) -> None:
    db = Database(tmp_path / "m.db")
    await db.open()
    await MigrationRunner(db).run()
    repo = MessageRepository(db)
    for _ in range(3):
        await repo.insert(Message(severity=Severity.ERROR, source="x", text="y"))

    engine = EscalationEngine(db)
    rule = EscalationRule(
        id=None,
        source_pattern="x",
        severity="error",
        threshold_count=3,
        window_seconds=600,
        cooldown_seconds=600,
        last_fired_at=datetime.now(UTC),
    )
    assert await engine.evaluate(rule) is False
    await db.close()
