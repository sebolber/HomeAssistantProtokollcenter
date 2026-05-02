"""Regressionstest fuer den xknx-Telegram-Callback (v0.10.2 Bugfix).

xknx 3.15.0 ruft `callback.callback(telegram)` synchron auf — eine
`async def`-Callback liefert nur eine Coroutine zurueck, die nie
geawaited wird (RuntimeWarning). Der Listener muss eine SYNC-Funktion
registrieren, die intern `hass.async_create_task(...)` aufruft.
"""

from __future__ import annotations

import asyncio
import inspect
from types import SimpleNamespace
from typing import Any
from unittest.mock import MagicMock

from custom_components.messagehub.listeners.knx import async_register_knx_listener


def test_xknx_callback_is_sync_not_coroutine() -> None:
    """Der bei xknx registrierte Callback muss eine sync-Funktion sein,
    keine async def. xknx 3.15.0 ruft `callback.callback(telegram)` ohne
    await auf — async wuerde stillschweigend verschluckt."""
    # Sammelt den registrierten Callback ein.
    registered_cb: list[Any] = []

    class _FakeQueue:
        def register_telegram_received_cb(self, cb: Any) -> None:
            registered_cb.append(cb)

        def unregister_telegram_received_cb(self, cb: Any) -> None:
            pass

    fake_xknx = SimpleNamespace(telegram_queue=_FakeQueue())

    fake_hass = MagicMock()
    fake_hass.data = {"knx": SimpleNamespace(xknx=fake_xknx)}
    fake_hass.async_create_task = MagicMock()

    fake_db = MagicMock()
    fake_repo = MagicMock()

    async_register_knx_listener(fake_hass, fake_db, fake_repo)

    assert len(registered_cb) == 1, "Listener sollte exakt 1 Callback registrieren"
    cb = registered_cb[0]

    # Kernverlangen: KEINE Coroutine-Funktion.
    assert not inspect.iscoroutinefunction(cb), (
        "xknx erwartet sync-Callback. async def fuehrt zu "
        "'coroutine was never awaited' und KNX-Telegramme verschwinden."
    )
    assert callable(cb)


def test_callback_scheduled_via_async_create_task() -> None:
    """Wenn der Sync-Callback ein Telegramm bekommt, muss er die echte
    Ingest-Coroutine als Task im HA-Eventloop scheduled — nicht selbst
    awaiten (das geht im sync-Kontext sowieso nicht)."""
    registered_cb: list[Any] = []

    class _FakeQueue:
        def register_telegram_received_cb(self, cb: Any) -> None:
            registered_cb.append(cb)

        def unregister_telegram_received_cb(self, cb: Any) -> None:
            pass

    fake_xknx = SimpleNamespace(telegram_queue=_FakeQueue())

    fake_hass = MagicMock()
    fake_hass.data = {"knx": SimpleNamespace(xknx=fake_xknx)}
    scheduled: list[Any] = []
    fake_hass.async_create_task = scheduled.append

    async_register_knx_listener(fake_hass, MagicMock(), MagicMock())

    cb = registered_cb[0]

    # Stub-Telegramm — wir interessieren uns nur dafuer, ob ein Task
    # scheduled wurde.
    payload_cls = type("GroupValueWrite", (), {})
    payload = payload_cls()
    payload.value = True  # type: ignore[attr-defined]
    payload.raw_value = b"\x01"  # type: ignore[attr-defined]
    telegram = SimpleNamespace(destination_address="1/2/3", source_address="1.1.1", payload=payload)

    cb(telegram)

    assert len(scheduled) == 1, "Sync-Callback muss async_create_task aufrufen"
    assert asyncio.iscoroutine(scheduled[0])
    # Coroutine ohne await zerstoeren, sonst Warning.
    scheduled[0].close()
