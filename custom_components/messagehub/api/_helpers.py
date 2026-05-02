"""Gemeinsame Utilities fuer alle API-Views.

Dient als Single-Source-of-Truth fuer:
- Standard-Error-Strings (verhindert Magic-Strings ueber Endpoints verstreut)
- Admin-Check-Mixin (`_RequireAdminView`)
- DB-/Repo-Lookups (`_get_repos`, `_get_database`)
- Audit-Logging (`_audit`)
- Param-Parsing (`_parse_int_param`)
- Standard-Serializer (`_msg_to_dict`, `_wh_to_dict`)

Zuvor lebten alle diese Helpers in api/messages.py (1382 Zeilen).
Auslagerung erlaubt es, einzelne Resource-Bereiche (knx, channels, mqtt)
in eigene Module zu schieben, ohne Imports zu duplizieren.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from ..const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from ..storage import Message, MessageRepository, WebhookConfig, WebhookConfigRepository

_LOGGER = logging.getLogger(__name__)

DEFAULT_LIMIT = 100
HARD_CAP_LIMIT = 1000

# Standard-Error-Messages fuer JSON-Responses.
ERR_NOT_INITIALISED = "not initialised"
ERR_NOT_INITIALISED_LONG = "messagehub not initialised"
ERR_NOT_FOUND = "not found"
ERR_INVALID_ID = "invalid id"
ERR_INVALID_REQUEST = "invalid request"
ERR_INVALID_JSON = "invalid json"


def msg_to_dict(msg: Message) -> dict[str, Any]:
    return {
        "id": msg.id,
        "timestamp": msg.timestamp_iso,
        "severity": msg.severity.value,
        "source": msg.source,
        "text": msg.text,
        "metadata": msg.metadata,
        "webhook_id": msg.webhook_id,
    }


def wh_to_dict(cfg: WebhookConfig) -> dict[str, Any]:
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


def get_repos(hass: HomeAssistant) -> tuple[MessageRepository, WebhookConfigRepository] | None:
    domain_data = hass.data.get(DOMAIN, {})
    if not domain_data:
        return None
    state = next(iter(domain_data.values()))
    msg_repo: MessageRepository | None = state.get("repository")
    wh_repo: WebhookConfigRepository | None = state.get("webhook_repository")
    if msg_repo is None or wh_repo is None:
        return None
    return msg_repo, wh_repo


def get_database(hass: HomeAssistant) -> Any:
    domain_data = hass.data.get(DOMAIN, {})
    if not domain_data:
        return None
    state = next(iter(domain_data.values()))
    return state.get("database")


def actor(request: web.Request) -> str:
    user = request.get("hass_user")
    if user is None:
        return "anonymous"
    return getattr(user, "name", None) or str(getattr(user, "id", "unknown"))


def parse_int_param(
    params: Any,
    name: str,
    default: int,
    *,
    min_value: int = 0,
    max_value: int | None = None,
) -> int:
    """Parst einen ganzzahligen Query-Param mit Logging bei Ungueltigkeit."""
    raw = params.get(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except (ValueError, TypeError):
        _LOGGER.warning(
            "invalid query param %s=%r — falling back to default %d",
            name,
            raw,
            default,
        )
        return default
    if value < min_value:
        _LOGGER.warning("query param %s=%d below min %d — clamping", name, value, min_value)
        value = min_value
    if max_value is not None and value > max_value:
        value = max_value
    return value


async def audit(
    hass: HomeAssistant,
    request: web.Request,
    *,
    action: str,
    target_type: str,
    target_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    """Audit-Eintrag fuer alle administrativen API-Aktionen (Iter 44)."""
    from .audit import AuditRepository  # noqa: PLC0415

    db = get_database(hass)
    if db is None:
        return
    try:
        await AuditRepository(db).record(
            actor=actor(request),
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
        )
    except (ValueError, RuntimeError) as err:
        _LOGGER.warning("audit log failed: %s", err)


class RequireAdminView(HomeAssistantView):
    """Base-Class fuer alle messagehub-API-Views — verlangt Admin-Login."""

    requires_auth = True

    @staticmethod
    def _check_admin(request: web.Request) -> None:
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            raise web.HTTPForbidden(reason="admin required")
