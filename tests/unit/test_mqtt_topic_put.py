"""F-002: Statische Tests fuer den MQTT-Topic-PUT-Endpoint.

MqttTopicDetailView.put wurde in Iter 83 / CR-4 hinzugefuegt, weil das
Frontend ID-stabile Updates braucht. Dieser Test verifiziert:
- die Klasse existiert und exportiert PUT
- die URL hat einen {topic_id}-Path-Parameter
- der PUT-Handler nimmt topic_id als kwarg
- der Endpoint hat einen Admin-Check
- der Audit-Eintrag 'mqtt_topic_update' wird geloggt
"""

from __future__ import annotations

import ast
from pathlib import Path

_SRC = (
    Path(__file__).resolve().parents[2]
    / "custom_components"
    / "messagehub"
    / "api"
    / "messages.py"
)


def _find_class(class_name: str) -> ast.ClassDef:
    tree = ast.parse(_SRC.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == class_name:
            return node
    raise AssertionError(f"Klasse {class_name} nicht gefunden")


def test_mqtt_topic_detail_view_exists() -> None:
    cls = _find_class("MqttTopicDetailView")
    # url-Attribut
    url_value = next(
        stmt.value.value
        for stmt in cls.body
        if isinstance(stmt, ast.Assign)
        and len(stmt.targets) == 1
        and isinstance(stmt.targets[0], ast.Name)
        and stmt.targets[0].id == "url"
        and isinstance(stmt.value, ast.Constant)
    )
    assert url_value == "/api/messagehub/mqtt-topics/{topic_id}"


def test_mqtt_topic_put_handler_present() -> None:
    cls = _find_class("MqttTopicDetailView")
    methods = {
        sub.name for sub in cls.body if isinstance(sub, ast.AsyncFunctionDef)
    }
    assert "put" in methods, "PUT-Handler fuer MQTT-Topic-Edit fehlt"
    assert "delete" in methods, "DELETE-Handler darf durch Iter +1 nicht entfernt sein"


def test_mqtt_topic_put_takes_topic_id_kwarg() -> None:
    cls = _find_class("MqttTopicDetailView")
    put = next(
        sub
        for sub in cls.body
        if isinstance(sub, ast.AsyncFunctionDef) and sub.name == "put"
    )
    arg_names = {a.arg for a in put.args.args}
    assert "topic_id" in arg_names, "PUT-Handler muss topic_id als Parameter nehmen"


def test_mqtt_topic_put_has_admin_check() -> None:
    cls = _find_class("MqttTopicDetailView")
    put = next(
        sub
        for sub in cls.body
        if isinstance(sub, ast.AsyncFunctionDef) and sub.name == "put"
    )
    body_src = ast.unparse(put)
    assert "_check_admin" in body_src, "PUT-Handler muss Admin-Check haben"


def test_mqtt_topic_put_logs_audit() -> None:
    cls = _find_class("MqttTopicDetailView")
    put = next(
        sub
        for sub in cls.body
        if isinstance(sub, ast.AsyncFunctionDef) and sub.name == "put"
    )
    body_src = ast.unparse(put)
    assert "mqtt_topic_update" in body_src, (
        "PUT-Handler muss action='mqtt_topic_update' im Audit-Log schreiben"
    )


def test_mqtt_topic_put_validates_id_format() -> None:
    """ID-Validation gegen ValueError -> 400-Response."""
    cls = _find_class("MqttTopicDetailView")
    put = next(
        sub
        for sub in cls.body
        if isinstance(sub, ast.AsyncFunctionDef) and sub.name == "put"
    )
    body_src = ast.unparse(put)
    # int(topic_id) -> ValueError -> json_message(... 400)
    assert "int(topic_id)" in body_src
    assert "ERR_INVALID_ID" in body_src
