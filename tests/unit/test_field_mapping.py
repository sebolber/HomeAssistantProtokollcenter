"""Tests fuer FieldMapper (JSONPath, Defaults, Severity-Map)."""

from __future__ import annotations

import pytest

from custom_components.messagehub.processing.field_mapping import FieldMapper
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
