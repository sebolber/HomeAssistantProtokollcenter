"""Webhook-Handler fuer messagehub.

Iteration 8: minimaler JSON-Webhook der severity/source/text 1:1
mappt und persistiert. Iter 9 ergaenzt persistierte Configs,
Iter 10 JSONPath-Mapping, Iter 11 Rate-/Body-Limits, Iter 12
Severity-Mapping pro Webhook.
"""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, Any

from aiohttp.web import Response

from ..const import DOMAIN, EVENT_MESSAGE_ADDED
from ..storage import Message, Severity, validate_source, validate_text

if TYPE_CHECKING:
    from aiohttp.web import Request
    from homeassistant.core import HomeAssistant

    from ..storage import MessageRepository

_LOGGER = logging.getLogger(__name__)

DEFAULT_BODY_LIMIT_BYTES = 64 * 1024


def _bad_request(reason: str) -> Response:
    return Response(status=400, text=reason)


async def async_handle_webhook(
    hass: HomeAssistant,
    webhook_id: str,
    request: Request,
    *,
    default_severity: Severity = Severity.INFO,
    default_source: str = "webhook",
    body_limit_bytes: int = DEFAULT_BODY_LIMIT_BYTES,
) -> Response:
    """Default-Handler fuer einen registrierten Webhook (Iter 8)."""
    if request.content_length is not None and request.content_length > body_limit_bytes:
        return Response(status=413, text="payload too large")

    raw = await request.read()
    if len(raw) > body_limit_bytes:
        return Response(status=413, text="payload too large")

    severity = default_severity
    source = default_source
    text: str
    metadata: dict[str, Any] | None = None

    if raw:
        try:
            payload = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError):
            # Plain-Text-Fallback laut Konzept §4.2
            text = raw.decode("utf-8", errors="replace")
            payload = None
        else:
            if isinstance(payload, dict):
                severity = Severity.normalise(payload.get("severity", severity))
                source = str(payload.get("source", source))
                text = str(payload.get("text", payload.get("message", "")))
                meta_raw = payload.get("metadata")
                if isinstance(meta_raw, dict):
                    metadata = meta_raw
            else:
                text = str(payload)
    else:
        return _bad_request("empty body")

    try:
        source = validate_source(source)
        text = validate_text(text)
    except (ValueError, TypeError) as err:
        return _bad_request(str(err))

    repo = _get_repo(hass)
    if repo is None:
        return Response(status=503, text="messagehub not initialised")

    msg = Message(
        severity=severity,
        source=source,
        text=text,
        metadata=metadata,
        webhook_id=webhook_id,
    )
    new_id = await repo.insert(msg)
    hass.bus.async_fire(
        EVENT_MESSAGE_ADDED,
        {
            "id": new_id,
            "severity": msg.severity.value,
            "source": msg.source,
            "text": msg.text,
            "metadata": msg.metadata,
            "timestamp": msg.timestamp_iso,
            "webhook_id": webhook_id,
        },
    )
    return Response(status=204)


def _get_repo(hass: HomeAssistant) -> MessageRepository | None:
    domain_data = hass.data.get(DOMAIN, {})
    if not domain_data:
        return None
    state = next(iter(domain_data.values()))
    return state.get("repository")
