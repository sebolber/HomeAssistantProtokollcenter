"""Regression: Discovery-Funktionen toleriert kaputte xknx-Projekt-Objekte.

Hintergrund (Bug aiohttp-error-ZU9UA, Folgemeldung): wenn keine ETS-
Projektdatei in HA hinterlegt ist, kann das xknx-Projekt-Objekt zwar
existieren (`hass.data["knx"]` ist vorhanden, weil die KNX-Integration
laeuft), aber Property-Zugriffe wie `.group_addresses` / `.devices`
oder ein `bool(group_addresses_dict_proxy)` koennen beliebige
Exceptions werfen — `getattr(..., default)` faengt nur AttributeError
und schluckt RuntimeError/TypeError/KeyError nicht.

Das Resultat war ein HTTP-500 ("Server got itself in trouble") im
KNX-Stats-Tab + "Lade KNX-Projekt-Daten ..."-Spinner ohne Ende im
Einstellungen → KNX-Bus-Tab, weil sowohl ``KnxStatsTopBySourceView``
(via ``discover_knx_devices``) als auch ``KnxProjectDiscoveryView``
(via ``discover_knx_project``) die Exception ungeschuetzt weiterreichten.

Diese Tests stellen sicher: jede unerwartete Exception aus xknx-
internen Strukturen wird in der Discovery aufgefangen und in den
sicheren Default uebersetzt — leeres Dict / leere Liste plus
"no_project_loaded"-Status.
"""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any

import pytest

from custom_components.messagehub.processing import knx_discovery


class _FakeHass:
    def __init__(self, data: dict[str, Any]) -> None:
        self.data = data
        self.config = SimpleNamespace(path=lambda *parts: f"/tmp/ha/{'/'.join(parts)}")

    async def async_add_executor_job(self, fn, *args):  # type: ignore[no-untyped-def]
        return fn(*args)


class _RaisingProject:
    """Mockt ein xknx-Projekt, dessen Properties beliebige Exceptions
    werfen — z. B. weil die Projektdatei noch nicht geladen ist und
    xknx intern eine Property mit `raise RuntimeError(...)` belegt.
    """

    @property
    def group_addresses(self) -> Any:
        raise RuntimeError("project not loaded")

    @property
    def groupaddresses(self) -> Any:
        raise RuntimeError("project not loaded")

    @property
    def groupranges(self) -> Any:
        raise RuntimeError("project not loaded")

    @property
    def group_ranges(self) -> Any:
        raise RuntimeError("project not loaded")

    @property
    def devices(self) -> Any:
        raise RuntimeError("project not loaded")


class _ProjectWithRaisingBool:
    """Mockt ein Container-Objekt, dessen ``__bool__`` raised — kann
    passieren, wenn xknx ein Proxy-Objekt zurueckgibt, das beim
    Truthiness-Check eine Lazy-Load-Exception wirft.
    """

    def __init__(self) -> None:
        self.group_addresses = _RaisingBool()
        self.devices = _RaisingBool()


class _RaisingBool:
    def __bool__(self) -> bool:
        raise TypeError("cannot evaluate empty project")

    def __len__(self) -> int:
        raise TypeError("cannot evaluate empty project")


@pytest.fixture(autouse=True)
def _reset_devices_cache() -> Any:
    knx_discovery.invalidate_knx_devices_cache()
    yield
    knx_discovery.invalidate_knx_devices_cache()


@pytest.mark.asyncio
async def test_discover_knx_project_swallows_runtimeerror_from_properties() -> None:
    knx_state = SimpleNamespace(project=_RaisingProject())
    hass = _FakeHass(data={"knx": knx_state})
    items, status = await knx_discovery.discover_knx_project(hass)
    assert items == []
    assert status in {"no_project_loaded", "project_empty"}


@pytest.mark.asyncio
async def test_discover_knx_project_swallows_typeerror_from_bool() -> None:
    knx_state = SimpleNamespace(project=_ProjectWithRaisingBool())
    hass = _FakeHass(data={"knx": knx_state})
    items, status = await knx_discovery.discover_knx_project(hass)
    assert items == []
    assert status in {"no_project_loaded", "project_empty"}


@pytest.mark.asyncio
async def test_discover_knx_devices_swallows_runtimeerror_from_properties() -> None:
    knx_state = SimpleNamespace(project=_RaisingProject())
    hass = _FakeHass(data={"knx": knx_state})
    result = await knx_discovery.discover_knx_devices(hass)
    assert result == {}


@pytest.mark.asyncio
async def test_discover_knx_devices_swallows_typeerror_from_bool() -> None:
    knx_state = SimpleNamespace(project=_ProjectWithRaisingBool())
    hass = _FakeHass(data={"knx": knx_state})
    result = await knx_discovery.discover_knx_devices(hass)
    assert result == {}


@pytest.mark.asyncio
async def test_discover_knx_project_swallows_iteration_error() -> None:
    """Mappings, deren ``items()`` selbst raised (xknx-Lazy-Load-Proxy)
    duerfen den Endpoint nicht in 500 reissen.
    """

    class _RaisingMapping(dict):  # type: ignore[type-arg]
        def items(self) -> Any:
            raise RuntimeError("project not loaded")

        def __bool__(self) -> bool:
            return True

    project = SimpleNamespace(group_addresses=_RaisingMapping())
    knx_state = SimpleNamespace(project=project)
    hass = _FakeHass(data={"knx": knx_state})
    items, status = await knx_discovery.discover_knx_project(hass)
    assert items == []
    assert status in {"no_project_loaded", "project_empty"}
