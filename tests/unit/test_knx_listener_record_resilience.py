"""Iter 90 / CR-34: _record_bus_activity-Crash-Resilienz.

Wenn das KnxStatsRepository unter Last (DB-Lock, fehlerhaftes
Telegramm) eine Exception wirft, darf das den KNX-Hot-Path NICHT
abbrechen — Telegramme aus der Whitelist gehen weiter ins Logbuch.
"""

from __future__ import annotations

from typing import Any

import pytest

from custom_components.messagehub.const import HASS_KEY_KNX_BUS_ANALYSIS, DOMAIN
from custom_components.messagehub.listeners.knx import (
    KnxTelegramData,
    _record_bus_activity,
)


class _FakeHass:
    def __init__(self, bus_analysis: bool = True) -> None:
        self.data: dict[str, Any] = {DOMAIN: {HASS_KEY_KNX_BUS_ANALYSIS: bus_analysis}}


def _make_telegram() -> KnxTelegramData:
    return KnxTelegramData(
        source="1.1.5",
        destination="1/2/3",
        telegramtype="GroupValueWrite",
        value=1,
        raw=None,
        repeated=False,
    )


@pytest.mark.asyncio
async def test_value_error_in_insert_raw_does_not_crash() -> None:
    class _CrashingRepo:
        async def insert_raw(self, **_kwargs: Any) -> None:
            raise ValueError("simulated DB lock")

        async def increment_counter(self, *_args: Any, **_kwargs: Any) -> None:
            pass  # nicht erreicht

    # Soll keine Exception werfen.
    await _record_bus_activity(_FakeHass(), _CrashingRepo(), _make_telegram())


@pytest.mark.asyncio
async def test_runtime_error_in_increment_does_not_crash() -> None:
    class _PartiallyCrashingRepo:
        async def insert_raw(self, **_kwargs: Any) -> None:
            pass  # erfolgreich

        async def increment_counter(self, *_args: Any, **_kwargs: Any) -> None:
            raise RuntimeError("counter table corrupt")

    await _record_bus_activity(
        _FakeHass(), _PartiallyCrashingRepo(), _make_telegram()
    )


@pytest.mark.asyncio
async def test_disabled_flag_skips_repo_call() -> None:
    """Wenn der Bus-Analyse-Toggle aus ist, darf insert_raw NICHT
    aufgerufen werden — auch keine Exception soll geworfen werden.
    """
    calls = {"insert_raw": 0, "increment_counter": 0}

    class _CountingRepo:
        async def insert_raw(self, **_kwargs: Any) -> None:
            calls["insert_raw"] += 1

        async def increment_counter(self, *_args: Any, **_kwargs: Any) -> None:
            calls["increment_counter"] += 1

    hass = _FakeHass(bus_analysis=False)
    await _record_bus_activity(hass, _CountingRepo(), _make_telegram())
    assert calls == {"insert_raw": 0, "increment_counter": 0}


@pytest.mark.asyncio
async def test_enabled_flag_calls_both_repo_methods() -> None:
    calls = {"insert_raw": 0, "increment_counter": 0}

    class _CountingRepo:
        async def insert_raw(self, **_kwargs: Any) -> None:
            calls["insert_raw"] += 1

        async def increment_counter(self, *_args: Any, **_kwargs: Any) -> None:
            calls["increment_counter"] += 1

    await _record_bus_activity(_FakeHass(), _CountingRepo(), _make_telegram())
    assert calls == {"insert_raw": 1, "increment_counter": 1}
