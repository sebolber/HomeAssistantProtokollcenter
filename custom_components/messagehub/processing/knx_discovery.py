"""KNX-Discovery: liest Gruppenadressen aus dem in HA hinterlegten ETS-Projekt.

Vorher in api/knx.py inline mit Cognitive Complexity 41 — hier ausgelagert
und in kleine Helfer mit klarer Verantwortung zerlegt:

- find_knx_state(): findet das HA-KNX-Integrations-State-Object
- find_project(): findet das Projekt darin
- find_raw_groups(): findet die GA-Liste/Dict im Projekt
- extract_items_from_groups(): wandelt das in unsere DTO-Liste
- discover_knx_project(): orchestriert alles + Storage-Fallback

Pure Funktionen ohne aiohttp-Abhaengigkeit, daher in tests/unit testbar.
"""

from __future__ import annotations

import json as _json
import logging
from pathlib import Path as _Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

# Iter aiohttp-error-ZU9UA: xknx-Projekt-Objekte koennen — wenn keine
# Projektdatei geladen ist — bei Property-Zugriffen oder bool()-Checks
# beliebige Exceptions werfen (RuntimeError, TypeError, ...). `getattr`
# mit Default faengt nur AttributeError; alle anderen Exception-Typen
# wuerden HTTP 500 ausloesen. Dieses Tuple wird in den Discovery-
# Helfern als breites Exception-Filter genutzt — `Exception` schliesst
# bewusst auch unerwartete xknx-Fehler ein, ohne KeyboardInterrupt /
# SystemExit zu schlucken.
_DISCOVERY_SAFE_EXCEPTIONS: tuple[type[BaseException], ...] = (Exception,)


_KNX_STATE_KEYS = ("knx", "xknx", "knx_module")
_PROJECT_ATTRS = ("project", "knx_project", "knxproject")
_GROUP_ATTRS = ("group_addresses", "groupaddresses", "groupranges", "group_ranges")
_GROUP_DICT_KEYS = ("group_addresses", "groupaddresses", "groupranges")
_GROUP_ENTRY_ADDR_KEYS = ("address", "ga", "identifier")

# Iter 34: Geraete-Discovery aus dem ETS-Projekt (Source-Adresse → Hersteller).
_DEVICE_DICT_KEYS = ("devices",)
_DEVICE_ATTRS = ("devices",)
_DEVICE_INDIVIDUAL_KEYS = (
    "individual_address",
    "address",
    "individualaddress",
)
_DEVICE_MANUFACTURER_KEYS = (
    "manufacturer_name",
    "manufacturer",
    "vendor",
)
_DEVICE_NAME_KEYS = ("name", "description", "product")
_DEVICE_PRODUCT_KEYS = ("product_name", "product", "model", "application_program")


def find_knx_state(hass: HomeAssistant) -> Any:
    """Findet das KNX-Integrations-State-Object in `hass.data` (oder None)."""
    for key in _KNX_STATE_KEYS:
        state = hass.data.get(key)
        if state is not None:
            return state
    return None


def _safe_getattr(obj: Any, name: str) -> Any:
    """getattr mit None-Default, aber faengt zusaetzlich beliebige
    nicht-AttributeError-Exceptions, die xknx aus Property-Gettern
    werfen kann, wenn das Projekt nicht geladen ist.
    """
    try:
        return getattr(obj, name, None)
    except _DISCOVERY_SAFE_EXCEPTIONS:
        return None


def _safe_truthy(value: Any) -> bool:
    """bool(value), tolerant gegen __bool__/__len__-Implementierungen,
    die im Lazy-Load-Fall raisen.
    """
    try:
        return bool(value)
    except _DISCOVERY_SAFE_EXCEPTIONS:
        return False


def find_project(knx_state: Any) -> Any:
    """Holt das Projekt-Object aus knx_state — Attribute, xknx-Sub-Object oder dict."""
    for attr in _PROJECT_ATTRS:
        candidate = _safe_getattr(knx_state, attr)
        if candidate is not None:
            return candidate
    xknx_obj = _safe_getattr(knx_state, "xknx")
    if xknx_obj is not None:
        for attr in _PROJECT_ATTRS:
            candidate = _safe_getattr(xknx_obj, attr)
            if candidate is not None:
                return candidate
    if isinstance(knx_state, dict):
        return knx_state.get("project")
    return None


def find_raw_groups(project: Any) -> Any:
    """Holt das group_addresses-Mapping aus dem Projekt — Attribute oder dict-keys."""
    for attr in _GROUP_ATTRS:
        candidate = _safe_getattr(project, attr)
        if _safe_truthy(candidate):
            return candidate
    if isinstance(project, dict):
        for key in _GROUP_DICT_KEYS:
            candidate = project.get(key)
            if _safe_truthy(candidate):
                return candidate
    return None


def extract_items_from_groups(raw_groups: Any) -> list[dict[str, Any]]:
    """Wandelt verschiedene raw_groups-Formen (dict, list-of-dicts) in DTO-Liste."""
    items: list[dict[str, Any]] = []
    try:
        if isinstance(raw_groups, dict):
            for addr, data in raw_groups.items():
                items.append(extract_group_address_entry(addr, data))
        elif isinstance(raw_groups, list):
            for entry in raw_groups:
                if not isinstance(entry, dict):
                    continue
                addr = next(
                    (entry.get(k) for k in _GROUP_ENTRY_ADDR_KEYS if entry.get(k)),
                    None,
                )
                if addr:
                    items.append(extract_group_address_entry(addr, entry))
    except _DISCOVERY_SAFE_EXCEPTIONS as err:
        # xknx-Lazy-Load-Proxy raised waehrend der Iteration — lieber
        # bisheriges Teilergebnis verwerfen als 500.
        _LOGGER.debug("knx group iteration failed, returning empty list: %s", err)
        return []
    return [it for it in items if it["address"]]


def extract_group_address_entry(addr: Any, data: Any) -> dict[str, Any]:
    """Wandelt ein einzelnes group_address-Element (dict oder Object) ins DTO."""
    addr_str = str(addr)
    if isinstance(data, dict):
        name = data.get("name") or data.get("description") or data.get("label")
        dpt_field = data.get("dpt") or data.get("datapoint_type") or data.get("data_type")
    else:
        name = getattr(data, "name", None) or getattr(data, "description", None)
        dpt_field = getattr(data, "dpt", None) or getattr(data, "data_type", None)
    return {
        "address": addr_str,
        "name": str(name or addr_str),
        "dpt": extract_dpt(dpt_field),
    }


def extract_dpt(raw: Any) -> str | None:
    """Normalisiert verschiedene DPT-Repraesentationen auf "MAIN.SUB"-Format."""
    if raw is None:
        return None
    if isinstance(raw, str):
        return raw.strip() or None
    if isinstance(raw, dict):
        return _format_dpt(raw.get("main"), raw.get("sub"))
    main = (
        getattr(raw, "dpt_main_number", None)
        or getattr(raw, "main", None)
        or getattr(raw, "value_type", None)
    )
    sub = getattr(raw, "dpt_sub_number", None) or getattr(raw, "sub", None)
    if main is not None:
        return _format_dpt(main, sub)
    return None


def _format_dpt(main: Any, sub: Any) -> str | None:
    if main is None:
        return None
    try:
        if sub is None or sub == "":
            return str(int(main))
        return f"{int(main)}.{int(sub):03d}"
    except (TypeError, ValueError):
        return f"{main}.{sub}" if sub else str(main)


def ga_sort_key(ga: str) -> tuple[int, int, int]:
    """Sortier-Key fuer GA-Strings im N/N/N-Format."""
    try:
        a, b, c = (int(p) for p in ga.split("/"))
    except (ValueError, TypeError):
        return (999, 999, 999)
    return (a, b, c)


def find_raw_devices(project: Any) -> Any:
    """Iter 34: Holt das devices-Mapping aus dem ETS-Projekt."""
    for attr in _DEVICE_ATTRS:
        candidate = _safe_getattr(project, attr)
        if _safe_truthy(candidate):
            return candidate
    if isinstance(project, dict):
        for key in _DEVICE_DICT_KEYS:
            candidate = project.get(key)
            if _safe_truthy(candidate):
                return candidate
    return None


def _first_attr(data: Any, keys: tuple[str, ...]) -> Any:
    """Holt den ersten nicht-leeren Wert aus dict-keys oder Object-Attrs."""
    if isinstance(data, dict):
        for k in keys:
            v = data.get(k)
            if v:
                return v
    else:
        for k in keys:
            v = getattr(data, k, None)
            if v:
                return v
    return None


def extract_device_entry(addr: Any, data: Any) -> dict[str, Any] | None:
    """Wandelt einen Device-Eintrag in unser DTO. Liefert None, wenn
    die Individual-Adresse nicht extrahiert werden kann."""
    if isinstance(data, dict) and not addr:
        addr = _first_attr(data, _DEVICE_INDIVIDUAL_KEYS)
    individual = str(addr or "").strip()
    if not individual:
        return None
    return {
        "individual_address": individual,
        "manufacturer": str(_first_attr(data, _DEVICE_MANUFACTURER_KEYS) or "").strip(),
        "name": str(_first_attr(data, _DEVICE_NAME_KEYS) or "").strip(),
        "product": str(_first_attr(data, _DEVICE_PRODUCT_KEYS) or "").strip(),
    }


def extract_devices(raw_devices: Any) -> list[dict[str, Any]]:
    """Wandelt das devices-Mapping in eine Liste von DTOs."""
    items: list[dict[str, Any]] = []
    try:
        if isinstance(raw_devices, dict):
            for addr, data in raw_devices.items():
                entry = extract_device_entry(addr, data)
                if entry is not None:
                    items.append(entry)
        elif isinstance(raw_devices, list):
            for entry in raw_devices:
                converted = extract_device_entry(None, entry)
                if converted is not None:
                    items.append(converted)
    except _DISCOVERY_SAFE_EXCEPTIONS as err:
        _LOGGER.debug("knx devices iteration failed, returning empty list: %s", err)
        return []
    return items


# Iter 79 / CR-11: TTL-Cache fuer discover_knx_devices.
# discover_knx_devices wird in TopBySource und GaDetail bei jeder
# Anfrage frisch geparst. Bei 100+ Devices und 3000+ GAs bedeutet das
# pro Request ein nicht-trivialer Aufwand. ETS-Projekt aendert sich
# selten — 5 min TTL ist eine sichere Default-Cache-Dauer.
_KNX_DEVICES_CACHE_TTL_SEC: int = 300
_knx_devices_cache: dict[int, tuple[float, dict[str, dict[str, Any]]]] = {}


def _cache_now() -> float:
    """Indirection fuer Tests."""
    import time  # noqa: PLC0415

    return time.monotonic()


def invalidate_knx_devices_cache() -> None:
    """Cache leeren — z. B. nach KnxProjectSyncView (User hat das
    Projekt aktualisiert).
    """
    _knx_devices_cache.clear()


async def discover_knx_devices(hass: HomeAssistant) -> dict[str, dict[str, Any]]:
    """Iter 34: Liefert ein Mapping `individual_address -> {manufacturer, name, product}`.

    Leeres Dict bei nicht verfuegbarem Projekt — robust gegen fehlende
    KNX-Integration. Wird vom Top-Geraete-Endpoint gerufen, um die
    Source-Adressen zu annotieren.

    Iter 79 / CR-11: TTL-Cache (5 min) auf hass-Identitaet als Key.

    Iter aiohttp-error-ZU9UA: Top-Level-Safety-Net — wenn xknx beim
    Property-Zugriff intern raised (z. B. weil noch keine Projektdatei
    geladen ist), wird das geloggt und es gibt einen leeren Default
    statt HTTP 500.
    """
    cache_key = id(hass)
    cached = _knx_devices_cache.get(cache_key)
    now = _cache_now()
    if cached is not None and now - cached[0] < _KNX_DEVICES_CACHE_TTL_SEC:
        return cached[1]

    result: dict[str, dict[str, Any]] = {}
    try:
        knx_state = find_knx_state(hass)
        if knx_state is not None:
            project = find_project(knx_state)
            if project is not None:
                raw = find_raw_devices(project)
                if _safe_truthy(raw):
                    result = {entry["individual_address"]: entry for entry in extract_devices(raw)}
    except _DISCOVERY_SAFE_EXCEPTIONS as err:
        _LOGGER.debug("knx device discovery failed, returning empty: %s", err)
        result = {}
    _knx_devices_cache[cache_key] = (now, result)
    return result


async def discover_knx_project(hass: HomeAssistant) -> tuple[list[dict[str, Any]], str]:
    """Liefert (items, status) aus dem HA-KNX-Projekt, falls vorhanden.

    Status-Werte: "ok" / "no_knx_integration" / "no_project_loaded" / "project_empty".
    Faellt bei jedem Schritt auf den Storage-Datei-Reader zurueck — damit
    funktioniert das auch, wenn die KNX-Integration noch nicht voll geladen ist.

    Iter aiohttp-error-ZU9UA: Top-Level-Safety-Net — unerwartete xknx-
    Exceptions (z. B. RuntimeError aus einer Property bei nicht
    geladener Projektdatei) werden in den Storage-Fallback uebersetzt.
    """
    knx_state = find_knx_state(hass)
    if knx_state is None:
        return await _fallback_storage(hass, "no_knx_integration")

    try:
        project = find_project(knx_state)
        if project is None:
            return await _fallback_storage(hass, "no_project_loaded")

        raw_groups = find_raw_groups(project)
        if not _safe_truthy(raw_groups):
            return await _fallback_storage(hass, "project_empty")

        items = extract_items_from_groups(raw_groups)
    except _DISCOVERY_SAFE_EXCEPTIONS as err:
        _LOGGER.debug("knx project discovery failed, falling back to storage: %s", err)
        return await _fallback_storage(hass, "no_project_loaded")
    items.sort(key=lambda x: ga_sort_key(x["address"]))
    return items, "ok" if items else "project_empty"


async def _fallback_storage(
    hass: HomeAssistant, no_state_status: str
) -> tuple[list[dict[str, Any]], str]:
    items = await load_from_storage_file(hass)
    if items:
        return items, "ok"
    return [], no_state_status


async def load_from_storage_file(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Fallback: liest <config>/.storage/knx/* (HA 2024.x speichert dort)."""
    storage_dir = _Path(hass.config.path(".storage"))
    candidates = [
        storage_dir / "knx" / "project.json",
        storage_dir / "knx_project.json",
        storage_dir / "knx_keyring.json",
    ]

    def _read_first() -> dict[str, Any] | None:
        for p in candidates:
            if p.is_file():
                try:
                    parsed: dict[str, Any] = _json.loads(p.read_text(encoding="utf-8"))
                except (OSError, ValueError):
                    continue
                else:
                    return parsed
        return None

    raw = await hass.async_add_executor_job(_read_first)
    if not raw:
        return []
    groups = raw.get("data", {}).get("group_addresses") if isinstance(raw, dict) else None
    if not isinstance(groups, dict):
        return []
    items = [extract_group_address_entry(addr, data) for addr, data in groups.items()]
    items.sort(key=lambda x: ga_sort_key(x["address"]))
    return items
