"""Tests fuer MQTT, Eventbus, Syslog (Iter 37-39)."""

from __future__ import annotations

import pytest

from custom_components.messagehub.ingestion.eventbus import (
    map_state_changed_unavailable,
    map_system_log_event,
)
from custom_components.messagehub.ingestion.mqtt import (
    TopicMapping,
    resolve_source,
    topic_matches,
)
from custom_components.messagehub.ingestion.syslog import parse_rfc3164
from custom_components.messagehub.storage import Severity


@pytest.mark.parametrize(
    ("pattern", "topic", "ok"),
    [
        ("home/+/temp", "home/wohnzimmer/temp", True),
        ("home/+/temp", "home/wohnzimmer/lampe/temp", False),
        ("home/#", "home/wohnzimmer/temp", True),
        ("home/#", "garage/temp", False),
        ("a/b/c", "a/b/c", True),
        ("a/b/c", "a/b", False),
    ],
)
def test_topic_matches(pattern: str, topic: str, ok: bool) -> None:
    assert topic_matches(pattern, topic) is ok


def test_resolve_picks_first_enabled() -> None:
    mappings = [
        TopicMapping(topic_pattern="home/#", source="home", enabled=False),
        TopicMapping(topic_pattern="home/+/temp", source="temp"),
    ]
    res = resolve_source(mappings, "home/wz/temp")
    assert res is not None
    assert res.source == "temp"


def test_system_log_event_maps_levels() -> None:
    sev, src, _ = map_system_log_event({"level": "WARNING", "name": "Foo.Bar", "message": "x"})
    assert sev is Severity.WARNING
    assert src == "foo.bar"


def test_state_changed_unavailable_creates_error() -> None:
    out = map_state_changed_unavailable(
        {"entity_id": "sensor.x", "new_state": {"state": "unavailable"}}
    )
    assert out is not None
    sev, _, text = out
    assert sev is Severity.ERROR
    assert "sensor.x" in text


def test_state_changed_normal_returns_none() -> None:
    out = map_state_changed_unavailable({"entity_id": "sensor.x", "new_state": {"state": "on"}})
    assert out is None


def test_syslog_parses_severity_and_hostname() -> None:
    line = "<11>Oct 11 22:14:15 raspi sshd[1234]: Connection closed"
    m = parse_rfc3164(line)
    assert m.severity is Severity.ERROR  # 11 % 8 == 3 -> error
    assert m.hostname == "raspi"
    assert "sshd" in m.text


def test_syslog_disabled_pri_falls_back() -> None:
    m = parse_rfc3164("plain syslog message without priority")
    assert m.severity is Severity.INFO
    assert m.text == "plain syslog message without priority"
