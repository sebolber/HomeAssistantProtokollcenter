"""KNX-Listener: haengt direkt am xknx-Telegram-Stream (primary) oder
am HA-Eventbus 'knx_event' (fallback).

Single source of truth fuer "Welche GA wird geloggt?" ist die
messagehub-DB-Tabelle knx_group_addresses (per Panel verwaltet).
HA-KNX braucht keine 'event:'-Konfig — wir filtern selbst.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from ..const import DOMAIN
from ..helpers import fire_message_added

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)


def _log_knx_event(seen_first: dict[str, bool], ga: str, data: dict[str, Any]) -> None:
    """Loggt das erste empfangene knx_event auf INFO-Level, alle weiteren auf DEBUG."""
    if not seen_first["flag"]:
        seen_first["flag"] = True
        _LOGGER.info(
            "messagehub: erstes knx_event empfangen — ga=%s keys=%s",
            ga,
            sorted(data.keys()),
        )
    else:
        _LOGGER.debug("knx_event ga=%s data=%s", ga, data)


def _telegram_to_knx_event_data(telegram: Any) -> dict[str, Any]:
    """Wandelt ein xknx-Telegram-Objekt in das knx_event-Datenschema um.

    Damit kann _build_knx_message() weiterhin auf einer einheitlichen
    Datenstruktur arbeiten — egal ob das Telegramm aus dem
    HA-Eventbus oder direkt aus dem xknx-Telegram-Hook kommt.
    """
    payload = getattr(telegram, "payload", None)
    payload_type = type(payload).__name__ if payload is not None else None
    telegramtype = (
        payload_type if payload_type and payload_type.startswith("GroupValue") else None
    )
    value = getattr(payload, "value", None)
    raw = getattr(payload, "raw_value", None) or getattr(payload, "value_raw", None)
    return {
        "destination": str(getattr(telegram, "destination_address", "")),
        "source": str(getattr(telegram, "source_address", "")),
        "telegramtype": telegramtype,
        "value": value,
        "data": raw,
    }


def _build_knx_message(cfg: Any, data: dict[str, Any]) -> Any:
    """Baut die Message-DTO aus knx_event-Payload + GA-Konfiguration."""
    from ..processing.knx_dpt import format_value as format_knx_value  # noqa: PLC0415
    from ..processing.knx_repo import resolve_severity  # noqa: PLC0415
    from ..storage import Message, Severity  # noqa: PLC0415

    telegramtype = data.get("telegramtype")
    value = data.get("value") if data.get("value") is not None else data.get("data")
    severity = Severity.normalise(resolve_severity(cfg, value))
    formatted = format_knx_value(cfg.dpt, value)
    text = f"{cfg.label} = {formatted}" if formatted else cfg.label
    if telegramtype and telegramtype != "GroupValueWrite":
        text = f"{text} ({telegramtype})"
    return Message(
        severity=severity,
        source="knx-bus",
        text=text,
        metadata={
            "knx_ga": data.get("destination"),
            "knx_label": cfg.label,
            "knx_dpt": cfg.dpt,
            "knx_value": value,
            "knx_source": data.get("source"),
            "knx_telegramtype": telegramtype,
        },
    )


def _get_xknx_instance(hass: HomeAssistant) -> Any:
    """Best-effort: holt die xknx-Instance aus der HA-KNX-Integration."""
    knx_data = hass.data.get("knx")
    if knx_data is None:
        return None
    xknx = getattr(knx_data, "xknx", None)
    if xknx is not None:
        return xknx
    if isinstance(knx_data, dict):
        return knx_data.get("xknx")
    return None


def async_register_knx_listener(
    hass: HomeAssistant, database: Any, repository: Any
) -> Any:
    """Registriert den KNX-Listener — primaer xknx-Hook, Fallback knx_event."""
    from ..processing.knx_cache import KnxWhitelistCache  # noqa: PLC0415
    from ..processing.knx_repo import KnxAddressRepository  # noqa: PLC0415

    knx_repo = KnxAddressRepository(database)
    cache = KnxWhitelistCache(knx_repo)
    hass.data.setdefault(DOMAIN, {}).setdefault("_knx_whitelist_cache", cache)
    seen_first = {"flag": False}

    async def _ingest(data: dict[str, Any]) -> None:
        ga = str(data.get("destination") or "").strip()
        _log_knx_event(seen_first, ga, data)
        if not ga:
            return
        cfg = await cache.get(ga)
        if cfg is None:
            _LOGGER.debug("knx %s: GA nicht in messagehub-Whitelist", ga)
            return
        if not cfg.log_enabled:
            _LOGGER.debug("knx %s: log_enabled=0, skip", ga)
            return
        msg = _build_knx_message(cfg, data)
        await repository.insert_or_aggregate(msg, window_minutes=10)
        fire_message_added(hass, msg)
        _LOGGER.info("messagehub knx-bus: %s -> %s [%s]", ga, msg.text, msg.severity)

    xknx = _get_xknx_instance(hass)
    if xknx is not None:
        try:
            queue = getattr(xknx, "telegram_queue", None) or getattr(xknx, "telegrams", None)
            if queue is not None and hasattr(queue, "register_telegram_received_cb"):

                async def _on_telegram(telegram: Any) -> None:
                    try:
                        await _ingest(_telegram_to_knx_event_data(telegram))
                    except (ValueError, TypeError, KeyError) as err:
                        _LOGGER.debug("knx telegram ingest skipped: %s", err)

                queue.register_telegram_received_cb(_on_telegram)
                _LOGGER.info(
                    "messagehub: KNX-Listener via xknx-Telegram-Hook aktiv "
                    "(keine 'event:'-Konfig in HA-KNX noetig)"
                )

                def _unsub_xknx() -> None:
                    try:
                        queue.unregister_telegram_received_cb(_on_telegram)
                    except (ValueError, AttributeError, TypeError) as err:
                        _LOGGER.debug("xknx unregister skipped: %s", err)

                return _unsub_xknx
        except (AttributeError, TypeError) as err:
            _LOGGER.warning(
                "messagehub: xknx-Hook nicht verfuegbar (%s) — "
                "falle auf knx_event-Bus zurueck",
                err,
            )

    _LOGGER.warning(
        "messagehub: kein xknx-Hook moeglich — falle auf knx_event-Bus zurueck. "
        "Damit Telegramme ankommen, in configuration.yaml 'knx: event: <ga-liste>' eintragen."
    )

    async def _on_knx_event(event: Any) -> None:
        try:
            await _ingest(dict(event.data))
        except (ValueError, TypeError, KeyError) as err:
            _LOGGER.debug("knx_event ingest skipped: %s", err)

    return hass.bus.async_listen("knx_event", _on_knx_event)
