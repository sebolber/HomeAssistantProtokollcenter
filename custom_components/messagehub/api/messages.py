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
        request.app["hass"].bus.async_fire(EVENT_MESSAGE_DELETED, {"id": mid})
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


def async_register_views(hass: HomeAssistant) -> None:
    """Registriert alle API-Views (idempotent)."""
    for view_cls in (
        MessagesListView,
        MessageDetailView,
        SourcesView,
        StatsView,
        WebhooksView,
    ):
        view = view_cls()
        # HA-internes Doppel-Register vermeiden
        with contextlib.suppress(RuntimeError):
            hass.http.register_view(view)
