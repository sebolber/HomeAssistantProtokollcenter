"""Unit-Tests fuer pure functions in api/_helpers.py.

Die Helpers sind ohne HA-Stack testbar — die meisten haengen nur an
einer Mapping- oder Dataclass-Instanz. Tests decken die Quick-Win-
Funktionen ab, damit das Modul nicht bei 31% Coverage haengen bleibt
und die Backend-Gesamt-Schwelle wieder mit Luft erreichbar ist.
"""

from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from typing import Any

import pytest

from custom_components.messagehub.api._helpers import (
    actor,
    get_audit_failure_count,
    msg_to_dict,
    parse_int_param,
    wh_to_dict,
)
from custom_components.messagehub.storage.models import (
    Message,
    Severity,
    WebhookConfig,
)


class TestMsgToDict:
    def test_serialisiert_alle_pflichtfelder(self) -> None:
        msg = Message(
            severity=Severity.ERROR,
            source="test.source",
            text="hello",
            timestamp=datetime(2026, 5, 13, 12, 0, 0, tzinfo=UTC),
            id=42,
            webhook_id="abc",
            metadata={"foo": "bar"},
        )
        result = msg_to_dict(msg)
        assert result == {
            "id": 42,
            "timestamp": "2026-05-13T12:00:00+00:00",
            "severity": "error",
            "source": "test.source",
            "text": "hello",
            "metadata": {"foo": "bar"},
            "webhook_id": "abc",
        }

    def test_serialisiert_none_metadata(self) -> None:
        msg = Message(
            severity=Severity.INFO,
            source="src",
            text="t",
            timestamp=datetime(2026, 1, 1, tzinfo=UTC),
            id=1,
        )
        result = msg_to_dict(msg)
        assert result["metadata"] is None
        assert result["webhook_id"] is None


class TestWhToDict:
    def test_serialisiert_alle_pflichtfelder(self) -> None:
        cfg = WebhookConfig(
            id=7,
            name="N",
            webhook_id="webhook_id_long_enough",
            default_source="src",
            default_severity=Severity.WARNING,
            field_map={"text": "$.body"},
            enabled=False,
            created_at=datetime(2026, 5, 13, 10, 0, 0, tzinfo=UTC),
        )
        result = wh_to_dict(cfg)
        assert result == {
            "id": 7,
            "name": "N",
            "webhook_id": "webhook_id_long_enough",
            "default_severity": "warning",
            "default_source": "src",
            "field_map": {"text": "$.body"},
            "enabled": False,
            "created_at": "2026-05-13T10:00:00+00:00",
        }

    def test_field_map_none_passthrough(self) -> None:
        cfg = WebhookConfig(
            name="X",
            webhook_id="abcdefghijklmnop",
            default_source="src",
        )
        result = wh_to_dict(cfg)
        assert result["field_map"] is None
        assert result["enabled"] is True


class TestParseIntParam:
    def test_default_wenn_param_nicht_gesetzt(self) -> None:
        assert parse_int_param({}, "limit", default=50) == 50

    def test_parsed_gueltigen_wert(self) -> None:
        assert parse_int_param({"limit": "123"}, "limit", default=50) == 123

    def test_clamp_unter_min(self) -> None:
        assert parse_int_param({"n": "-5"}, "n", default=10, min_value=0) == 0

    def test_clamp_ueber_max(self) -> None:
        assert (
            parse_int_param({"n": "9999"}, "n", default=10, min_value=0, max_value=100)
            == 100
        )

    def test_invalid_wert_fuehrt_zu_default(self) -> None:
        assert parse_int_param({"n": "abc"}, "n", default=42) == 42

    def test_none_wert_fuehrt_zu_default(self) -> None:
        # params kann None-Werte zurueckliefern (z. B. dict[str, None]).
        class _P:
            def get(self, _key: str) -> Any:
                return None

        assert parse_int_param(_P(), "n", default=7) == 7


class TestActor:
    def _request_with_user(self, user: Any) -> Any:
        # Minimaler request-Mock: nur .get("hass_user") wird genutzt.
        class _R:
            def get(self, key: str) -> Any:
                return user if key == "hass_user" else None

        return _R()

    def test_anonymous_wenn_user_none(self) -> None:
        assert actor(self._request_with_user(None)) == "anonymous"

    def test_username_bevorzugt(self) -> None:
        user = SimpleNamespace(name="alice", id="uid-1")
        assert actor(self._request_with_user(user)) == "alice"

    def test_fallback_auf_user_id_wenn_kein_name(self) -> None:
        user = SimpleNamespace(name=None, id="uid-42")
        assert actor(self._request_with_user(user)) == "uid-42"

    def test_unknown_wenn_weder_name_noch_id(self) -> None:
        user = SimpleNamespace(name=None)
        # getattr-Default "unknown" greift, wenn id-Attribut fehlt.
        assert actor(self._request_with_user(user)) == "unknown"


class TestGetAuditFailureCount:
    def test_liefert_int(self) -> None:
        # Funktion ist trivial — wichtig nur, dass sie einen int zurueckgibt
        # und Modul-State nicht crashed.
        assert isinstance(get_audit_failure_count(), int)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("1", 1),
        ("0", 0),
        ("100", 100),
    ],
)
def test_parse_int_param_parametrized(raw: str, expected: int) -> None:
    assert parse_int_param({"v": raw}, "v", default=999) == expected
