"""Tests fuer FieldMapper (JSONPath, Defaults, Severity-Map)."""

from __future__ import annotations

import pytest

from custom_components.messagehub.processing.field_mapping import (
    MAX_EXPRESSION_LENGTH,
    MAX_PAYLOAD_DEPTH,
    FieldMapper,
    _payload_depth,
)
from custom_components.messagehub.storage import Severity


def test_mapping_extracts_nested_field() -> None:
    mapper = FieldMapper(
        mapping={
            "severity": "$.lvl",
            "source": "$.app.name",
            "text": "$.message",
        },
        defaults={"severity": Severity.INFO, "source": "default"},
    )
    out = mapper.map_payload({"lvl": "ERROR", "app": {"name": "pihole"}, "message": "DNS down"})
    assert out["severity"] is Severity.ERROR
    assert out["source"] == "pihole"
    assert out["text"] == "DNS down"


def test_missing_path_uses_default() -> None:
    mapper = FieldMapper(
        mapping={"severity": "$.lvl"},
        defaults={"severity": Severity.WARNING, "source": "fallback"},
    )
    out = mapper.map_payload({"text": "noise"})
    assert out["severity"] is Severity.WARNING
    assert out["source"] == "fallback"


def test_plain_text_body_falls_back_correctly() -> None:
    mapper = FieldMapper(
        mapping={"text": "$.text"},
        defaults={"severity": Severity.INFO, "source": "raw"},
    )
    out = mapper.map_payload("just a string")
    assert out["text"] == "just a string"
    assert out["severity"] is Severity.INFO


def test_custom_severity_map_applied() -> None:
    mapper = FieldMapper(
        mapping={"severity": "$.code"},
        severity_map={"P1": "error", "P2": "warning"},
        defaults={"severity": Severity.INFO, "source": "x"},
    )
    out = mapper.map_payload({"code": "P1"})
    assert out["severity"] is Severity.ERROR


def test_unknown_severity_falls_back_to_info() -> None:
    mapper = FieldMapper(
        mapping={"severity": "$.x"},
        defaults={"severity": Severity.INFO, "source": "x"},
    )
    out = mapper.map_payload({"x": "unbekannt"})
    assert out["severity"] is Severity.INFO


@pytest.mark.parametrize(
    "raw",
    ["ERR", "P1", "fatal", "CRIT"],
)
def test_normalisation_handles_string_inputs(raw: object) -> None:
    mapper = FieldMapper(
        mapping={"severity": "$.s"},
        defaults={"severity": Severity.INFO, "source": "x"},
    )
    out = mapper.map_payload({"s": raw})
    assert out["severity"] is Severity.ERROR


# v0.10 (S4): Expression-Length und Payload-Depth-Limits


def test_expression_length_limit_rejected() -> None:
    """Pathologisch lange JSONPath-Expressions werden beim Compile abgelehnt."""
    too_long = "$." + ("a" * (MAX_EXPRESSION_LENGTH + 1))
    with pytest.raises(ValueError, match="too long"):
        FieldMapper(mapping={"text": too_long})


def test_expression_at_limit_accepted() -> None:
    """Expressions bis zum Limit werden akzeptiert (Boundary-Test)."""
    at_limit = "$." + "a" * (MAX_EXPRESSION_LENGTH - 2)
    assert len(at_limit) == MAX_EXPRESSION_LENGTH
    # Darf nicht crashen; Pfad existiert nicht im Payload, also Default
    mapper = FieldMapper(mapping={"text": at_limit}, defaults={"source": "x"})
    out = mapper.map_payload({"foo": "bar"})
    assert "text" in out


def test_expression_must_be_string() -> None:
    """Nicht-String-Expressions werfen sofort TypeError."""
    with pytest.raises(TypeError, match="must be a string"):
        FieldMapper(mapping={"text": 42})  # type: ignore[dict-item]


def test_payload_depth_flat() -> None:
    # Skalare = 0, einstufige Container = 1, jede weitere Schachtelung +1
    assert _payload_depth({"a": 1, "b": 2}) == 1
    assert _payload_depth([1, 2, 3]) == 1
    assert _payload_depth("plain") == 0
    assert _payload_depth(42) == 0
    assert _payload_depth({}) == 1
    assert _payload_depth([]) == 1


def test_payload_depth_nested() -> None:
    nested = {"a": {"b": {"c": {"d": 1}}}}
    assert _payload_depth(nested) == 4


def test_payload_depth_mixed_dict_list() -> None:
    mixed = {"items": [{"x": 1}, {"y": [2, 3]}]}
    # dict(1) -> list(2) -> dict(3) -> int(0)  → 3
    # dict(1) -> list(2) -> dict(3) -> list(4) -> int(0)  → 4
    assert _payload_depth(mixed) == 4


def test_too_deep_payload_replaced_by_placeholder() -> None:
    """Payloads tiefer als MAX_PAYLOAD_DEPTH bekommen einen Platzhalter,
    damit die jsonpath-Engine nicht quadratisch belastet wird."""
    deep: object = "leaf"
    for _ in range(MAX_PAYLOAD_DEPTH + 5):
        deep = {"n": deep}
    mapper = FieldMapper(
        mapping={"text": "$.n.n.n"},
        defaults={"severity": Severity.INFO, "source": "x"},
    )
    out = mapper.map_payload(deep)
    assert out["text"] == "<payload too deep>"
    assert out["severity"] is Severity.INFO


def test_within_depth_limit_processes_normally() -> None:
    """Payload an der Tiefen-Grenze wird normal verarbeitet."""
    payload: dict[str, object] = {"text": "ok"}
    mapper = FieldMapper(
        mapping={"text": "$.text"},
        defaults={"severity": Severity.INFO, "source": "x"},
    )
    out = mapper.map_payload(payload)
    assert out["text"] == "ok"
