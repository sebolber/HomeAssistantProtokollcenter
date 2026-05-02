"""Counter-Sensoren fuer messagehub.

Iteration 6: total, errors_24h, warnings_24h, last_message.
Aktualisierung bei Eventbus-Event messagehub_message_added.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Any

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.helpers.event import async_track_time_interval

from .const import DOMAIN, EVENT_MESSAGE_ADDED, EVENT_MESSAGE_DELETED, build_device_info

if TYPE_CHECKING:
    from collections.abc import Callable

    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import Event, HomeAssistant
    from homeassistant.helpers.entity_platform import AddEntitiesCallback

    from .storage import MessageRepository

_LOGGER = logging.getLogger(__name__)

REFRESH_INTERVAL = timedelta(minutes=5)
TEXT_PREVIEW_MAX = 255
TEXT_PREVIEW_TRUNCATE = 252


async def async_setup_entry(  # NOSONAR: HA-Plattform-Hook, Signatur durch HA-API vorgegeben
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Registriert die Counter-Sensoren."""
    state = hass.data[DOMAIN][entry.entry_id]
    repo: MessageRepository = state["repository"]

    state = hass.data[DOMAIN][entry.entry_id]
    db = state["database"]

    sensors = [
        TotalMessagesSensor(entry.entry_id, repo),
        ErrorsLast24hSensor(entry.entry_id, repo),
        WarningsLast24hSensor(entry.entry_id, repo),
        LastMessageSensor(entry.entry_id, repo),
        SourceHealthSensor(entry.entry_id, repo, db),
        # v0.8: Lovelace-Dashboard-Sensoren
        ErrorsTotalSensor(entry.entry_id, repo),
        WarningsTotalSensor(entry.entry_id, repo),
        InfoTotalSensor(entry.entry_id, repo),
        DebugTotalSensor(entry.entry_id, repo),
        MessagesLast1hSensor(entry.entry_id, repo),
        MessagesLast7dSensor(entry.entry_id, repo),
    ]
    async_add_entities(sensors, update_before_add=True)


REFRESH_DEBOUNCE_SECONDS = 0.5
"""Coalescing-Fenster fuer Sensor-Refresh.

Pro EVENT_MESSAGE_ADDED-Event will jeder der 11 Sensoren eigentlich neu
abfragen. Bei einem Burst (z. B. 100 Telegramme/Sek aus KNX) waere das
1100 SELECTs/Sek + 11 Frontend-WebSocket-Broadcasts pro Telegramm. Mit
500-ms-Debounce werden burstige Events zu hoechstens zwei Updates pro
Sekunde zusammengezogen — Augen-friendly und DB-friendly.
"""


class _BaseMessageSensor(SensorEntity):
    """Gemeinsame Basis: lauscht auf Event und triggert async_update.

    Refresh-Coalescing: pro Sensor-Instanz wird hoechstens alle
    REFRESH_DEBOUNCE_SECONDS einmal aktualisiert, auch wenn 100 Events
    in der Zwischenzeit feuern. Der naechste Event nach dem Fenster
    triggert dann einen frischen Refresh.
    """

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, entry_id: str, repo: MessageRepository, key: str) -> None:
        self._entry_id = entry_id
        self._repo = repo
        self._attr_unique_id = f"{DOMAIN}_{entry_id}_{key}"
        self._attr_device_info = build_device_info(entry_id)
        self._unsub_listeners: list[Callable[[], None]] = []
        self._refresh_pending = False
        self._refresh_handle: asyncio.TimerHandle | None = None

    async def async_added_to_hass(self) -> None:
        self._unsub_listeners.append(
            self.hass.bus.async_listen(EVENT_MESSAGE_ADDED, self._on_event)
        )
        self._unsub_listeners.append(
            self.hass.bus.async_listen(EVENT_MESSAGE_DELETED, self._on_event)
        )
        self._unsub_listeners.append(
            async_track_time_interval(self.hass, self._tick, REFRESH_INTERVAL)
        )

    async def async_will_remove_from_hass(self) -> None:
        for unsub in self._unsub_listeners:
            unsub()
        self._unsub_listeners.clear()
        if self._refresh_handle is not None:
            self._refresh_handle.cancel()
            self._refresh_handle = None

    async def _on_event(self, _event: Event | None = None) -> None:
        """Plant einen Refresh ein — coalesced ueber REFRESH_DEBOUNCE_SECONDS."""
        if self._refresh_pending:
            return
        self._refresh_pending = True
        loop = asyncio.get_event_loop()
        self._refresh_handle = loop.call_later(
            REFRESH_DEBOUNCE_SECONDS, lambda: asyncio.ensure_future(self._do_refresh())
        )

    async def _do_refresh(self) -> None:
        self._refresh_pending = False
        self._refresh_handle = None
        await self.async_update_ha_state(force_refresh=True)

    async def _tick(self, _now: datetime) -> None:
        # Sicherheits-Tick alle 5 Min — falls ein Event-Listener still
        # versagt, sind die Sensoren spaetestens dann wieder synchron.
        await self.async_update_ha_state(force_refresh=True)


class TotalMessagesSensor(_BaseMessageSensor):
    _attr_name = "Total messages"
    _attr_state_class = SensorStateClass.TOTAL
    _attr_native_unit_of_measurement = "msg"

    def __init__(self, entry_id: str, repo: MessageRepository) -> None:
        super().__init__(entry_id, repo, "total")
        self._attr_native_value: int | None = None

    async def async_update(self) -> None:
        self._attr_native_value = await self._repo.count_total()


class _SeverityWindowSensor(_BaseMessageSensor):
    severity: str = ""

    def __init__(self, entry_id: str, repo: MessageRepository, key: str) -> None:
        super().__init__(entry_id, repo, key)
        self._attr_state_class = SensorStateClass.MEASUREMENT
        self._attr_native_unit_of_measurement = "msg"
        self._attr_native_value: int | None = None

    async def async_update(self) -> None:
        cutoff = (datetime.now(UTC) - timedelta(hours=24)).isoformat(timespec="seconds")
        self._attr_native_value = await self._repo.count_by_severity_since(self.severity, cutoff)


class ErrorsLast24hSensor(_SeverityWindowSensor):
    severity = "error"
    _attr_name = "Errors last 24h"

    def __init__(self, entry_id: str, repo: MessageRepository) -> None:
        super().__init__(entry_id, repo, "errors_24h")


class WarningsLast24hSensor(_SeverityWindowSensor):
    severity = "warning"
    _attr_name = "Warnings last 24h"

    def __init__(self, entry_id: str, repo: MessageRepository) -> None:
        super().__init__(entry_id, repo, "warnings_24h")


class SourceHealthSensor(_BaseMessageSensor):
    """Iter 40 v0.3: Health-Score 0..100 fuer den schlechtesten Source plus
    Map aller Source-Scores in den Attributen (`source_scores`)."""

    _attr_name = "Worst source health"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = "%"

    def __init__(self, entry_id: str, repo: MessageRepository, database: Any) -> None:
        super().__init__(entry_id, repo, "source_health")
        self._db = database
        self._attr_native_value: int | None = 100
        self._attr_extra_state_attributes: dict[str, Any] = {"source_scores": {}}

    async def async_update(self) -> None:
        from .processing.health import compute_health_score  # noqa: PLC0415

        sources = await self._repo.distinct_sources()
        scores: dict[str, int] = {}
        worst = 100
        for src in sources:
            if src.startswith("messagehub."):
                continue
            score = await compute_health_score(self._db, src, window_minutes=60)
            scores[src] = score
            worst = min(worst, score)
        self._attr_native_value = worst if sources else 100
        self._attr_extra_state_attributes = {
            "source_scores": scores,
            "worst_source": min(scores, key=lambda k: scores[k]) if scores else None,
        }


class _SeverityTotalSensor(_BaseMessageSensor):
    """Gemeinsame Basis fuer all-time Severity-Counts (Lovelace-Dashboard)."""

    severity: str = ""

    def __init__(self, entry_id: str, repo: MessageRepository, key: str) -> None:
        super().__init__(entry_id, repo, key)
        self._attr_state_class = SensorStateClass.TOTAL
        self._attr_native_unit_of_measurement = "msg"
        self._attr_native_value: int | None = None

    async def async_update(self) -> None:
        self._attr_native_value = await self._repo.count_by_severity(self.severity)


class ErrorsTotalSensor(_SeverityTotalSensor):
    severity = "error"
    _attr_name = "Errors total"

    def __init__(self, entry_id: str, repo: MessageRepository) -> None:
        super().__init__(entry_id, repo, "errors_total")


class WarningsTotalSensor(_SeverityTotalSensor):
    severity = "warning"
    _attr_name = "Warnings total"

    def __init__(self, entry_id: str, repo: MessageRepository) -> None:
        super().__init__(entry_id, repo, "warnings_total")


class InfoTotalSensor(_SeverityTotalSensor):
    severity = "info"
    _attr_name = "Info total"

    def __init__(self, entry_id: str, repo: MessageRepository) -> None:
        super().__init__(entry_id, repo, "info_total")


class DebugTotalSensor(_SeverityTotalSensor):
    severity = "debug"
    _attr_name = "Debug total"

    def __init__(self, entry_id: str, repo: MessageRepository) -> None:
        super().__init__(entry_id, repo, "debug_total")


class _TimeWindowSensor(_BaseMessageSensor):
    """Gemeinsame Basis fuer Time-Window-Counts ueber alle Severities."""

    window: timedelta = timedelta(hours=1)

    def __init__(self, entry_id: str, repo: MessageRepository, key: str) -> None:
        super().__init__(entry_id, repo, key)
        self._attr_state_class = SensorStateClass.MEASUREMENT
        self._attr_native_unit_of_measurement = "msg"
        self._attr_native_value: int | None = None

    async def async_update(self) -> None:
        cutoff = (datetime.now(UTC) - self.window).isoformat(timespec="seconds")
        self._attr_native_value = await self._repo.count_since(cutoff)


class MessagesLast1hSensor(_TimeWindowSensor):
    window = timedelta(hours=1)
    _attr_name = "Messages last 1h"

    def __init__(self, entry_id: str, repo: MessageRepository) -> None:
        super().__init__(entry_id, repo, "messages_1h")


class MessagesLast7dSensor(_TimeWindowSensor):
    window = timedelta(days=7)
    _attr_name = "Messages last 7d"

    def __init__(self, entry_id: str, repo: MessageRepository) -> None:
        super().__init__(entry_id, repo, "messages_7d")


class LastMessageSensor(_BaseMessageSensor):
    """Zeigt den (gekuerzten) Text der juengsten Nachricht; Attribute = volles Objekt."""

    _attr_name = "Last message"

    def __init__(self, entry_id: str, repo: MessageRepository) -> None:
        super().__init__(entry_id, repo, "last_message")
        self._attr_native_value: str | None = None
        self._attr_extra_state_attributes: dict[str, Any] = {}

    async def async_update(self) -> None:
        recent = await self._repo.list_recent(limit=1)
        if not recent:
            self._attr_native_value = None
            self._attr_extra_state_attributes = {}
            return
        msg = recent[0]
        truncated = (
            msg.text
            if len(msg.text) <= TEXT_PREVIEW_MAX
            else msg.text[:TEXT_PREVIEW_TRUNCATE] + "..."
        )
        self._attr_native_value = truncated
        self._attr_extra_state_attributes = {
            "id": msg.id,
            "severity": msg.severity.value,
            "source": msg.source,
            "text": msg.text,
            "metadata": msg.metadata,
            "timestamp": msg.timestamp_iso,
            "webhook_id": msg.webhook_id,
        }
