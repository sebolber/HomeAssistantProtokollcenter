"""KNX-Listener: haengt direkt am xknx-Telegram-Stream (primary) oder
am HA-Eventbus 'knx_event' (fallback).

Single source of truth fuer "Welche GA wird geloggt?" ist die
messagehub-DB-Tabelle knx_group_addresses (per Panel verwaltet).
HA-KNX braucht keine 'event:'-Konfig — wir filtern selbst.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from ..const import DOMAIN
from ..helpers import fire_message_added
from ..processing.knx_cache import KnxWhitelistCache
from ..processing.knx_dpt import format_value as format_knx_value
from ..processing.knx_repo import KnxAddressRepository, resolve_severity
from ..repair import report_knx_unavailable
from ..storage import Message, Severity

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class KnxTelegramData:
    """Typsichere Repraesentation eines KNX-Telegramms im Hot-Path.

    Vereint die zwei Eingangsquellen (HA-Eventbus 'knx_event' und xknx-
    Telegram-Hook) in ein einheitliches Schema, damit `_build_knx_message`
    und `_ingest` mit konkretem Typ statt `dict[str, Any]` arbeiten.
    """

    destination: str
    source: str
    telegramtype: str | None
    value: Any
    raw: Any
    # Iter 12 (QS-a): xknx markiert Wiederholungs-Telegramme — wenn der
    # erste Sendeversuch nicht ACKed wurde. Hohe Quote = Bus-Probleme.
    repeated: bool = False

    @classmethod
    def from_event_data(cls, data: dict[str, Any]) -> KnxTelegramData:
        """Adapter fuer den HA-Eventbus 'knx_event' (Fallback-Pfad)."""
        return cls(
            destination=str(data.get("destination") or "").strip(),
            source=str(data.get("source") or ""),
            telegramtype=data.get("telegramtype"),
            value=data.get("value"),
            raw=data.get("data"),
            repeated=bool(data.get("repeated", False)),
        )

    @classmethod
    def from_telegram(cls, telegram: Any) -> KnxTelegramData:
        """Adapter fuer den primaeren xknx-Telegram-Hook."""
        payload = getattr(telegram, "payload", None)
        payload_type = type(payload).__name__ if payload is not None else None
        telegramtype = (
            payload_type if payload_type and payload_type.startswith("GroupValue") else None
        )
        return cls(
            destination=str(getattr(telegram, "destination_address", "")).strip(),
            source=str(getattr(telegram, "source_address", "")),
            telegramtype=telegramtype,
            value=getattr(payload, "value", None),
            raw=getattr(payload, "raw_value", None) or getattr(payload, "value_raw", None),
            repeated=bool(getattr(telegram, "repeated", False)),
        )

    def best_value(self) -> Any:
        """Liefert payload.value bevorzugt, sonst raw bytes — wie sie der
        DPT-Formatter und Severity-Resolver erwarten."""
        return self.value if self.value is not None else self.raw


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
    """Backward-compat-Adapter: liefert dict-Form fuer Tests, die das alte
    knx_event-Schema erwarten. Neue Code-Pfade nutzen KnxTelegramData direkt."""
    td = KnxTelegramData.from_telegram(telegram)
    return {
        "destination": td.destination,
        "source": td.source,
        "telegramtype": td.telegramtype,
        "value": td.value,
        "data": td.raw,
    }


def _build_knx_message(cfg: Any, data: dict[str, Any] | KnxTelegramData) -> Any:
    """Baut die Message-DTO aus Telegram-Daten + GA-Konfiguration.

    Akzeptiert sowohl die typed KnxTelegramData (neuer Hot-Path) als auch
    das alte dict-Schema (Backward-Compat fuer bestehende Tests).
    """
    td = data if isinstance(data, KnxTelegramData) else KnxTelegramData.from_event_data(data)
    value = td.best_value()
    severity = Severity.normalise(resolve_severity(cfg, value))
    formatted = format_knx_value(cfg.dpt, value)
    text = f"{cfg.label} = {formatted}" if formatted else cfg.label
    if td.telegramtype and td.telegramtype != "GroupValueWrite":
        text = f"{text} ({td.telegramtype})"
    return Message(
        severity=severity,
        source="knx-bus",
        text=text,
        metadata={
            "knx_ga": td.destination,
            "knx_label": cfg.label,
            "knx_dpt": cfg.dpt,
            "knx_value": value,
            "knx_source": td.source,
            "knx_telegramtype": td.telegramtype,
            "knx_repeated": td.repeated,
        },
    )


# ISO-Format minimum laenge fuer "YYYY-MM-DDTHH" — fuer Bucket-Truncation.
_ISO_HOUR_PREFIX_LEN = 13


def _build_listener_state(hass: HomeAssistant, database: Any) -> tuple[Any, Any]:
    """Initialisiert Whitelist-Cache + Schatten-Counter-Repo.

    Phase-2-Vorbereitung: counters_repo wird vom Listener nach jedem
    erfolgreichen Insert befuellt — der Aufwand ist ein UPSERT pro
    Telegramm und kann via hass.data[DOMAIN]['_knx_shadow_counters_enabled']
    deaktiviert werden.
    """
    from ..storage.knx_stats_repo import KnxStatsRepository  # noqa: PLC0415

    knx_repo = KnxAddressRepository(database)
    cache = KnxWhitelistCache(knx_repo)
    hass.data.setdefault(DOMAIN, {}).setdefault("_knx_whitelist_cache", cache)
    counters_repo = KnxStatsRepository(database)
    return cache, counters_repo


async def _maybe_increment_shadow_counter(
    hass: HomeAssistant, counters_repo: Any, destination: str, msg: Any
) -> None:
    """Iter 16: pflegt den Schatten-Counter-Cache — opt-out via hass.data."""
    if not hass.data.get(DOMAIN, {}).get("_knx_shadow_counters_enabled", True):
        return
    try:
        hour_bucket = _hour_bucket_now(msg)
        await counters_repo.increment_counter(destination, hour_bucket)
    except (ValueError, RuntimeError) as err:
        # Counter-Pflege darf NIE den Hot-Path brechen — nur loggen
        _LOGGER.debug("shadow counter update skipped: %s", err)


def _hour_bucket_now(msg: Any) -> str:
    """Liefert den Stunden-Bucket-String fuer den Schatten-Counter.

    Format: ISO-Stunde (z. B. "2026-05-02T16:00:00") — kompatibel mit
    BETWEEN-Filtern in der counter-Query.
    """
    from datetime import UTC, datetime  # noqa: PLC0415

    ts = msg.timestamp_iso if hasattr(msg, "timestamp_iso") else None
    if ts is None or not isinstance(ts, str) or len(ts) < _ISO_HOUR_PREFIX_LEN:
        return datetime.now(UTC).strftime("%Y-%m-%dT%H:00:00")
    return ts[:_ISO_HOUR_PREFIX_LEN] + ":00:00"


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


def async_register_knx_listener(hass: HomeAssistant, database: Any, repository: Any) -> Any:
    """Registriert den KNX-Listener — primaer xknx-Hook, Fallback knx_event."""
    cache, counters_repo = _build_listener_state(hass, database)
    seen_first = {"flag": False}

    async def _ingest(td: KnxTelegramData) -> None:
        if not seen_first["flag"]:
            seen_first["flag"] = True
            _LOGGER.info(
                "messagehub: erstes KNX-Telegramm empfangen — ga=%s type=%s",
                td.destination,
                td.telegramtype,
            )
        else:
            _LOGGER.debug(
                "knx telegram ga=%s type=%s value=%s", td.destination, td.telegramtype, td.value
            )
        if not td.destination:
            return
        cfg = await cache.get(td.destination)
        if cfg is None:
            _LOGGER.debug("knx %s: GA nicht in messagehub-Whitelist", td.destination)
            return
        if not cfg.log_enabled:
            _LOGGER.debug("knx %s: log_enabled=0, skip", td.destination)
            return
        msg = _build_knx_message(cfg, td)
        await repository.insert_or_aggregate(msg, window_minutes=10)
        await _maybe_increment_shadow_counter(hass, counters_repo, td.destination, msg)
        fire_message_added(hass, msg)
        _LOGGER.info("messagehub knx-bus: %s -> %s [%s]", td.destination, msg.text, msg.severity)

    xknx = _get_xknx_instance(hass)
    if xknx is not None:
        try:
            queue = getattr(xknx, "telegram_queue", None) or getattr(xknx, "telegrams", None)
            if queue is not None and hasattr(queue, "register_telegram_received_cb"):
                # xknx erwartet Callable[[Telegram], None] (sync). Eine
                # `async def`-Callback liefert nur eine Coroutine zurueck,
                # die nie geawaited wird ("coroutine was never awaited").
                # v0.10.2: sync-Wrapper, der die echte Ingest-Coroutine als
                # HA-Task im Eventloop scheduled.
                async def _handle_telegram(telegram: Any) -> None:
                    try:
                        await _ingest(KnxTelegramData.from_telegram(telegram))
                    except (ValueError, TypeError, KeyError) as err:
                        _LOGGER.debug("knx telegram ingest skipped: %s", err)

                def _on_telegram(telegram: Any) -> None:
                    hass.async_create_task(_handle_telegram(telegram))

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
                "messagehub: xknx-Hook nicht verfuegbar (%s) — falle auf knx_event-Bus zurueck",
                err,
            )

    _LOGGER.warning(
        "messagehub: kein xknx-Hook moeglich — falle auf knx_event-Bus zurueck. "
        "Damit Telegramme ankommen, in configuration.yaml 'knx: event: <ga-liste>' eintragen."
    )
    # Repair-Issue: HA-Settings -> Reparaturen zeigt dem User direkt
    # einen Hinweis statt nur stiller Log-Zeile.
    report_knx_unavailable(hass)

    async def _on_knx_event(event: Any) -> None:
        try:
            await _ingest(KnxTelegramData.from_event_data(dict(event.data)))
        except (ValueError, TypeError, KeyError) as err:
            _LOGGER.debug("knx_event ingest skipped: %s", err)

    return hass.bus.async_listen("knx_event", _on_knx_event)
