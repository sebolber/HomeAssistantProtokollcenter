"""Webhook-Handler fuer messagehub.

Iter 8: 1:1 severity/source/text/metadata
Iter 10: JSONPath-Field-Mapping via processing.field_mapping.FieldMapper
Iter 11: Body-Limit 64 KB, Token-Bucket-Rate-Limit, Selbst-Diagnose
Iter 12: Severity-Mapping-Tabelle pro Webhook (in field_mapping.py)
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from aiohttp.web import Response

from ..const import DOMAIN, EVENT_MESSAGE_ADDED
from ..processing.field_mapping import FieldMapper
from ..processing.rate_limit import TokenBucketLimiter
from ..storage import Message, Severity, validate_source, validate_text

if TYPE_CHECKING:
    from aiohttp.web import Request
    from homeassistant.core import HomeAssistant

    from ..storage import MessageRepository, WebhookConfig

_LOGGER = logging.getLogger(__name__)

DEFAULT_BODY_LIMIT_BYTES = 64 * 1024
RATE_LIMITER = TokenBucketLimiter(capacity=60.0, refill_per_minute=60.0)


def _bad_request(reason: str) -> Response:
    return Response(status=400, text=reason)


async def async_handle_webhook(  # noqa: PLR0911
    hass: HomeAssistant,
    webhook_id: str,
    request: Request,
    *,
    config: WebhookConfig | None = None,
    default_severity: Severity = Severity.INFO,
    default_source: str = "webhook",
    body_limit_bytes: int = DEFAULT_BODY_LIMIT_BYTES,
) -> Response:
    # Iter 11: Rate-Limit
    if not RATE_LIMITER.allow(webhook_id):
        return Response(status=429, text="rate limit exceeded")

    # Iter 11: Body-Size-Check
    if request.content_length is not None and request.content_length > body_limit_bytes:
        return Response(status=413, text="payload too large")

    raw = await request.read()
    if len(raw) > body_limit_bytes:
        return Response(status=413, text="payload too large")
    if not raw:
        await _self_diagnose(hass, webhook_id, "empty body")
        return _bad_request("empty body")

    # Mapping aus persistierter Config oder Default-Pfaden zusammenbauen
    mapping: dict[str, str] = {
        "severity": "$.severity",
        "source": "$.source",
        "text": "$.text",
        "timestamp": "$.timestamp",
        "metadata": "$.metadata",
    }
    severity_map: dict[str, str] = {}
    defaults: dict[str, Any] = {
        "severity": (config.default_severity if config else default_severity),
        "source": (config.default_source if config else default_source),
    }
    if config and config.field_map:
        mapping.update(config.field_map)
    if config and config.field_map and "_severity_map" in config.field_map:
        # Reservierter Sub-Key in field_map fuer per-Webhook Severity-Tabelle
        smap = config.field_map.get("_severity_map")
        if isinstance(smap, dict):
            severity_map = smap

    payload: Any
    try:
        payload = json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError):
        payload = raw.decode("utf-8", errors="replace")

    mapped = FieldMapper(mapping=mapping, severity_map=severity_map, defaults=defaults).map_payload(
        payload
    )

    severity = Severity.normalise(mapped.get("severity", defaults["severity"]))
    source = str(mapped.get("source", defaults["source"]))
    text = str(mapped.get("text", ""))
    metadata = mapped.get("metadata")
    if not isinstance(metadata, dict):
        metadata = None

    try:
        source = validate_source(source)
        text = validate_text(text)
    except (ValueError, TypeError) as err:
        await _self_diagnose(hass, webhook_id, str(err))
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


async def _self_diagnose(hass: HomeAssistant, webhook_id: str, reason: str) -> None:
    """Schreibt einen Selbst-Diagnose-Eintrag mit source=messagehub.internal."""
    repo = _get_repo(hass)
    if repo is None:
        return
    try:
        msg = Message(
            severity=Severity.ERROR,
            source="messagehub.internal",
            text=f"webhook {webhook_id} rejected: {reason}",
            metadata={"webhook_id": webhook_id, "ts": datetime.now(UTC).isoformat()},
            webhook_id=webhook_id,
        )
        await repo.insert(msg)
    except (ValueError, RuntimeError, TypeError) as exc:
        _LOGGER.warning("Self-diagnose-insert fehlgeschlagen: %s", exc)


def _get_repo(hass: HomeAssistant) -> MessageRepository | None:
    domain_data = hass.data.get(DOMAIN, {})
    if not domain_data:
        return None
    state = next(iter(domain_data.values()))
    return state.get("repository")
