"""Iter 79 / CR-11: TTL-Cache fuer discover_knx_devices."""

from __future__ import annotations

import pytest

from custom_components.messagehub.processing import knx_discovery


class _FakeHass:
    """Minimaler Hass-Mock; Cache nutzt id(hass) als Key."""

    def __init__(self, data: dict | None = None) -> None:
        self.data = data or {}


@pytest.fixture(autouse=True)
def _reset_cache():
    knx_discovery.invalidate_knx_devices_cache()
    yield
    knx_discovery.invalidate_knx_devices_cache()


@pytest.mark.asyncio
async def test_returns_empty_dict_for_no_knx_state() -> None:
    hass = _FakeHass()
    result = await knx_discovery.discover_knx_devices(hass)
    assert result == {}


@pytest.mark.asyncio
async def test_caches_by_hass_identity(monkeypatch: pytest.MonkeyPatch) -> None:
    # Ohne KNX-State wird {} gecacht. Ein zweiter Aufruf darf nicht
    # erneut find_knx_state aufrufen (geht nur per Spy).
    call_count = {"n": 0}

    def _spy_find_knx_state(_hass):  # type: ignore[no-untyped-def]
        call_count["n"] += 1
        return None

    monkeypatch.setattr(knx_discovery, "find_knx_state", _spy_find_knx_state)
    hass = _FakeHass()
    await knx_discovery.discover_knx_devices(hass)
    await knx_discovery.discover_knx_devices(hass)
    await knx_discovery.discover_knx_devices(hass)
    assert call_count["n"] == 1, "Cache should prevent repeated lookups"


@pytest.mark.asyncio
async def test_invalidate_resets_cache(monkeypatch: pytest.MonkeyPatch) -> None:
    call_count = {"n": 0}

    def _spy_find_knx_state(_hass):  # type: ignore[no-untyped-def]
        call_count["n"] += 1
        return None

    monkeypatch.setattr(knx_discovery, "find_knx_state", _spy_find_knx_state)
    hass = _FakeHass()
    await knx_discovery.discover_knx_devices(hass)
    knx_discovery.invalidate_knx_devices_cache()
    await knx_discovery.discover_knx_devices(hass)
    assert call_count["n"] == 2


@pytest.mark.asyncio
async def test_ttl_expires_and_refreshes(monkeypatch: pytest.MonkeyPatch) -> None:
    call_count = {"n": 0}

    def _spy_find_knx_state(_hass):  # type: ignore[no-untyped-def]
        call_count["n"] += 1
        return None

    monkeypatch.setattr(knx_discovery, "find_knx_state", _spy_find_knx_state)

    # Pseudo-Clock: erst Zeit 0, dann 1000 (ueber TTL).
    fake_clock = [0.0]
    monkeypatch.setattr(knx_discovery, "_cache_now", lambda: fake_clock[0])

    hass = _FakeHass()
    await knx_discovery.discover_knx_devices(hass)
    # Innerhalb TTL: Cache greift.
    fake_clock[0] = 60.0
    await knx_discovery.discover_knx_devices(hass)
    assert call_count["n"] == 1
    # Nach TTL: Refresh.
    fake_clock[0] = 1000.0
    await knx_discovery.discover_knx_devices(hass)
    assert call_count["n"] == 2


@pytest.mark.asyncio
async def test_different_hass_instances_have_separate_caches(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    call_count = {"n": 0}

    def _spy_find_knx_state(_hass):  # type: ignore[no-untyped-def]
        call_count["n"] += 1
        return None

    monkeypatch.setattr(knx_discovery, "find_knx_state", _spy_find_knx_state)
    hass_a = _FakeHass()
    hass_b = _FakeHass()
    await knx_discovery.discover_knx_devices(hass_a)
    await knx_discovery.discover_knx_devices(hass_b)
    # Beide werden separat gecacht.
    assert call_count["n"] == 2
    await knx_discovery.discover_knx_devices(hass_a)
    await knx_discovery.discover_knx_devices(hass_b)
    assert call_count["n"] == 2
