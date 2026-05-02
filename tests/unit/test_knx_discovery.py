"""Tests fuer processing/knx_discovery — die aufgeteilten Helfer."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from custom_components.messagehub.processing.knx_discovery import (
    discover_knx_project,
    extract_dpt,
    extract_group_address_entry,
    extract_items_from_groups,
    find_knx_state,
    find_project,
    find_raw_groups,
    ga_sort_key,
)

# ---------------------------- find_knx_state ----------------------------


class _FakeHass:
    def __init__(self, data: dict[str, object]) -> None:
        self.data = data
        self.config = SimpleNamespace(path=lambda *parts: f"/tmp/ha/{'/'.join(parts)}")

    async def async_add_executor_job(self, fn, *args):  # type: ignore[no-untyped-def]
        return fn(*args)


def test_find_knx_state_returns_none_when_no_data() -> None:
    hass = _FakeHass(data={})
    assert find_knx_state(hass) is None


def test_find_knx_state_prefers_knx_over_xknx() -> None:
    hass = _FakeHass(data={"knx": "primary", "xknx": "fallback"})
    assert find_knx_state(hass) == "primary"


def test_find_knx_state_falls_back_to_xknx_then_knx_module() -> None:
    hass = _FakeHass(data={"xknx": "fallback"})
    assert find_knx_state(hass) == "fallback"
    hass2 = _FakeHass(data={"knx_module": "module"})
    assert find_knx_state(hass2) == "module"


# ---------------------------- find_project ----------------------------


def test_find_project_via_attribute() -> None:
    state = SimpleNamespace(project={"groups": []})
    assert find_project(state) == {"groups": []}


def test_find_project_via_xknx_sub_object() -> None:
    state = SimpleNamespace(xknx=SimpleNamespace(knx_project={"x": 1}))
    assert find_project(state) == {"x": 1}


def test_find_project_via_dict_key() -> None:
    state = {"project": {"groups": []}}
    assert find_project(state) == {"groups": []}


def test_find_project_returns_none_when_absent() -> None:
    assert find_project(SimpleNamespace()) is None
    assert find_project({}) is None


# ---------------------------- find_raw_groups ----------------------------


def test_find_raw_groups_via_attribute() -> None:
    project = SimpleNamespace(group_addresses={"1/2/3": {"name": "Test"}})
    assert find_raw_groups(project) == {"1/2/3": {"name": "Test"}}


def test_find_raw_groups_via_dict_key() -> None:
    project = {"group_addresses": {"1/2/3": {}}}
    assert find_raw_groups(project) == {"1/2/3": {}}


def test_find_raw_groups_returns_none_for_empty() -> None:
    assert find_raw_groups({}) is None
    assert find_raw_groups(SimpleNamespace(group_addresses={})) is None


# ---------------------------- extract_items_from_groups ----------------------------


def test_extract_items_from_dict_form() -> None:
    raw = {
        "1/2/3": {"name": "Wohnzimmer Licht", "dpt": "1.001"},
        "5/0/1": {"description": "Heizung Pumpe", "dpt": {"main": 1, "sub": 5}},
    }
    items = extract_items_from_groups(raw)
    assert len(items) == 2
    addrs = {it["address"] for it in items}
    assert addrs == {"1/2/3", "5/0/1"}


def test_extract_items_from_list_form() -> None:
    raw = [
        {"address": "1/2/3", "name": "L"},
        {"ga": "1/2/4", "name": "M"},
        {"identifier": "1/2/5", "name": "N"},
        {"name": "Skipped"},  # ohne address-key -> wird ignoriert
    ]
    items = extract_items_from_groups(raw)
    assert {it["address"] for it in items} == {"1/2/3", "1/2/4", "1/2/5"}


def test_extract_items_filters_empty_addresses() -> None:
    raw = {"": {"name": "no addr"}, "1/2/3": {"name": "ok"}}
    items = extract_items_from_groups(raw)
    assert [it["address"] for it in items] == ["1/2/3"]


# ---------------------------- extract_group_address_entry ----------------------------


def test_extract_group_address_entry_dict_data() -> None:
    entry = extract_group_address_entry("1/2/3", {"name": "Lampe", "dpt": "1.001"})
    assert entry == {"address": "1/2/3", "name": "Lampe", "dpt": "1.001"}


def test_extract_group_address_entry_object_data() -> None:
    data = SimpleNamespace(name="Heizung", dpt="1.005")
    entry = extract_group_address_entry("5/0/1", data)
    assert entry == {"address": "5/0/1", "name": "Heizung", "dpt": "1.005"}


def test_extract_group_address_entry_falls_back_to_address_when_no_name() -> None:
    entry = extract_group_address_entry("1/2/3", {})
    assert entry["name"] == "1/2/3"


# ---------------------------- extract_dpt ----------------------------


def test_extract_dpt_from_string() -> None:
    assert extract_dpt("1.001") == "1.001"
    assert extract_dpt("  ") is None
    assert extract_dpt(None) is None


def test_extract_dpt_from_dict() -> None:
    assert extract_dpt({"main": 1, "sub": 5}) == "1.005"
    assert extract_dpt({"main": 5, "sub": None}) == "5"


def test_extract_dpt_from_object() -> None:
    obj = SimpleNamespace(dpt_main_number=1, dpt_sub_number=5)
    assert extract_dpt(obj) == "1.005"


# ---------------------------- ga_sort_key ----------------------------


def test_ga_sort_key_orders_numerically() -> None:
    keys = [ga_sort_key(g) for g in ["1/0/100", "1/0/9", "0/15/255"]]
    assert sorted(keys) == [(0, 15, 255), (1, 0, 9), (1, 0, 100)]


def test_ga_sort_key_handles_invalid() -> None:
    assert ga_sort_key("not a ga") == (999, 999, 999)
    assert ga_sort_key("1/2") == (999, 999, 999)


# ---------------------------- discover_knx_project (Integration) ----------------------------


@pytest.mark.asyncio
async def test_discover_returns_no_knx_integration_when_state_missing() -> None:
    items, status = await discover_knx_project(_FakeHass(data={}))
    assert items == []
    assert status == "no_knx_integration"


@pytest.mark.asyncio
async def test_discover_returns_no_project_loaded_when_no_project() -> None:
    hass = _FakeHass(data={"knx": SimpleNamespace()})
    items, status = await discover_knx_project(hass)
    assert items == []
    assert status == "no_project_loaded"


@pytest.mark.asyncio
async def test_discover_returns_project_empty_when_no_groups() -> None:
    hass = _FakeHass(data={"knx": SimpleNamespace(project=SimpleNamespace())})
    items, status = await discover_knx_project(hass)
    assert items == []
    assert status == "project_empty"


@pytest.mark.asyncio
async def test_discover_returns_sorted_items_on_full_path() -> None:
    project = SimpleNamespace(
        group_addresses={
            "5/0/1": {"name": "Heizung", "dpt": "1.005"},
            "1/0/100": {"name": "Licht 100", "dpt": "1.001"},
            "1/0/9": {"name": "Licht 9", "dpt": "1.001"},
        }
    )
    hass = _FakeHass(data={"knx": SimpleNamespace(project=project)})
    items, status = await discover_knx_project(hass)
    assert status == "ok"
    assert [it["address"] for it in items] == ["1/0/9", "1/0/100", "5/0/1"]
