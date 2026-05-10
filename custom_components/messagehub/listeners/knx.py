"""KNX-Listener: haengt direkt am xknx-Telegram-Stream (primary) oder
am HA-Eventbus 'knx_event' (fallback).

Single source of truth fuer "Welche GA wird geloggt?" ist die
messagehub-DB-Tabelle knx_group_addresses (per Panel verwaltet).
HA-KNX braucht keine 'event:'-Konfig — wir filtern selbst.

Iter A1: Bus-weite Telegramm-Erfassung laeuft ueber einen
``KnxIngestWorker`` mit asyncio-Queue + Batch-Flush statt pro Telegramm
zwei einzelner SQL-Statements. Hot-Path-Last sinkt damit drastisch und
der HA-Eventloop bleibt auch bei Reconnect-Storms (~48 Tel/s) frei.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
from collections import deque
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from ..const import (
    DOMAIN,
    HASS_KEY_KNX_BUS_ANALYSIS,
    KNX_INGEST_FLUSH_INTERVAL_SEC,
    KNX_INGEST_MAX_BATCH_SIZE,
    KNX_INGEST_MAX_QUEUE_SIZE,
)
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


def _build_listener_state(hass: HomeAssistant, database: Any) -> tuple[Any, Any, KnxIngestWorker]:
    """Initialisiert Whitelist-Cache + Schatten-Counter-Repo + Ingest-Worker.

    Iter A1: Der Worker wird hier instanziiert und im hass.data abgelegt,
    damit ``async_unload_entry`` ihn beim Reload kontrolliert stoppen
    kann. Worker.start() laeuft direkt im Anschluss; enqueue() ist
    synchron und nicht-blockierend.
    """
    from ..storage.knx_stats_repo import KnxStatsRepository  # noqa: PLC0415

    knx_repo = KnxAddressRepository(database)
    cache = KnxWhitelistCache(knx_repo)
    hass.data.setdefault(DOMAIN, {}).setdefault("_knx_whitelist_cache", cache)
    counters_repo = KnxStatsRepository(database)
    worker = KnxIngestWorker(counters_repo)
    hass.data[DOMAIN]["_knx_ingest_worker"] = worker
    return cache, counters_repo, worker


class KnxIngestWorker:
    """Iter A1: Batch-Worker fuer bus-weite KNX-Telegramm-Erfassung.

    Statt pro Telegramm zwei einzelne SQL-Statements feuert dieser
    Worker `executemany()` in einem Commit. Senkt fsync-Aufkommen und
    haelt den HA-Eventloop unter Reconnect-Storms (~48 Tel/s) frei.

    Lebenszyklus:
        worker = KnxIngestWorker(repo)
        await worker.start()      # spawned Background-Task
        worker.enqueue(hass, td)  # synchron, nicht-blockierend
        ...
        await worker.stop()       # flusht pending + cancelt Task

    Robust unter Last:
    - Queue mit Hard-Cap (`max_queue_size`); bei Voll werden aelteste
      Eintraege verworfen, ``dropped_count`` zaehlt.
    - Repo-Exceptions im Flush brechen den Worker nicht; nur DEBUG-Log.
    - Bus-Analyse-Toggle (`HASS_KEY_KNX_BUS_ANALYSIS`) wird beim
      Enqueue gelesen — kein Polling.
    """

    def __init__(
        self,
        repo: Any,
        *,
        max_batch_size: int = KNX_INGEST_MAX_BATCH_SIZE,
        flush_interval_sec: float = KNX_INGEST_FLUSH_INTERVAL_SEC,
        max_queue_size: int = KNX_INGEST_MAX_QUEUE_SIZE,
    ) -> None:
        self._repo = repo
        self._max_batch_size = max_batch_size
        self._flush_interval = flush_interval_sec
        self._max_queue_size = max_queue_size
        # deque mit popleft = O(1); rechts an, links weg (FIFO).
        self._queue: deque[dict[str, Any]] = deque()
        self._wake = asyncio.Event()
        self._stopping = asyncio.Event()
        self._task: asyncio.Task[None] | None = None
        self.dropped_count = 0

    def qsize(self) -> int:
        return len(self._queue)

    def enqueue(self, hass: HomeAssistant, td: KnxTelegramData) -> None:
        """Drop-In fuer ``_record_bus_activity``: synchron, nicht-blockierend.

        Liest den Bus-Analyse-Toggle aus ``hass.data``; bei OFF wird der
        ganze Pfad uebersprungen. Bei voller Queue greift der DoS-Schutz.
        """
        domain_data = hass.data.get(DOMAIN, {})
        if not domain_data.get(HASS_KEY_KNX_BUS_ANALYSIS, True):
            return
        if not td.destination:
            return
        if len(self._queue) >= self._max_queue_size:
            # DoS-Schutz: aeltesten Eintrag verwerfen, neuen aufnehmen.
            with contextlib.suppress(IndexError):
                self._queue.popleft()
            self.dropped_count += 1
        now = datetime.now(UTC)
        self._queue.append(
            {
                "timestamp": now.isoformat(timespec="seconds"),
                "hour_bucket": now.strftime("%Y-%m-%dT%H:00:00"),
                "destination": td.destination,
                "source": td.source or "",
                "telegramtype": td.telegramtype,
                "value": td.best_value(),
                "repeated": td.repeated,
            }
        )
        self._wake.set()

    async def start(self) -> None:
        if self._task is not None:
            return
        self._stopping.clear()
        self._task = asyncio.create_task(self._run(), name="messagehub-knx-ingest")

    async def stop(self) -> None:
        if self._task is None:
            return
        self._stopping.set()
        self._wake.set()
        with contextlib.suppress(asyncio.CancelledError):
            await self._task
        # Final flush — pending Telegramme nach Shutdown nicht verlieren.
        await self._flush_once()
        self._task = None

    async def _run(self) -> None:
        while not self._stopping.is_set():
            try:
                # Wartet auf Wake-Signal ODER flush_interval.
                with contextlib.suppress(TimeoutError):
                    await asyncio.wait_for(self._wake.wait(), timeout=self._flush_interval)
                self._wake.clear()
                await self._flush_once()
            except asyncio.CancelledError:
                break
            except (RuntimeError, ValueError, TypeError, KeyError) as err:
                _LOGGER.debug("knx ingest worker tick failed: %s", err)

    async def _flush_once(self) -> None:
        if not self._queue:
            return
        # Bis zu max_batch_size Eintraege auf einmal flushen.
        batch: list[dict[str, Any]] = []
        while self._queue and len(batch) < self._max_batch_size:
            batch.append(self._queue.popleft())
        try:
            await self._repo.insert_raw_batch(batch)
            await self._repo.increment_counter_batch(
                [(row["destination"], row["hour_bucket"]) for row in batch]
            )
        except (RuntimeError, ValueError, TypeError, KeyError) as err:
            # Hot-Path-sicher: Exceptions hier brechen den Listener nicht ab.
            _LOGGER.debug("knx ingest flush skipped: %s", err)


async def _record_bus_activity(
    hass: HomeAssistant, counters_repo: Any, td: KnxTelegramData
) -> None:
    """Backward-Compat-Pfad fuer Tests, die direkt ``_record_bus_activity``
    aufrufen. Neuer Hot-Path geht ueber ``KnxIngestWorker`` (Iter A1).

    Verhalten ist identisch zur alten Single-Insert-Variante — wird
    NICHT mehr aus dem Listener gerufen, ist aber als API-Vertrag fuer
    bestehende Snapshot-Tests erhalten.
    """
    domain_data = hass.data.get(DOMAIN, {})
    if not domain_data.get(HASS_KEY_KNX_BUS_ANALYSIS, True):
        return
    now = datetime.now(UTC)
    timestamp = now.isoformat(timespec="seconds")
    hour_bucket = now.strftime("%Y-%m-%dT%H:00:00")
    try:
        await counters_repo.insert_raw(
            timestamp=timestamp,
            destination=td.destination,
            source=td.source,
            telegramtype=td.telegramtype,
            value=td.best_value(),
            repeated=td.repeated,
        )
        await counters_repo.increment_counter(td.destination, hour_bucket)
    except (ValueError, RuntimeError) as err:
        _LOGGER.debug("knx bus activity record skipped: %s", err)


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


def _make_ingest_callback(
    hass: HomeAssistant,
    cache: Any,
    repository: Any,
    worker: KnxIngestWorker,
) -> Any:
    """Liefert die `_ingest`-Coroutine, die fuer beide Quellen (xknx-Hook
    und knx_event-Fallback) identisch ist.

    Iter A1: synchrone Worker-Enqueue im Hot-Path; Whitelist-Insert
    laeuft weiter ueber das Message-Repository.
    """
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
                "knx telegram ga=%s type=%s value=%s",
                td.destination,
                td.telegramtype,
                td.value,
            )
        if not td.destination:
            return
        worker.enqueue(hass, td)
        cfg = await cache.get(td.destination)
        if cfg is None:
            _LOGGER.debug("knx %s: GA nicht in messagehub-Whitelist", td.destination)
            return
        if not cfg.log_enabled:
            _LOGGER.debug("knx %s: log_enabled=0, skip messages-insert", td.destination)
            return
        msg = _build_knx_message(cfg, td)
        await repository.insert_or_aggregate(msg, window_minutes=10)
        fire_message_added(hass, msg)
        _LOGGER.info("messagehub knx-bus: %s -> %s [%s]", td.destination, msg.text, msg.severity)

    return _ingest


def _try_register_xknx_hook(
    hass: HomeAssistant,
    xknx: Any,
    ingest: Any,
    worker: KnxIngestWorker,
) -> Any | None:
    """Versucht den primaeren xknx-Telegram-Hook zu registrieren.

    Liefert die Unsubscribe-Closure bei Erfolg, sonst None — Aufrufer
    faellt dann auf den knx_event-Bus zurueck.
    """
    try:
        queue = getattr(xknx, "telegram_queue", None) or getattr(xknx, "telegrams", None)
        if queue is None or not hasattr(queue, "register_telegram_received_cb"):
            return None
    except (AttributeError, TypeError) as err:
        _LOGGER.warning(
            "messagehub: xknx-Hook nicht verfuegbar (%s) — falle auf knx_event-Bus zurueck",
            err,
        )
        return None

    async def _handle_telegram(telegram: Any) -> None:
        try:
            await ingest(KnxTelegramData.from_telegram(telegram))
        except (ValueError, TypeError, KeyError) as err:
            _LOGGER.debug("knx telegram ingest skipped: %s", err)

    def _on_telegram(telegram: Any) -> None:
        # xknx ruft sync auf — wir delegieren in eine HA-Task, damit
        # die Ingest-Coroutine im Eventloop landet.
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
        hass.async_create_task(worker.stop())

    return _unsub_xknx


async def _report_knx_repair_if_user_wants_it(
    hass: HomeAssistant, knx_repo: KnxAddressRepository
) -> None:
    """Iter F2: Repair-Issue ``knx_unavailable`` nur, wenn der User KNX
    aktiv nutzt (mind. 1 GA mit ``log_enabled=1``). Sonst spammt das
    Issue-Center bei Installationen ohne KNX.
    """
    try:
        logged = await knx_repo.list_logged()
    except (RuntimeError, ValueError) as err:
        _LOGGER.debug("repair-issue check skipped: %s", err)
        return
    if not logged:
        # Kein User-Wunsch nach KNX — keine Issue.
        _LOGGER.debug("repair-issue skipped: keine GAs mit log_enabled=1")
        return
    report_knx_unavailable(hass)


def _register_knx_event_fallback(
    hass: HomeAssistant,
    ingest: Any,
    worker: KnxIngestWorker,
    knx_repo: KnxAddressRepository,
) -> Any:
    """Fallback-Listener auf den HA-Eventbus 'knx_event'.

    Iter F2: Das Repair-Issue ``knx_unavailable`` wird nur ausgeloest,
    wenn der User mindestens eine GA mit ``log_enabled=1`` konfiguriert
    hat — sonst spammt das Issue-Center bei Installationen, die KNX gar
    nicht nutzen.
    """
    _LOGGER.warning(
        "messagehub: kein xknx-Hook moeglich — falle auf knx_event-Bus zurueck. "
        "Damit Telegramme ankommen, in configuration.yaml 'knx: event: <ga-liste>' eintragen."
    )
    hass.async_create_task(_report_knx_repair_if_user_wants_it(hass, knx_repo))

    async def _on_knx_event(event: Any) -> None:
        try:
            await ingest(KnxTelegramData.from_event_data(dict(event.data)))
        except (ValueError, TypeError, KeyError) as err:
            _LOGGER.debug("knx_event ingest skipped: %s", err)

    bus_unsub = hass.bus.async_listen("knx_event", _on_knx_event)

    def _unsub_event() -> None:
        bus_unsub()
        hass.async_create_task(worker.stop())

    return _unsub_event


def async_register_knx_listener(hass: HomeAssistant, database: Any, repository: Any) -> Any:
    """Registriert den KNX-Listener — primaer xknx-Hook, Fallback knx_event.

    Iter A1: Bus-weite Erfassung laeuft ueber ``KnxIngestWorker``
    (Worker-Queue + Batch-Flush). Der Worker startet hier und wird in
    der zurueckgegebenen Unsubscribe-Closure gestoppt.
    """
    cache, _counters_repo, worker = _build_listener_state(hass, database)
    hass.async_create_task(worker.start())
    ingest = _make_ingest_callback(hass, cache, repository, worker)
    knx_repo = KnxAddressRepository(database)

    xknx = _get_xknx_instance(hass)
    if xknx is not None:
        unsub = _try_register_xknx_hook(hass, xknx, ingest, worker)
        if unsub is not None:
            return unsub
    return _register_knx_event_fallback(hass, ingest, worker, knx_repo)
