"""KNX-spezifische API-Endpoints (extrahiert aus messages.py).

- KnxProjectDiscoveryView: liest GA-Liste aus dem HA-KNX-Projekt fuer
  Auto-Vervollstaendigung im Anlegeformular
- KnxAddressesView: CRUD ueber alle Gruppenadressen mit Logging-Whitelist
- KnxAddressDetailView: Single-GA-Delete

Verwendet Helpers aus _helpers.py (RequireAdminView, get_database, audit, ...).
"""

from __future__ import annotations

import json as _json
from pathlib import Path as _Path
from typing import TYPE_CHECKING, Any

from aiohttp import web

from ._helpers import (
    ERR_INVALID_JSON,
    ERR_NOT_FOUND,
    ERR_NOT_INITIALISED,
    RequireAdminView,
    audit,
    get_database,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


class KnxProjectDiscoveryView(RequireAdminView):
    """v0.4: liefert die GAs aus dem in HA-KNX hinterlegten ETS-Projekt
    fuer Auto-Vervollstaendigung im Anlege-Formular."""

    url = "/api/messagehub/knx-discovery"
    name = "api:messagehub:knx-discovery"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        items, status = await _discover_knx_project(request.app["hass"])
        return self.json({"items": items, "count": len(items), "status": status})


async def _discover_knx_project(  # noqa: PLR0911, PLR0912
    hass: HomeAssistant,
) -> tuple[list[dict[str, Any]], str]:
    """Liefert (items, status) aus dem HA-KNX-Projekt, falls vorhanden."""
    knx_state = hass.data.get("knx")
    if knx_state is None:
        for alt in ("xknx", "knx_module"):
            knx_state = hass.data.get(alt)
            if knx_state is not None:
                break
    if knx_state is None:
        items = await _load_from_storage_file(hass)
        if items:
            return items, "ok"
        return [], "no_knx_integration"

    candidates: list[Any] = []
    for attr in ("project", "knx_project", "knxproject"):
        candidates.append(getattr(knx_state, attr, None))
    xknx_obj = getattr(knx_state, "xknx", None)
    if xknx_obj is not None:
        for attr in ("project", "knx_project", "knxproject"):
            candidates.append(getattr(xknx_obj, attr, None))
    if isinstance(knx_state, dict):
        candidates.append(knx_state.get("project"))

    project = next((p for p in candidates if p is not None), None)
    if project is None:
        items = await _load_from_storage_file(hass)
        if items:
            return items, "ok"
        return [], "no_project_loaded"

    raw_groups: Any = None
    for attr in ("group_addresses", "groupaddresses", "groupranges", "group_ranges"):
        candidate = getattr(project, attr, None)
        if candidate:
            raw_groups = candidate
            break
    if raw_groups is None and isinstance(project, dict):
        raw_groups = (
            project.get("group_addresses")
            or project.get("groupaddresses")
            or project.get("groupranges")
        )
    if not raw_groups:
        items = await _load_from_storage_file(hass)
        if items:
            return items, "ok"
        return [], "project_empty"

    items_list: list[dict[str, Any]] = []
    if isinstance(raw_groups, dict):
        for addr, data in raw_groups.items():
            items_list.append(_extract_group_address_entry(addr, data))
    elif isinstance(raw_groups, list):
        for entry in raw_groups:
            if isinstance(entry, dict):
                addr = entry.get("address") or entry.get("ga") or entry.get("identifier")
                if not addr:
                    continue
                items_list.append(_extract_group_address_entry(addr, entry))

    items_list = [it for it in items_list if it["address"]]
    items_list.sort(key=lambda x: _ga_sort_key(x["address"]))
    return items_list, "ok" if items_list else "project_empty"


def _extract_group_address_entry(addr: Any, data: Any) -> dict[str, Any]:
    addr_str = str(addr)
    name: Any = None
    dpt_field: Any = None
    if isinstance(data, dict):
        name = data.get("name") or data.get("description") or data.get("label")
        dpt_field = data.get("dpt") or data.get("datapoint_type") or data.get("data_type")
    else:
        name = getattr(data, "name", None) or getattr(data, "description", None)
        dpt_field = getattr(data, "dpt", None) or getattr(data, "data_type", None)
    return {
        "address": addr_str,
        "name": str(name or addr_str),
        "dpt": _extract_dpt(dpt_field),
    }


def _extract_dpt(raw: Any) -> str | None:
    if raw is None:
        return None
    if isinstance(raw, str):
        return raw.strip() or None
    if isinstance(raw, dict):
        main = raw.get("main")
        sub = raw.get("sub")
        return _format_dpt(main, sub)
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


def _ga_sort_key(ga: str) -> tuple[int, int, int]:
    try:
        a, b, c = (int(p) for p in ga.split("/"))
    except (ValueError, TypeError):
        return (999, 999, 999)
    return (a, b, c)


async def _load_from_storage_file(hass: HomeAssistant) -> list[dict[str, Any]]:
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
    items = [_extract_group_address_entry(addr, data) for addr, data in groups.items()]
    items.sort(key=lambda x: _ga_sort_key(x["address"]))
    return items


class KnxAddressesView(RequireAdminView):
    """Iter 48 UI: KNX-Gruppenadressen verwalten + ETS-CSV-Import."""

    url = "/api/messagehub/knx-addresses"
    name = "api:messagehub:knx-addresses"

    async def get(self, request: web.Request) -> web.Response:
        from ..processing.knx_repo import KnxAddressRepository  # noqa: PLC0415

        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        items = await KnxAddressRepository(db).list_all()
        return self.json({"items": [it.to_dict() for it in items]})

    async def post(self, request: web.Request) -> web.Response:
        from ..processing.knx_repo import (  # noqa: PLC0415
            KnxAddress,
            KnxAddressRepository,
        )

        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
        except (ValueError, TypeError):
            return self.json_message(ERR_INVALID_JSON, status_code=400)

        repo = KnxAddressRepository(db)
        # Bulk-Import via {"csv": "..."}
        csv_content = data.get("csv") if isinstance(data, dict) else None
        if isinstance(csv_content, str) and csv_content.strip():
            stats = await repo.bulk_import_csv(csv_content)
            await audit(
                request.app["hass"],
                request,
                action="knx_bulk_import",
                target_type="knx_address",
                details=stats,
            )
            return self.json(stats)

        # Einzel-Upsert
        try:
            item = KnxAddress(
                address=str(data["address"]),
                label=str(data["label"]),
                dpt=data.get("dpt"),
                description=data.get("description"),
                log_enabled=bool(data.get("log_enabled", False)),
                log_severity=str(data.get("log_severity", "info")),
                severity_on_true=data.get("severity_on_true"),
                severity_on_false=data.get("severity_on_false"),
            )
            await repo.upsert(item)
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        await audit(
            request.app["hass"],
            request,
            action="knx_upsert",
            target_type="knx_address",
            target_id=item.address,
            details={"label": item.label, "log_enabled": item.log_enabled},
        )
        return self.json(item.to_dict())


class KnxAddressDetailView(RequireAdminView):
    url = "/api/messagehub/knx-addresses/{address:[^/]+}"
    name = "api:messagehub:knx-address-detail"

    async def delete(self, request: web.Request, address: str) -> web.Response:
        from ..processing.knx_repo import KnxAddressRepository  # noqa: PLC0415

        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        if not await KnxAddressRepository(db).delete(address):
            return self.json_message(ERR_NOT_FOUND, status_code=404)
        await audit(
            request.app["hass"],
            request,
            action="knx_delete",
            target_type="knx_address",
            target_id=address,
        )
        return self.json_message("deleted")
