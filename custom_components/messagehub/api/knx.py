"""KNX-spezifische API-Endpoints (extrahiert aus messages.py).

- KnxProjectDiscoveryView: liest GA-Liste aus dem HA-KNX-Projekt fuer
  Auto-Vervollstaendigung im Anlegeformular
- KnxAddressesView: CRUD ueber alle Gruppenadressen mit Logging-Whitelist
- KnxAddressDetailView: Single-GA-Delete

Discovery-Logik liegt in processing/knx_discovery.py — pure Funktionen,
ohne aiohttp-Abhaengigkeit, daher unit-testbar.
"""

from __future__ import annotations

from aiohttp import web

from ..processing.knx_discovery import discover_knx_project
from ._helpers import (
    ERR_INVALID_JSON,
    ERR_NOT_FOUND,
    ERR_NOT_INITIALISED,
    RequireAdminView,
    audit,
    get_database,
)


class KnxProjectDiscoveryView(RequireAdminView):
    """v0.4: liefert die GAs aus dem in HA-KNX hinterlegten ETS-Projekt
    fuer Auto-Vervollstaendigung im Anlege-Formular."""

    url = "/api/messagehub/knx-discovery"
    name = "api:messagehub:knx-discovery"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        items, status = await discover_knx_project(request.app["hass"])
        return self.json({"items": items, "count": len(items), "status": status})


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
