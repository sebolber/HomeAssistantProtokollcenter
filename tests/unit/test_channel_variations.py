"""Channel-Variations-Tests: Protokoll-Nachrichten ueber alle Eingangs-Kanaele.

Diese Tests pruefen, dass dieselbe Nachricht — egal woher sie kommt
(Webhook JSON, Webhook Plain-Text, Webhook mit JSONPath-Mapping,
MQTT-Topic-Mapping, HA-Eventbus-Adapter, Syslog-RFC-3164,
Service-Call) — am Ende konsistent als `Message`-Dataclass repraesentiert
und im Repository persistiert werden kann.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock

import pytest

from custom_components.messagehub.const import DOMAIN
from custom_components.messagehub.ingestion.eventbus import (
    map_state_changed_unavailable,
    map_system_log_event,
)
from custom_components.messagehub.ingestion.mqtt import TopicMapping, resolve_source
from custom_components.messagehub.ingestion.syslog import parse_rfc3164
from custom_components.messagehub.ingestion.webhook import async_handle_webhook
from custom_components.messagehub.processing.field_mapping import FieldMapper
from custom_components.messagehub.storage import (
    Database,
    Message,
    MessageRepository,
    MigrationRunner,
    Severity,
)


class _FakeRequest:
    def __init__(self, body: bytes) -> None:
        self._body = body
        self.content_length = len(body) if body else 0

    async def read(self) -> bytes:
        return self._body


def _fake_hass(repo: MessageRepository) -> Any:
    hass = MagicMock()
    hass.data = {DOMAIN: {"entry": {"repository": repo}}}
    hass.bus.async_fire = MagicMock()
    return hass


@pytest.fixture
async def repo(tmp_path: Path):  # type: ignore[no-untyped-def]
    db = Database(tmp_path / "m.db")
    await db.open()
    await MigrationRunner(db).run()
    try:
        yield MessageRepository(db)
    finally:
        await db.close()


# ─────────────────────────────────────────────────────────────────────────────
# WEBHOOK-VARIATIONEN
# ─────────────────────────────────────────────────────────────────────────────


class TestWebhookVariations:
    """Webhook akzeptiert verschiedene Payload-Formate konsistent."""

    @pytest.mark.asyncio
    async def test_pihole_style_json(self, repo: MessageRepository) -> None:
        """Pi-hole-aehnliches Payload mit nested `app.name` und `level`."""
        body = json.dumps(
            {
                "level": "ERR",
                "app": {"name": "pihole"},
                "message": "Upstream DNS unreachable",
                "ts": "2026-05-01T14:32:01Z",
                "extra": {"host": "raspi"},
            }
        ).encode()

        # Direkt ueber FieldMapper pruefen, da der Webhook-Handler
        # nur exakte Top-Level-Pfade nutzt.
        mapper = FieldMapper(
            mapping={
                "severity": "$.level",
                "source": "$.app.name",
                "text": "$.message",
                "metadata": "$.extra",
            },
            defaults={"severity": Severity.INFO, "source": "default"},
        )
        out = mapper.map_payload(json.loads(body))
        assert out["severity"] is Severity.ERROR
        assert out["source"] == "pihole"
        assert out["text"] == "Upstream DNS unreachable"
        assert out["metadata"] == {"host": "raspi"}

    @pytest.mark.asyncio
    async def test_grafana_alertmanager_style(self, repo: MessageRepository) -> None:
        """Grafana/Prometheus-Alertmanager-Payload mit Status `firing`/`resolved`."""
        mapper = FieldMapper(
            mapping={
                "severity": "$.alerts[0].labels.severity",
                "source": "$.alerts[0].labels.alertname",
                "text": "$.alerts[0].annotations.summary",
            },
            severity_map={"critical": "error", "page": "error"},
            defaults={"severity": Severity.WARNING, "source": "alertmanager"},
        )
        payload = {
            "alerts": [
                {
                    "labels": {"severity": "critical", "alertname": "high-cpu"},
                    "annotations": {"summary": "CPU > 95% for 5min"},
                    "status": "firing",
                }
            ]
        }
        out = mapper.map_payload(payload)
        assert out["severity"] is Severity.ERROR
        assert out["source"] == "high-cpu"
        assert "CPU" in out["text"]

    @pytest.mark.asyncio
    async def test_simple_curl_post(self, repo: MessageRepository) -> None:
        """Minimal: curl mit nur severity/source/text."""
        body = json.dumps({"severity": "warning", "source": "backup", "text": "delayed"}).encode()
        resp = await async_handle_webhook(_fake_hass(repo), "wh-1", _FakeRequest(body))
        assert resp.status == 204
        msgs = await repo.list_recent()
        assert msgs[0].severity is Severity.WARNING
        assert msgs[0].source == "backup"

    @pytest.mark.asyncio
    async def test_plain_text_body(self, repo: MessageRepository) -> None:
        """Sensor schickt nur `OK` als Plain-Text — wird zu `text=OK`."""
        resp = await async_handle_webhook(
            _fake_hass(repo), "wh-1", _FakeRequest(b"sensor reading OK")
        )
        assert resp.status == 204
        msgs = await repo.list_recent()
        assert msgs[0].text == "sensor reading OK"
        assert msgs[0].severity is Severity.INFO  # default

    @pytest.mark.asyncio
    async def test_unicode_text_german_umlauts(self, repo: MessageRepository) -> None:
        body = json.dumps(
            {
                "severity": "info",
                "source": "knx-bus",
                "text": "Wohnzimmer Deckenlicht ein/aus geschaltet — übergeordnet",
            },
            ensure_ascii=False,
        ).encode("utf-8")
        resp = await async_handle_webhook(_fake_hass(repo), "wh-1", _FakeRequest(body))
        assert resp.status == 204
        msgs = await repo.list_recent()
        assert "übergeordnet" in msgs[0].text

    @pytest.mark.asyncio
    async def test_emoji_in_text(self, repo: MessageRepository) -> None:
        body = json.dumps({"severity": "info", "source": "iot", "text": "🚨 alarm 🔥"}).encode()
        resp = await async_handle_webhook(_fake_hass(repo), "wh-1", _FakeRequest(body))
        assert resp.status == 204
        msgs = await repo.list_recent()
        assert "🚨" in msgs[0].text

    @pytest.mark.asyncio
    async def test_oversized_payload_rejected(self, repo: MessageRepository) -> None:
        big = b"x" * (64 * 1024 + 100)
        resp = await async_handle_webhook(_fake_hass(repo), "wh-1", _FakeRequest(big))
        assert resp.status == 413
        # Keine Persistierung erfolgt
        assert await repo.count_total() == 0

    @pytest.mark.asyncio
    async def test_invalid_severity_falls_back_to_info(self, repo: MessageRepository) -> None:
        body = json.dumps({"severity": "panic", "source": "x", "text": "weird"}).encode()
        resp = await async_handle_webhook(_fake_hass(repo), "wh-1", _FakeRequest(body))
        assert resp.status == 204
        msgs = await repo.list_recent()
        assert msgs[0].severity is Severity.INFO  # nicht abgewiesen, normalisiert

    @pytest.mark.asyncio
    async def test_uppercase_source_rejected_400(self, repo: MessageRepository) -> None:
        body = json.dumps({"severity": "info", "source": "PIHOLE", "text": "x"}).encode()
        resp = await async_handle_webhook(_fake_hass(repo), "wh-1", _FakeRequest(body))
        assert resp.status == 400


# ─────────────────────────────────────────────────────────────────────────────
# MQTT-VARIATIONEN
# ─────────────────────────────────────────────────────────────────────────────


class TestMqttVariations:
    """MQTT-Topic-Mappings mit verschiedenen Wildcards."""

    def test_zigbee2mqtt_style(self) -> None:
        """zigbee2mqtt nutzt /+/ fuer Geraete-IDs, # fuer Subtree."""
        mappings = [
            TopicMapping(topic_pattern="zigbee2mqtt/+/availability", source="zigbee.health"),
            TopicMapping(topic_pattern="zigbee2mqtt/#", source="zigbee.bridge"),
        ]
        # First match wins
        z_health = resolve_source(mappings, "zigbee2mqtt/sensor.lr/availability")
        assert z_health is not None
        assert z_health.source == "zigbee.health"
        assert resolve_source(mappings, "zigbee2mqtt/bridge/log").source == "zigbee.bridge"

    def test_homeassistant_state_topic(self) -> None:
        mappings = [TopicMapping(topic_pattern="homeassistant/+/+/state", source="ha.entity")]
        assert resolve_source(mappings, "homeassistant/sensor/temperature/state") is not None
        assert resolve_source(mappings, "homeassistant/sensor/state") is None  # zu wenig segments

    def test_disabled_mapping_is_skipped(self) -> None:
        mappings = [
            TopicMapping(topic_pattern="a/#", source="all", enabled=False),
            TopicMapping(topic_pattern="a/b", source="exact"),
        ]
        result = resolve_source(mappings, "a/b")
        assert result is not None
        assert result.source == "exact"

    def test_no_match_returns_none(self) -> None:
        mappings = [TopicMapping(topic_pattern="a/b", source="x")]
        assert resolve_source(mappings, "c/d") is None


# ─────────────────────────────────────────────────────────────────────────────
# EVENTBUS-VARIATIONEN
# ─────────────────────────────────────────────────────────────────────────────


class TestEventbusVariations:
    """HA-Eventbus-Payloads in Messages konvertieren."""

    def test_python_logging_warning(self) -> None:
        """`system_log_event` wie es HA's Logger feuert."""
        sev, src, text = map_system_log_event(
            {
                "level": "WARNING",
                "name": "homeassistant.components.zigbee2mqtt",
                "message": "Device offline",
                "exception": "",
            }
        )
        assert sev is Severity.WARNING
        assert "zigbee2mqtt" in src
        assert text == "Device offline"

    def test_critical_log_maps_to_error(self) -> None:
        sev, _, _ = map_system_log_event({"level": "CRITICAL", "name": "x", "message": "m"})
        assert sev is Severity.ERROR

    def test_state_changed_to_unavailable(self) -> None:
        out = map_state_changed_unavailable(
            {
                "entity_id": "binary_sensor.haustuer",
                "new_state": {"state": "unavailable", "attributes": {}},
                "old_state": {"state": "off"},
            }
        )
        assert out is not None
        sev, _src, text = out
        assert sev is Severity.ERROR
        assert "haustuer" in text

    def test_state_changed_to_unknown_also_creates_error(self) -> None:
        out = map_state_changed_unavailable(
            {"entity_id": "sensor.x", "new_state": {"state": "unknown"}}
        )
        assert out is not None
        assert out[0] is Severity.ERROR

    def test_normal_state_change_no_message(self) -> None:
        out = map_state_changed_unavailable(
            {"entity_id": "sensor.x", "new_state": {"state": "23.4"}}
        )
        assert out is None

    def test_state_changed_no_new_state(self) -> None:
        out = map_state_changed_unavailable({"entity_id": "sensor.x", "new_state": None})
        assert out is None


# ─────────────────────────────────────────────────────────────────────────────
# SYSLOG-VARIATIONEN
# ─────────────────────────────────────────────────────────────────────────────


class TestSyslogVariations:
    """Syslog-Lines verschiedener Geraete."""

    def test_linux_sshd_authentication_failure(self) -> None:
        line = "<38>Oct 11 22:14:15 raspi sshd[12345]: Failed password for invalid user admin"
        m = parse_rfc3164(line)
        # 38 % 8 == 6 -> info; <auth><info> bei pri=38 (auth=4*8=32 + info=6)
        assert m.severity is Severity.INFO
        assert m.hostname == "raspi"
        assert "sshd" in m.text

    def test_critical_kernel_message(self) -> None:
        line = "<2>Oct 11 22:14:15 raspi kernel: out of memory"
        m = parse_rfc3164(line)
        # 2 % 8 == 2 -> critical -> error
        assert m.severity is Severity.ERROR

    def test_warning_dnsmasq(self) -> None:
        # facility=3 (daemon), severity=4 (warning) -> pri = 3*8+4 = 28
        line = "<28>Oct 11 22:14:15 router dnsmasq[1]: high cache pressure"
        m = parse_rfc3164(line)
        assert m.severity is Severity.WARNING

    def test_no_priority_falls_back_to_info(self) -> None:
        m = parse_rfc3164("plain message no pri")
        assert m.severity is Severity.INFO
        assert m.hostname == "syslog"

    def test_only_priority_no_body(self) -> None:
        m = parse_rfc3164("<13>")
        # Sollte nicht crashen
        assert m is not None


# ─────────────────────────────────────────────────────────────────────────────
# END-TO-END KONSISTENZ
# ─────────────────────────────────────────────────────────────────────────────


class TestEndToEndConsistency:
    """Egal welcher Channel: dieselbe semantische Nachricht ergibt dasselbe Repository-Result."""

    @pytest.mark.asyncio
    async def test_same_message_via_three_channels(self, repo: MessageRepository) -> None:
        """`pihole`-Source mit Severity ERROR und gleichem Text aus 3 Quellen — alle landen
        konsistent in der DB mit korrekten Feldern."""
        # 1. Webhook (JSON)
        body = json.dumps({"severity": "error", "source": "pihole", "text": "DNS down"}).encode()
        await async_handle_webhook(_fake_hass(repo), "wh-pihole", _FakeRequest(body))

        # 2. Direkt via Service (= `add_message` -> Repository.insert)
        await repo.insert(Message(severity=Severity.ERROR, source="pihole", text="DNS down"))

        # 3. Syslog-aehnliche Quelle: Severity-Mapping aktiv
        sev, _, _ = map_system_log_event(
            {"level": "ERROR", "name": "pihole", "message": "DNS down"}
        )
        await repo.insert(Message(severity=sev, source="pihole", text="DNS down"))

        items = await repo.list_recent(limit=10)
        assert len(items) == 3
        for m in items:
            assert m.severity is Severity.ERROR
            assert m.source == "pihole"
            assert m.text == "DNS down"

    @pytest.mark.asyncio
    async def test_dedup_aggregates_across_channels(self, repo: MessageRepository) -> None:
        """Aggregator sieht 3 idente Nachrichten als 1 mit count=3."""
        for _ in range(3):
            msg = Message(severity=Severity.WARNING, source="x", text="signal lost")
            await repo.insert_or_aggregate(msg, window_minutes=10)

        items = await repo.list_recent(limit=10)
        assert len(items) == 1
        rows = await repo._db.fetch_all("SELECT count FROM messages")
        assert int(rows[0]["count"]) == 3

    @pytest.mark.asyncio
    async def test_mixed_severity_does_not_aggregate(self, repo: MessageRepository) -> None:
        """Verschiedene Severities -> verschiedene Fingerprints -> separate Rows."""
        await repo.insert_or_aggregate(Message(severity=Severity.WARNING, source="x", text="event"))
        await repo.insert_or_aggregate(Message(severity=Severity.ERROR, source="x", text="event"))
        items = await repo.list_recent(limit=10)
        assert len(items) == 2
