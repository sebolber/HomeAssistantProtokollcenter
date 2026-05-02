"""MQTT-Topic-Subscriptions fuer messagehub."""

from __future__ import annotations

import contextlib
import logging
from typing import TYPE_CHECKING, Any

from ..helpers import fire_message_added
from ..ingestion.mqtt_repo import MqttTopicRepository
from ..storage import Message, Severity

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)


async def async_register_mqtt_subscriptions(
    hass: HomeAssistant, database: Any, repository: Any
) -> Any:
    """Registriert MQTT-Subscriptions fuer alle aktivierten topic_patterns."""
    if "mqtt" not in hass.config.components:
        _LOGGER.debug("mqtt not loaded — skipping MQTT subscriptions")
        return None

    # mqtt-Komponente wird nur geladen, wenn HA sie kennt — daher
    # bleibt der Import lazy guarded.
    try:
        from homeassistant.components import mqtt  # noqa: PLC0415
    except ImportError:
        return None

    repo = MqttTopicRepository(database)
    topics = await repo.list_all()
    unsubs: list[Any] = []

    for topic in topics:
        if not topic.enabled:
            continue
        sev = Severity.normalise(topic.severity)
        captured_topic = topic

        async def _handler(message: Any, _t: Any = captured_topic, _s: Any = sev) -> None:
            try:
                payload = (
                    message.payload.decode("utf-8", errors="replace")
                    if isinstance(message.payload, bytes | bytearray)
                    else str(message.payload)
                )
                msg = Message(
                    severity=_s,
                    source=_t.source,
                    text=f"[{message.topic}] {payload}"[:8000],
                    metadata={"mqtt_topic": message.topic},
                )
                await repository.insert_or_aggregate(msg, window_minutes=10)
                fire_message_added(hass, msg)
            except (ValueError, TypeError) as err:
                _LOGGER.debug("MQTT ingest skipped: %s", err)

        try:
            unsub = await mqtt.async_subscribe(hass, topic.topic_pattern, _handler)
            unsubs.append(unsub)
            _LOGGER.info("subscribed to MQTT %s -> %s", topic.topic_pattern, topic.source)
        except (ValueError, RuntimeError) as err:
            _LOGGER.warning("MQTT subscribe %s failed: %s", topic.topic_pattern, err)

    def _unsub_all() -> None:
        for u in unsubs:
            with contextlib.suppress(ValueError, RuntimeError):
                u()

    return _unsub_all
