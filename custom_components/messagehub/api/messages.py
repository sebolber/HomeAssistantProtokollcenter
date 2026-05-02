"""REST-API-Endpunkte fuer das messagehub-Panel.

Iter 13: list + get
Iter 14: Filter & Pagination
Iter 15: delete + sources + stats + webhooks
"""

from __future__ import annotations

import contextlib
import logging
from typing import TYPE_CHECKING, Any

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from ..const import DOMAIN, EVENT_MESSAGE_DELETED

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from ..storage import Message, MessageRepository, WebhookConfig, WebhookConfigRepository

_LOGGER = logging.getLogger(__name__)

DEFAULT_LIMIT = 100
HARD_CAP_LIMIT = 1000

# Standard-Error-Messages fuer JSON-Responses.
# Sonst wuerden die duplizierten Literale (~30x dieselben Strings) als
# Code-Smell aufschlagen. Konstanten machen die Fehlermeldungen ausserdem
# austauschbar/uebersetzbar an einer Stelle.
_ERR_NOT_INITIALISED = "not initialised"
_ERR_NOT_INITIALISED_LONG = "messagehub not initialised"
_ERR_NOT_FOUND = "not found"
_ERR_INVALID_ID = "invalid id"
_ERR_INVALID_REQUEST = "invalid request"
_ERR_INVALID_JSON = "invalid json"


def _msg_to_dict(msg: Message) -> dict[str, Any]:
    return {
        "id": msg.id,
        "timestamp": msg.timestamp_iso,
        "severity": msg.severity.value,
        "source": msg.source,
        "text": msg.text,
        "metadata": msg.metadata,
        "webhook_id": msg.webhook_id,
    }


def _wh_to_dict(cfg: WebhookConfig) -> dict[str, Any]:
    return {
        "id": cfg.id,
        "name": cfg.name,
        "webhook_id": cfg.webhook_id,
        "default_severity": cfg.default_severity.value,
        "default_source": cfg.default_source,
        "field_map": cfg.field_map,
        "enabled": cfg.enabled,
        "created_at": cfg.created_at.isoformat(timespec="seconds"),
    }


def _get_repos(hass: HomeAssistant) -> tuple[MessageRepository, WebhookConfigRepository] | None:
    domain_data = hass.data.get(DOMAIN, {})
    if not domain_data:
        return None
    state = next(iter(domain_data.values()))
    msg_repo: MessageRepository | None = state.get("repository")
    wh_repo: WebhookConfigRepository | None = state.get("webhook_repository")
    if msg_repo is None or wh_repo is None:
        return None
    return msg_repo, wh_repo


def _get_database(hass: HomeAssistant) -> Any:
    domain_data = hass.data.get(DOMAIN, {})
    if not domain_data:
        return None
    state = next(iter(domain_data.values()))
    return state.get("database")


def _actor(request: web.Request) -> str:
    user = request.get("hass_user")
    if user is None:
        return "anonymous"
    return getattr(user, "name", None) or str(getattr(user, "id", "unknown"))


async def _audit(
    hass: HomeAssistant,
    request: web.Request,
    *,
    action: str,
    target_type: str,
    target_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    """Iter 44: Audit-Eintrag fuer alle administrativen API-Aktionen."""
    from .audit import AuditRepository  # noqa: PLC0415

    db = _get_database(hass)
    if db is None:
        return
    try:
        await AuditRepository(db).record(
            actor=_actor(request),
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
        )
    except (ValueError, RuntimeError) as err:
        _LOGGER.warning("audit log failed: %s", err)


class _RequireAdminView(HomeAssistantView):
    requires_auth = True

    @staticmethod
    def _check_admin(request: web.Request) -> None:
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            raise web.HTTPForbidden(reason="admin required")


class MessagesListView(_RequireAdminView):
    url = "/api/messagehub/messages"
    name = "api:messagehub:messages"

    async def delete(self, request: web.Request) -> web.Response:
        """Bulk-Delete: alle Nachrichten loeschen, optional gefiltert."""
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        msg_repo, _ = repos
        params = request.query
        severities = (
            [s.strip() for s in params["severity"].split(",") if s.strip()]
            if "severity" in params
            else None
        )
        deleted = await msg_repo.delete_filtered(
            severities=severities,
            source=params.get("source"),
            search=params.get("search"),
            from_iso=params.get("from"),
            to_iso=params.get("to"),
        )
        request.app["hass"].bus.async_fire(EVENT_MESSAGE_DELETED, {"bulk": True, "count": deleted})
        return self.json({"deleted": deleted})

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        msg_repo, _ = repos

        params = request.query
        try:
            limit = min(int(params.get("limit", DEFAULT_LIMIT)), HARD_CAP_LIMIT)
        except ValueError:
            limit = DEFAULT_LIMIT
        try:
            offset = max(0, int(params.get("offset", 0)))
        except ValueError:
            offset = 0
        severities = (
            [s.strip() for s in params["severity"].split(",") if s.strip()]
            if "severity" in params
            else None
        )
        source = params.get("source")
        search = params.get("search")
        from_iso = params.get("from")
        to_iso = params.get("to")
        order = params.get("order", "desc")

        items = await msg_repo.list_filtered(
            severities=severities,
            source=source,
            search=search,
            from_iso=from_iso,
            to_iso=to_iso,
            limit=limit,
            offset=offset,
            order=order,
        )
        total = await msg_repo.count_filtered(
            severities=severities,
            source=source,
            search=search,
            from_iso=from_iso,
            to_iso=to_iso,
        )
        return self.json(
            {
                "items": [_msg_to_dict(m) for m in items],
                "total": total,
                "limit": limit,
                "offset": offset,
            }
        )


class MessageDetailView(_RequireAdminView):
    url = "/api/messagehub/messages/{message_id}"
    name = "api:messagehub:message-detail"

    async def get(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        msg = await msg_repo.get_by_id(mid)
        if msg is None:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        return self.json(_msg_to_dict(msg))

    async def delete(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        deleted = await msg_repo.delete_by_id(mid)
        if not deleted:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        hass = request.app["hass"]
        hass.bus.async_fire(EVENT_MESSAGE_DELETED, {"id": mid})
        await _audit(hass, request, action="delete", target_type="message", target_id=str(mid))
        return self.json_message("deleted")


class SourcesView(_RequireAdminView):
    url = "/api/messagehub/sources"
    name = "api:messagehub:sources"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        msg_repo, _ = repos
        sources = await msg_repo.distinct_sources()
        return self.json({"sources": sources})


class StatsView(_RequireAdminView):
    url = "/api/messagehub/stats"
    name = "api:messagehub:stats"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        msg_repo, _ = repos
        return self.json(
            {
                "total": await msg_repo.count_total(),
                "severity_24h": await msg_repo.stats_severity_last_24h(),
            }
        )


class WebhooksView(_RequireAdminView):
    url = "/api/messagehub/webhooks"
    name = "api:messagehub:webhooks"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        _, wh_repo = repos
        return self.json({"webhooks": [_wh_to_dict(c) for c in await wh_repo.list_all()]})

    async def post(self, request: web.Request) -> web.Response:
        from .. import async_register_webhook  # noqa: PLC0415
        from ..storage import (  # noqa: PLC0415
            Severity,
            WebhookConfig,
            WebhookConfigRepository,
        )

        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        _, wh_repo = repos
        try:
            data = await request.json()
        except (ValueError, TypeError):
            return self.json_message(_ERR_INVALID_JSON, status_code=400)
        try:
            cfg = WebhookConfig(
                name=data["name"],
                webhook_id=WebhookConfigRepository.generate_webhook_id(),
                default_source=data["default_source"],
                default_severity=Severity.normalise(data.get("default_severity", "info")),
                field_map=data.get("field_map"),
                enabled=bool(data.get("enabled", True)),
            )
            await wh_repo.add(cfg)
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        if cfg.enabled:
            async_register_webhook(request.app["hass"], cfg)
        return self.json(_wh_to_dict(cfg))


class WebhookDetailView(_RequireAdminView):
    url = "/api/messagehub/webhooks/{webhook_id}"
    name = "api:messagehub:webhook-detail"

    async def get(self, request: web.Request, webhook_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        _, wh_repo = repos
        cfg = await wh_repo.get(webhook_id)
        if cfg is None:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        return self.json(_wh_to_dict(cfg))

    async def put(self, request: web.Request, webhook_id: str) -> web.Response:
        from .. import async_register_webhook, async_unregister_webhook  # noqa: PLC0415
        from ..storage import Severity  # noqa: PLC0415

        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        _, wh_repo = repos
        cfg = await wh_repo.get(webhook_id)
        if cfg is None:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        try:
            data = await request.json()
        except (ValueError, TypeError):
            return self.json_message(_ERR_INVALID_JSON, status_code=400)
        if "name" in data:
            cfg.name = data["name"]
        if "default_source" in data:
            cfg.default_source = data["default_source"]
        if "default_severity" in data:
            cfg.default_severity = Severity.normalise(data["default_severity"])
        if "field_map" in data:
            cfg.field_map = data["field_map"]
        if "enabled" in data:
            cfg.enabled = bool(data["enabled"])
        await wh_repo.update(cfg)
        if cfg.enabled:
            async_register_webhook(request.app["hass"], cfg)
        else:
            async_unregister_webhook(request.app["hass"], cfg.webhook_id)
        return self.json(_wh_to_dict(cfg))

    async def delete(self, request: web.Request, webhook_id: str) -> web.Response:
        from .. import async_unregister_webhook  # noqa: PLC0415

        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        _, wh_repo = repos
        if not await wh_repo.delete(webhook_id):
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        hass = request.app["hass"]
        async_unregister_webhook(hass, webhook_id)
        await _audit(
            hass,
            request,
            action="webhook_delete",
            target_type="webhook",
            target_id=webhook_id,
        )
        return self.json_message("deleted")


class MessageStatusView(_RequireAdminView):
    """Iter 28/29: PATCH-Status fuer eine Nachricht (acknowledge/resolve)."""

    url = "/api/messagehub/messages/{message_id}/status"
    name = "api:messagehub:message-status"

    async def post(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
            data = await request.json()
            new_status = str(data.get("status", "")).strip()
        except (ValueError, TypeError):
            return self.json_message(_ERR_INVALID_REQUEST, status_code=400)
        try:
            ok = await msg_repo.set_status(mid, new_status)
        except ValueError as err:
            return self.json_message(str(err), status_code=400)
        if not ok:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        await _audit(
            request.app["hass"],
            request,
            action="status_change",
            target_type="message",
            target_id=str(mid),
            details={"status": new_status},
        )
        return self.json({"id": mid, "status": new_status})


class MessageSeverityView(_RequireAdminView):
    """Inline-Edit: Severity einer einzelnen Nachricht aendern."""

    url = "/api/messagehub/messages/{message_id}/severity"
    name = "api:messagehub:message-severity"

    async def post(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
            data = await request.json()
            new_severity = str(data.get("severity", "")).strip().lower()
        except (ValueError, TypeError):
            return self.json_message(_ERR_INVALID_REQUEST, status_code=400)
        try:
            ok = await msg_repo.set_severity(mid, new_severity)
        except ValueError as err:
            return self.json_message(str(err), status_code=400)
        if not ok:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        await _audit(
            request.app["hass"],
            request,
            action="severity_change",
            target_type="message",
            target_id=str(mid),
            details={"severity": new_severity},
        )
        return self.json({"id": mid, "severity": new_severity})


class MessageTagsView(_RequireAdminView):
    """Iter 42: Tag-Verwaltung pro Nachricht."""

    url = "/api/messagehub/messages/{message_id}/tags"
    name = "api:messagehub:message-tags"

    async def get(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        return self.json({"tags": await msg_repo.get_tags(mid)})

    async def post(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
            data = await request.json()
            tag = str(data.get("tag", "")).strip()
        except (ValueError, TypeError):
            return self.json_message(_ERR_INVALID_REQUEST, status_code=400)
        if not tag:
            return self.json_message("tag required", status_code=400)
        await msg_repo.add_tag(mid, tag)
        return self.json({"tags": await msg_repo.get_tags(mid)})

    async def delete(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        tag = request.query.get("tag", "").strip()
        if not tag:
            return self.json_message("tag query required", status_code=400)
        await msg_repo.remove_tag(mid, tag)
        return self.json({"tags": await msg_repo.get_tags(mid)})


class RunbookForView(_RequireAdminView):
    """Iter 43: Runbook fuer eine Source (+ optional Fingerprint)."""

    url = "/api/messagehub/runbook/{source}"
    name = "api:messagehub:runbook"

    async def get(self, request: web.Request, source: str) -> web.Response:
        from ..processing.runbooks import RunbookRepository  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        fingerprint = request.query.get("fingerprint")
        rb = await RunbookRepository(db).find_for(source, fingerprint=fingerprint)
        if rb is None:
            return self.json_message("no runbook", status_code=404)
        return self.json(
            {
                "id": rb.id,
                "title": rb.title,
                "markdown": rb.markdown,
                "source_pattern": rb.source_pattern,
            }
        )


class AuditLogView(_RequireAdminView):
    """Iter 44: liest die letzten Audit-Eintraege."""

    url = "/api/messagehub/audit"
    name = "api:messagehub:audit"

    async def get(self, request: web.Request) -> web.Response:
        from .audit import AuditRepository  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            limit = min(int(request.query.get("limit", 200)), 1000)
        except ValueError:
            limit = 200
        items = await AuditRepository(db).list_recent(limit=limit)
        return self.json({"items": items})


class ExportView(_RequireAdminView):
    """Iter 45: Stream-Export im Format jsonl oder csv."""

    url = "/api/messagehub/export"
    name = "api:messagehub:export"

    async def get(self, request: web.Request) -> web.StreamResponse:
        from .export import messages_to_csv, messages_to_jsonl  # noqa: PLC0415

        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        msg_repo, _ = repos
        params = request.query
        fmt = params.get("format", "jsonl").lower()
        try:
            limit = min(int(params.get("limit", 1000)), 100_000)
        except ValueError:
            limit = 1000
        severities = (
            [s.strip() for s in params["severity"].split(",") if s.strip()]
            if "severity" in params
            else None
        )
        items = await msg_repo.list_filtered(
            severities=severities,
            source=params.get("source"),
            search=params.get("search"),
            from_iso=params.get("from"),
            to_iso=params.get("to"),
            limit=limit,
        )
        if fmt == "csv":
            body = messages_to_csv(items)
            content_type = "text/csv; charset=utf-8"
            filename = "messagehub-export.csv"
        else:
            body = messages_to_jsonl(items)
            content_type = "application/x-ndjson; charset=utf-8"
            filename = "messagehub-export.jsonl"
        return web.Response(
            text=body,
            headers={
                "Content-Type": content_type,
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )


class HeartbeatsView(_RequireAdminView):
    """Iter 35: Heartbeat-Sources verwalten."""

    url = "/api/messagehub/heartbeats"
    name = "api:messagehub:heartbeats"

    async def get(self, request: web.Request) -> web.Response:
        from ..processing.heartbeat import HeartbeatRepository  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        items = await HeartbeatRepository(db).list_all()
        return self.json(
            {
                "items": [
                    {
                        "source": hb.source,
                        "expected_interval_seconds": hb.expected_interval_seconds,
                        "last_seen": hb.last_seen.isoformat() if hb.last_seen else None,
                        "silent_alert_active": hb.silent_alert_active,
                        "enabled": hb.enabled,
                    }
                    for hb in items
                ]
            }
        )

    async def post(self, request: web.Request) -> web.Response:
        from ..processing.heartbeat import HeartbeatRepository, HeartbeatSource  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
            source = str(data["source"])
            interval = int(data["expected_interval_seconds"])
        except (KeyError, ValueError, TypeError):
            return self.json_message("source + expected_interval_seconds required", status_code=400)
        await HeartbeatRepository(db).upsert(
            HeartbeatSource(source=source, expected_interval_seconds=interval, enabled=True)
        )
        return self.json_message("ok")


class KnxProjectDiscoveryView(_RequireAdminView):
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
    import json as _json  # noqa: PLC0415
    from pathlib import Path as _Path  # noqa: PLC0415

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
                    return parsed
                except (OSError, ValueError):
                    continue
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


class KnxAddressesView(_RequireAdminView):
    """Iter 48 UI: KNX-Gruppenadressen verwalten + ETS-CSV-Import."""

    url = "/api/messagehub/knx-addresses"
    name = "api:messagehub:knx-addresses"

    async def get(self, request: web.Request) -> web.Response:
        from ..processing.knx_repo import KnxAddressRepository  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        items = await KnxAddressRepository(db).list_all()
        return self.json({"items": [it.to_dict() for it in items]})

    async def post(self, request: web.Request) -> web.Response:
        from ..processing.knx_repo import (  # noqa: PLC0415
            KnxAddress,
            KnxAddressRepository,
        )

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
        except (ValueError, TypeError):
            return self.json_message(_ERR_INVALID_JSON, status_code=400)

        repo = KnxAddressRepository(db)
        # Bulk-Import via {"csv": "..."}
        csv_content = data.get("csv") if isinstance(data, dict) else None
        if isinstance(csv_content, str) and csv_content.strip():
            stats = await repo.bulk_import_csv(csv_content)
            await _audit(
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
        await _audit(
            request.app["hass"],
            request,
            action="knx_upsert",
            target_type="knx_address",
            target_id=item.address,
            details={"label": item.label, "log_enabled": item.log_enabled},
        )
        return self.json(item.to_dict())


class KnxAddressDetailView(_RequireAdminView):
    url = "/api/messagehub/knx-addresses/{address:[^/]+}"
    name = "api:messagehub:knx-address-detail"

    async def delete(self, request: web.Request, address: str) -> web.Response:
        from ..processing.knx_repo import KnxAddressRepository  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        if not await KnxAddressRepository(db).delete(address):
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        await _audit(
            request.app["hass"],
            request,
            action="knx_delete",
            target_type="knx_address",
            target_id=address,
        )
        return self.json_message("deleted")


class ChannelsView(_RequireAdminView):
    """Iter 30/31: Notification-Channels CRUD."""

    url = "/api/messagehub/channels"
    name = "api:messagehub:channels"

    async def get(self, request: web.Request) -> web.Response:
        from ..notifications.repository import (  # noqa: PLC0415
            ChannelRepository,
            channel_to_dict,
        )

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        items = await ChannelRepository(db).list_all()
        return self.json({"items": [channel_to_dict(it) for it in items]})

    async def post(self, request: web.Request) -> web.Response:
        from ..notifications.repository import (  # noqa: PLC0415
            Channel,
            ChannelRepository,
            channel_to_dict,
        )

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
            ch = Channel(
                id=None,
                name=str(data["name"]),
                channel_type=str(data["channel_type"]),
                enabled=bool(data.get("enabled", True)),
                severity_threshold=str(data.get("severity_threshold", "warning")),
                quiet_start=data.get("quiet_start"),
                quiet_end=data.get("quiet_end"),
                quiet_bypass_error=bool(data.get("quiet_bypass_error", True)),
                throttle_seconds=int(data.get("throttle_seconds", 600)),
                config=data.get("config"),
            )
            await ChannelRepository(db).add(ch)
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        await _reload_dispatch(hass)
        await _audit(
            hass, request, action="channel_create", target_type="channel", target_id=str(ch.id)
        )
        return self.json(channel_to_dict(ch))


class ChannelTestView(_RequireAdminView):
    """v0.4: schickt eine Test-Nachricht ueber den Channel."""

    url = "/api/messagehub/channels/{channel_id}/test"
    name = "api:messagehub:channel-test"

    async def post(self, request: web.Request, channel_id: str) -> web.Response:
        from ..notifications.dispatch import build_forwarder_for_channels  # noqa: PLC0415
        from ..notifications.repository import ChannelRepository  # noqa: PLC0415
        from ..storage import Message, Severity  # noqa: PLC0415

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            cid = int(channel_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        channels = await ChannelRepository(db).list_all()
        target = next((c for c in channels if c.id == cid), None)
        if target is None:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)

        # Test ignoriert Throttle/Quiet — wir ueberschreiben temporaer die Schwelle
        # auf 'debug' und Throttle auf 0, damit die Test-Nachricht garantiert
        # durchkommt.
        target_copy = type(target)(
            id=target.id,
            name=target.name,
            channel_type=target.channel_type,
            enabled=True,
            severity_threshold="debug",
            quiet_start=None,
            quiet_end=None,
            quiet_bypass_error=True,
            throttle_seconds=0,
            config=target.config,
        )
        forwarder = build_forwarder_for_channels(hass, [target_copy])
        msg = Message(
            severity=Severity.INFO,
            source="messagehub.test",
            text=f"Test-Nachricht an Channel '{target.name}' — alles funktioniert.",
        )
        msg.id = -1
        delivered = await forwarder.dispatch(msg)
        await _audit(
            hass,
            request,
            action="channel_test",
            target_type="channel",
            target_id=channel_id,
        )
        return self.json({"delivered": delivered, "channel": target.name})


class ChannelDetailView(_RequireAdminView):
    url = "/api/messagehub/channels/{channel_id}"
    name = "api:messagehub:channel-detail"

    async def put(self, request: web.Request, channel_id: str) -> web.Response:
        from ..notifications.repository import (  # noqa: PLC0415
            Channel,
            ChannelRepository,
            channel_to_dict,
        )

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
            ch = Channel(
                id=int(channel_id),
                name=str(data["name"]),
                channel_type=str(data["channel_type"]),
                enabled=bool(data.get("enabled", True)),
                severity_threshold=str(data.get("severity_threshold", "warning")),
                quiet_start=data.get("quiet_start"),
                quiet_end=data.get("quiet_end"),
                quiet_bypass_error=bool(data.get("quiet_bypass_error", True)),
                throttle_seconds=int(data.get("throttle_seconds", 600)),
                config=data.get("config"),
            )
            await ChannelRepository(db).update(ch)
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        await _reload_dispatch(hass)
        await _audit(
            hass, request, action="channel_update", target_type="channel", target_id=channel_id
        )
        return self.json(channel_to_dict(ch))

    async def delete(self, request: web.Request, channel_id: str) -> web.Response:
        from ..notifications.repository import ChannelRepository  # noqa: PLC0415

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            cid = int(channel_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        if not await ChannelRepository(db).delete(cid):
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        await _reload_dispatch(hass)
        await _audit(
            hass, request, action="channel_delete", target_type="channel", target_id=channel_id
        )
        return self.json_message("deleted")


async def _reload_dispatch(hass: HomeAssistant) -> None:
    domain_data = hass.data.get(DOMAIN, {})
    if not domain_data:
        return
    state = next(iter(domain_data.values()))
    dispatch = state.get("dispatch")
    if dispatch is not None:
        await dispatch.reload()


class MqttTopicsView(_RequireAdminView):
    """Iter 37: MQTT-Topic-Subscriptions CRUD."""

    url = "/api/messagehub/mqtt-topics"
    name = "api:messagehub:mqtt-topics"

    async def get(self, request: web.Request) -> web.Response:
        from ..ingestion.mqtt_repo import MqttTopicRepository  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        items = await MqttTopicRepository(db).list_all()
        return self.json(
            {
                "items": [
                    {
                        "id": it.id,
                        "topic_pattern": it.topic_pattern,
                        "source": it.source,
                        "severity": it.severity,
                        "enabled": it.enabled,
                    }
                    for it in items
                ]
            }
        )

    async def post(self, request: web.Request) -> web.Response:
        from ..ingestion.mqtt_repo import MqttTopic, MqttTopicRepository  # noqa: PLC0415

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
            t = MqttTopic(
                id=None,
                topic_pattern=str(data["topic_pattern"]),
                source=str(data["source"]),
                severity=str(data.get("severity", "info")),
                enabled=bool(data.get("enabled", True)),
            )
            await MqttTopicRepository(db).add(t)
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        await _audit(
            hass,
            request,
            action="mqtt_topic_create",
            target_type="mqtt_topic",
            target_id=t.topic_pattern,
        )
        return self.json(
            {
                "id": t.id,
                "topic_pattern": t.topic_pattern,
                "source": t.source,
                "severity": t.severity,
                "enabled": t.enabled,
            }
        )


class MqttTopicDetailView(_RequireAdminView):
    url = "/api/messagehub/mqtt-topics/{topic_id}"
    name = "api:messagehub:mqtt-topic-detail"

    async def delete(self, request: web.Request, topic_id: str) -> web.Response:
        from ..ingestion.mqtt_repo import MqttTopicRepository  # noqa: PLC0415

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            tid = int(topic_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        if not await MqttTopicRepository(db).delete(tid):
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        await _audit(
            hass,
            request,
            action="mqtt_topic_delete",
            target_type="mqtt_topic",
            target_id=topic_id,
        )
        return self.json_message("deleted")


class RemediationHooksView(_RequireAdminView):
    """Iter 47: Auto-Remediation-Hooks CRUD."""

    url = "/api/messagehub/remediation-hooks"
    name = "api:messagehub:remediation-hooks"

    async def get(self, request: web.Request) -> web.Response:
        from ..processing.remediation_repo import RemediationHookRepository  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        items = await RemediationHookRepository(db).list_all()
        return self.json(
            {
                "items": [
                    {
                        "id": it.id,
                        "name": it.name,
                        "source_pattern": it.source_pattern,
                        "fingerprint": it.fingerprint,
                        "automation_id": it.automation_id,
                        "confirm_required": it.confirm_required,
                        "enabled": it.enabled,
                    }
                    for it in items
                ]
            }
        )

    async def post(self, request: web.Request) -> web.Response:
        from ..processing.remediation_repo import (  # noqa: PLC0415
            RemediationHook,
            RemediationHookRepository,
        )

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
            h = RemediationHook(
                id=None,
                name=str(data["name"]),
                source_pattern=str(data["source_pattern"]),
                fingerprint=data.get("fingerprint"),
                automation_id=str(data["automation_id"]),
                confirm_required=bool(data.get("confirm_required", True)),
                enabled=bool(data.get("enabled", True)),
            )
            await RemediationHookRepository(db).add(h)
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        await _audit(
            hass,
            request,
            action="remediation_create",
            target_type="remediation_hook",
            target_id=str(h.id),
        )
        return self.json({"id": h.id, "name": h.name})


class RemediationHookDetailView(_RequireAdminView):
    url = "/api/messagehub/remediation-hooks/{hook_id}"
    name = "api:messagehub:remediation-hook-detail"

    async def delete(self, request: web.Request, hook_id: str) -> web.Response:
        from ..processing.remediation_repo import RemediationHookRepository  # noqa: PLC0415

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            hid = int(hook_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        if not await RemediationHookRepository(db).delete(hid):
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        await _audit(
            hass,
            request,
            action="remediation_delete",
            target_type="remediation_hook",
            target_id=hook_id,
        )
        return self.json_message("deleted")


class StatsExtendedView(_RequireAdminView):
    """Iter 41: erweiterte Stats fuer Heatmap und Top-Sources."""

    url = "/api/messagehub/stats-extended"
    name = "api:messagehub:stats-extended"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        msg_repo, _ = repos
        try:
            days = min(int(request.query.get("days", 30)), 365)
        except ValueError:
            days = 30
        return self.json(
            {
                "heatmap": await msg_repo.heatmap_hour_weekday(days=days),
                "top_sources": await msg_repo.top_sources(limit=10, days=days),
                "mttr_per_source": await msg_repo.mttr_per_source(days=days),
                "severity_time_series": await msg_repo.severity_time_series(hours=24),
            }
        )


def async_register_views(hass: HomeAssistant) -> None:
    """Registriert alle API-Views (idempotent)."""
    for view_cls in (
        MessagesListView,
        MessageDetailView,
        MessageStatusView,
        MessageSeverityView,
        MessageTagsView,
        RunbookForView,
        AuditLogView,
        ExportView,
        HeartbeatsView,
        SourcesView,
        StatsView,
        WebhooksView,
        WebhookDetailView,
        KnxAddressesView,
        KnxAddressDetailView,
        KnxProjectDiscoveryView,
        ChannelsView,
        ChannelDetailView,
        ChannelTestView,
        MqttTopicsView,
        MqttTopicDetailView,
        RemediationHooksView,
        RemediationHookDetailView,
        StatsExtendedView,
    ):
        view = view_cls()
        # HA-internes Doppel-Register vermeiden
        with contextlib.suppress(RuntimeError):
            hass.http.register_view(view)
