"""Gemeinsame Utilities fuer alle API-Views.

Dient als Single-Source-of-Truth fuer:
- Standard-Error-Strings (verhindert Magic-Strings ueber Endpoints verstreut)
- Admin-Check-Mixin (`RequireAdminView`)
- DB-/Repo-Lookups (`get_repos`, `get_database`)
- Audit-Logging (`audit`)
- Param-Parsing (`parse_int_param`)
- Standard-Serializer (`msg_to_dict`, `wh_to_dict`)

Iter 72 / CR-1: Diese Helpers sind die einzige Implementation;
api/messages.py importiert sie via Aliases auf `_`-Names, damit der
restliche Code unangetastet bleibt. Zuvor existierten beide
Definitionen parallel — Drift-Risiko.
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


# Iter 81 / CR-30: Counter fuer fehlgeschlagene Audit-Schreibvorgaenge.
# Wird beim naechsten Prometheus-Scrape (Iter 69) sichtbar — gibt dem
# User eine Chance, persistente DB-Probleme zu erkennen.
_audit_failure_count: int = 0


def get_audit_failure_count() -> int:
    """Liefert die Anzahl der bisher fehlgeschlagenen Audit-Schreibvorgaenge.

    Wird vom Prometheus-Endpoint und (kuenftig) von Repair-Issues
    konsumiert. In-process state — wird beim HA-Restart zurueckgesetzt.
    """
    return _audit_failure_count


def reset_audit_failure_count() -> None:
    """Reset fuer Tests."""
    global _audit_failure_count  # noqa: PLW0603
    _audit_failure_count = 0


async def audit(
    hass: HomeAssistant,
    request: web.Request,
    *,
    action: str,
    target_type: str,
    target_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    """Audit-Eintrag fuer alle administrativen API-Aktionen (Iter 44).

    Iter 81 / CR-30: Failures jetzt auf ERROR (statt WARNING) +
    persistenter Counter, der ueber den Prometheus-Endpoint
    (Iter 69) sichtbar wird. Vorher schluckte der WARN-Log nahezu
    unbeachtet einen ausgefallenen Audit-Trail.
    """
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
    except (ValueError, RuntimeError):
        global _audit_failure_count  # noqa: PLW0603
        _audit_failure_count += 1
        _LOGGER.exception(
            "audit log failed (action=%s, target=%s/%s, total_failures=%d)",
            action,
            target_type,
            target_id,
            _audit_failure_count,
        )


class RequireAdminView(HomeAssistantView):
    """Base-Class fuer alle messagehub-API-Views — verlangt Admin-Login."""

    requires_auth = True

    @staticmethod
    def _check_admin(request: web.Request) -> None:
        # Iter 71 / CR-37: Delegiert an die HA-frei-testbare Funktion.
        from ._auth import assert_admin_user  # noqa: PLC0415

        assert_admin_user(request.get("hass_user"))


# Validatoren liegen in _validation.py (HA-frei, separat testbar).
# Code, der parse_iso_period/validate_knx_ga braucht, importiert direkt
# aus ._validation — siehe api/knx_stats.py.
