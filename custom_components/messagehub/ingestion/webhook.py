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


def _build_field_mapping(
    config: WebhookConfig | None,
    default_severity: Severity,
    default_source: str,
) -> tuple[dict[str, str], dict[str, str], dict[str, Any]]:
    """Bauft Field-Mapping, Severity-Map und Defaults aus Webhook-Config.

    Ausgelagert aus async_handle_webhook, um dessen Cognitive Complexity
    (Sonar-Limit 15) zu reduzieren.
    """
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
        smap = config.field_map.get("_severity_map")
        if isinstance(smap, dict):
            # Reservierter Sub-Key in field_map fuer per-Webhook Severity-Tabelle
            severity_map = smap
    return mapping, severity_map, defaults


def _parse_payload(raw: bytes) -> Any:
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return raw.decode("utf-8", errors="replace")


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

    mapping, severity_map, defaults = _build_field_mapping(config, default_severity, default_source)
    payload = _parse_payload(raw)
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

    # Iter 48: KNX-Anreicherung aus DB-Tabelle knx_group_addresses.
    metadata = await _enrich_knx(hass, source, text, metadata)
    # v0.3: GeoIP-Anreicherung (optional, wenn .mmdb vorhanden)
    metadata = _enrich_geoip(hass, text, metadata)

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


def _enrich_geoip(
    hass: HomeAssistant,
    text: str,
    metadata: dict[str, Any] | None,
) -> dict[str, Any] | None:
    """v0.3: ergaenzt geo-Felder fuer enthaltene oeffentliche IPs."""
    domain_data = hass.data.get(DOMAIN, {})
    if not domain_data:
        return metadata
    state = next(iter(domain_data.values()))
    geoip = state.get("geoip")
    if geoip is None or not getattr(geoip, "enabled", False):
        return metadata

    from ..processing.geoip import extract_ips  # noqa: PLC0415

    enriched: dict[str, Any] = dict(metadata or {})
    geo_entries: list[dict[str, str]] = []
    for ip in extract_ips(text):
        info = geoip.lookup(ip)
        if info is not None:
            geo_entries.append({"ip": ip, **info})
    if geo_entries:
        enriched["geo"] = geo_entries
    return enriched if enriched else metadata


def _get_repo(hass: HomeAssistant) -> MessageRepository | None:
    domain_data = hass.data.get(DOMAIN, {})
    if not domain_data:
        return None
    state = next(iter(domain_data.values()))
    repo: MessageRepository | None = state.get("repository")
    return repo


async def _enrich_knx(  # noqa: PLR0911
    hass: HomeAssistant,
    source: str,
    text: str,
    metadata: dict[str, Any] | None,
) -> dict[str, Any] | None:
    """Iter 48 (UI-Variante): ergaenzt metadata.knx_label aus der DB-Tabelle
    knx_group_addresses, falls source=knx* und eine GA im Text vorkommt."""
    if not source.startswith("knx"):
        return metadata

    from ..processing.knx import extract_group_address  # noqa: PLC0415
    from ..processing.knx_repo import KnxAddressRepository  # noqa: PLC0415

    ga = extract_group_address(text)
    if ga is None:
        return metadata

    domain_data = hass.data.get(DOMAIN, {})
    if not domain_data:
        return metadata
    state = next(iter(domain_data.values()))
    db = state.get("database")
    if db is None:
        return metadata

    try:
        label = await KnxAddressRepository(db).lookup(ga)
    except (ValueError, RuntimeError) as err:
        _LOGGER.debug("KNX lookup failed: %s", err)
        return metadata

    if label is None:
        return metadata
    enriched = dict(metadata or {})
    enriched["knx_ga"] = ga
    enriched["knx_label"] = label
    return enriched
