"""KNX-spezifische API-Endpoints (extrahiert aus messages.py).

- KnxProjectDiscoveryView: liest GA-Liste aus dem HA-KNX-Projekt fuer
  Auto-Vervollstaendigung im Anlegeformular
- KnxAddressesView: CRUD ueber alle Gruppenadressen mit Logging-Whitelist
- KnxAddressDetailView: Single-GA-Delete

Discovery-Logik liegt in processing/knx_discovery.py — pure Funktionen,
ohne aiohttp-Abhaengigkeit, daher unit-testbar.
"""

from __future__ import annotations

from typing import Any

from aiohttp import web

from ..const import DOMAIN
from ..processing.knx_discovery import discover_knx_project
from ._helpers import (
    ERR_INVALID_JSON,
    ERR_NOT_FOUND,
    ERR_NOT_INITIALISED,
    RequireAdminView,
    audit,
    get_database,
)


def _invalidate_knx_cache(hass: Any) -> None:
    """Markiert den Hot-Path-Cache als veraltet — naechster Listener-
    Lookup laedt frisch. Wird von jedem CRUD-Endpoint aufgerufen, der
    knx_group_addresses aendert, damit Aenderungen sofort wirken statt
    erst nach TTL-Ablauf."""
    cache = hass.data.get(DOMAIN, {}).get("_knx_whitelist_cache")
    if cache is not None:
        cache.invalidate()


class KnxProjectDiscoveryView(RequireAdminView):
    """v0.4: liefert die GAs aus dem in HA-KNX hinterlegten ETS-Projekt
    fuer Auto-Vervollstaendigung im Anlege-Formular."""

    url = "/api/messagehub/knx-discovery"
    name = "api:messagehub:knx-discovery"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        items, status = await discover_knx_project(request.app["hass"])
        return self.json({"items": items, "count": len(items), "status": status})


# Iter 46 (N4): Hard-Cap fuer Sync-Items — typische ETS-Projekte haben
# < 5000 GAs, alles darueber waere verdaechtig (DoS / Fehl-Aufruf).
_SYNC_MAX_ITEMS = 10_000


class KnxProjectSyncView(RequireAdminView):
    """Iter 46 (N4): Intelligenter ETS-Projektdatei-Abgleich.

    POST /api/messagehub/knx-addresses/sync

    Body: {"items": [{address, name, dpt}, ...], "apply": bool}

    apply=false (default): liefert nur den Plan {add, update, delete, keep}.
    apply=true: wendet den Plan an und liefert {plan, counts}.

    Vermeidet die alte Wipe-and-Replace-Bulk-Logik, bei der jeder Re-
    Import die User-Konfiguration (log_enabled, severity_*) ueberschrieben
    hat. Bei "update" wird die User-Config bewusst zurueckgesetzt — die
    Semantik der GA hat sich geaendert, alte Severities passen nicht mehr.
    """

    url = "/api/messagehub/knx-addresses/sync"
    name = "api:messagehub:knx-addresses:sync"

    async def post(self, request: web.Request) -> web.Response:
        from ..processing.knx_repo import (  # noqa: PLC0415
            KnxAddressRepository,
            compute_etssync_plan,
        )

        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        data, err = await self._parse_sync_body(request)
        if err is not None:
            return err

        items = data["items"]
        apply = bool(data.get("apply", False))

        repo = KnxAddressRepository(db)
        existing = [a.to_dict() for a in await repo.list_all()]
        plan = compute_etssync_plan(db_addresses=existing, ets_items=items)

        if not apply:
            return self.json(
                {
                    "plan": plan,
                    "counts": {
                        "add": len(plan["add"]),
                        "update": len(plan["update"]),
                        "delete": len(plan["delete"]),
                        "keep": len(plan["keep"]),
                    },
                }
            )

        try:
            counts = await repo.apply_etssync_plan(plan)
        except (ValueError, RuntimeError) as exc:
            return self.json_message(f"sync failed: {exc}", status_code=400)
        _invalidate_knx_cache(request.app["hass"])
        await audit(
            request.app["hass"],
            request,
            action="knx_etssync",
            target_type="knx_address",
            details={
                "added": counts["added"],
                "updated": counts["updated"],
                "deleted": counts["deleted"],
                "kept": len(plan["keep"]),
            },
        )
        return self.json({"plan": plan, "counts": counts})

    async def _parse_sync_body(
        self, request: web.Request
    ) -> tuple[dict[str, Any], web.Response | None]:
        """Parst + validiert den Request-Body. Hilfsfunktion fuer post()
        damit der eigentliche Handler unter PLR0911 (max 6 returns) bleibt.
        """
        try:
            data = await request.json()
        except (ValueError, TypeError):
            return {}, self.json_message(ERR_INVALID_JSON, status_code=400)
        items = data.get("items") if isinstance(data, dict) else None
        if not isinstance(items, list):
            return {}, self.json_message("body.items must be a list", status_code=400)
        if len(items) > _SYNC_MAX_ITEMS:
            return {}, self.json_message(f"too many items (max {_SYNC_MAX_ITEMS})", status_code=400)
        return data, None


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
            _invalidate_knx_cache(request.app["hass"])
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
                # Iter 44 (N2): Default-Severity = warning, damit neu
                # angelegte Logging-Eintraege gleich auffallen statt im
                # Info-Stream zu verschwinden.
                log_severity=str(data.get("log_severity", "warning")),
                severity_on_true=data.get("severity_on_true"),
                severity_on_false=data.get("severity_on_false"),
            )
            await repo.upsert(item)
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        _invalidate_knx_cache(request.app["hass"])
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
        _invalidate_knx_cache(request.app["hass"])
        await audit(
            request.app["hass"],
            request,
            action="knx_delete",
            target_type="knx_address",
            target_id=address,
        )
        return self.json_message("deleted")
