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
            return self.json_message("messagehub not initialised", status_code=503)
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
            return self.json_message("messagehub not initialised", status_code=503)
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
            return self.json_message("messagehub not initialised", status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
        except ValueError:
            return self.json_message("invalid id", status_code=400)
        msg = await msg_repo.get_by_id(mid)
        if msg is None:
            return self.json_message("not found", status_code=404)
        return self.json(_msg_to_dict(msg))

    async def delete(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message("messagehub not initialised", status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
        except ValueError:
            return self.json_message("invalid id", status_code=400)
        deleted = await msg_repo.delete_by_id(mid)
        if not deleted:
            return self.json_message("not found", status_code=404)
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
            return self.json_message("messagehub not initialised", status_code=503)
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
            return self.json_message("messagehub not initialised", status_code=503)
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
            return self.json_message("messagehub not initialised", status_code=503)
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
            return self.json_message("messagehub not initialised", status_code=503)
        _, wh_repo = repos
        try:
            data = await request.json()
        except (ValueError, TypeError):
            return self.json_message("invalid json", status_code=400)
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
            return self.json_message("not initialised", status_code=503)
        _, wh_repo = repos
        cfg = await wh_repo.get(webhook_id)
        if cfg is None:
            return self.json_message("not found", status_code=404)
        return self.json(_wh_to_dict(cfg))

    async def put(self, request: web.Request, webhook_id: str) -> web.Response:
        from .. import async_register_webhook, async_unregister_webhook  # noqa: PLC0415
        from ..storage import Severity  # noqa: PLC0415

        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message("not initialised", status_code=503)
        _, wh_repo = repos
        cfg = await wh_repo.get(webhook_id)
        if cfg is None:
            return self.json_message("not found", status_code=404)
        try:
            data = await request.json()
        except (ValueError, TypeError):
            return self.json_message("invalid json", status_code=400)
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
            return self.json_message("not initialised", status_code=503)
        _, wh_repo = repos
        if not await wh_repo.delete(webhook_id):
            return self.json_message("not found", status_code=404)
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
            return self.json_message("not initialised", status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
            data = await request.json()
            new_status = str(data.get("status", "")).strip()
        except (ValueError, TypeError):
            return self.json_message("invalid request", status_code=400)
        try:
            ok = await msg_repo.set_status(mid, new_status)
        except ValueError as err:
            return self.json_message(str(err), status_code=400)
        if not ok:
            return self.json_message("not found", status_code=404)
        await _audit(
            request.app["hass"],
            request,
            action="status_change",
            target_type="message",
            target_id=str(mid),
            details={"status": new_status},
        )
        return self.json({"id": mid, "status": new_status})


class MessageTagsView(_RequireAdminView):
    """Iter 42: Tag-Verwaltung pro Nachricht."""

    url = "/api/messagehub/messages/{message_id}/tags"
    name = "api:messagehub:message-tags"

    async def get(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message("not initialised", status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
        except ValueError:
            return self.json_message("invalid id", status_code=400)
        return self.json({"tags": await msg_repo.get_tags(mid)})

    async def post(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message("not initialised", status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
            data = await request.json()
            tag = str(data.get("tag", "")).strip()
        except (ValueError, TypeError):
            return self.json_message("invalid request", status_code=400)
        if not tag:
            return self.json_message("tag required", status_code=400)
        await msg_repo.add_tag(mid, tag)
        return self.json({"tags": await msg_repo.get_tags(mid)})

    async def delete(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message("not initialised", status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
        except ValueError:
            return self.json_message("invalid id", status_code=400)
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
            return self.json_message("not initialised", status_code=503)
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
            return self.json_message("not initialised", status_code=503)
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
            return self.json_message("not initialised", status_code=503)
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
            return self.json_message("not initialised", status_code=503)
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
            return self.json_message("not initialised", status_code=503)
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


def async_register_views(hass: HomeAssistant) -> None:
    """Registriert alle API-Views (idempotent)."""
    for view_cls in (
        MessagesListView,
        MessageDetailView,
        MessageStatusView,
        MessageTagsView,
        RunbookForView,
        AuditLogView,
        ExportView,
        HeartbeatsView,
        SourcesView,
        StatsView,
        WebhooksView,
        WebhookDetailView,
    ):
        view = view_cls()
        # HA-internes Doppel-Register vermeiden
        with contextlib.suppress(RuntimeError):
            hass.http.register_view(view)
