"""Iter 1 (knx-findings): Finding-Dataclass + Severity-Enum + JSON-Round-Trip.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.6.
Dataclass instantiierbar, JSON-Round-Trip stabil.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime

import pytest

from custom_components.messagehub.processing.findings import (
    Finding,
    FindingSeverity,
)


def _sample_finding() -> Finding:
    return Finding(
        code="DPT_MISMATCH",
        schema_version=1,
        severity="error",
        ga="1/2/3",
        source="1.1.5",
        title="Erkannter Datentyp widerspricht Projekt-DPT",
        description=(
            "DPT-Inferenz aus Werten ergibt 1.001, ETS-Projekt sagt 9.001. "
            "Wahrscheinlich falscher DPT im ETS-Projekt."
        ),
        evidence={
            "project_dpt": "9.001",
            "inferred_dpt": "1.001",
            "confidence": 0.94,
            "samples": 52,
        },
        first_seen=datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC),
        last_seen=datetime(2026, 5, 3, 8, 30, 0, tzinfo=UTC),
        occurrence_count=12,
        detector_version="DPT_MISMATCH/v1",
    )


class TestFindingSeverity:
    def test_severity_literal_accepts_all_four_levels(self) -> None:
        # Assert: alle dokumentierten Severity-Levels sind valide Strings.
        for level in ("debug", "info", "warning", "error"):
            sev: FindingSeverity = level  # type: ignore[assignment]
            assert sev == level


class TestFindingDataclass:
    def test_finding_is_frozen_and_slotted(self) -> None:
        finding = _sample_finding()
        # frozen → setattr loest FrozenInstanceError aus.
        with pytest.raises(Exception) as exc_info:
            finding.code = "OTHER"  # type: ignore[misc]
        assert "frozen" in repr(exc_info.value).lower() or (
            "cannot assign" in repr(exc_info.value).lower()
        )
        # slots → keine ad-hoc Attribute
        assert hasattr(Finding, "__slots__")

    def test_evidence_dict_is_passthrough(self) -> None:
        finding = _sample_finding()
        assert finding.evidence["project_dpt"] == "9.001"
        assert finding.evidence["confidence"] == 0.94


class TestFindingRoundTrip:
    def test_finding_dataclass_round_trip_serializes_to_json(self) -> None:
        # Arrange
        original = _sample_finding()

        # Act
        payload = original.to_json()
        restored = Finding.from_json(payload)

        # Assert
        assert restored == original
        # JSON ist deterministisch deserialisierbar — auch nach json.loads.
        as_dict = json.loads(payload)
        assert as_dict["code"] == "DPT_MISMATCH"
        assert as_dict["severity"] == "error"
        assert as_dict["evidence"]["confidence"] == 0.94
        assert as_dict["first_seen"] == "2026-05-03T08:00:00+00:00"
        assert as_dict["last_seen"] == "2026-05-03T08:30:00+00:00"

    def test_finding_round_trip_handles_optional_ga_and_source(self) -> None:
        # Arrange — globale Findings (kein GA, kein Source)
        original = Finding(
            code="MULTI_TIME_MASTER",
            schema_version=1,
            severity="error",
            ga=None,
            source=None,
            title="Mehrere Zeit-Master",
            description="Mehrere Quellen schreiben Zeit/Datum.",
            evidence={"sources": ["1.1.5", "1.1.6"], "clock_dpt": "10.001"},
            first_seen=datetime(2026, 5, 3, 0, 0, 0, tzinfo=UTC),
            last_seen=datetime(2026, 5, 3, 0, 0, 0, tzinfo=UTC),
            occurrence_count=1,
            detector_version="MULTI_TIME_MASTER/v1",
        )

        # Act
        restored = Finding.from_json(original.to_json())

        # Assert
        assert restored == original
        assert restored.ga is None
        assert restored.source is None

    def test_finding_to_dict_renders_iso_datetimes(self) -> None:
        # Arrange
        original = _sample_finding()

        # Act
        as_dict = original.to_dict()

        # Assert — Datetimes als ISO-Strings, nicht als datetime-Objekte.
        assert isinstance(as_dict["first_seen"], str)
        assert isinstance(as_dict["last_seen"], str)
        assert as_dict["first_seen"].endswith("+00:00")

    def test_finding_from_dict_accepts_iso_datetime_strings(self) -> None:
        # Arrange
        as_dict = {
            "code": "TOGGLE_LOOP",
            "schema_version": 1,
            "severity": "error",
            "ga": "1/0/1",
            "source": "1.1.7",
            "title": "Schleife",
            "description": "Toggling alle 1 s.",
            "evidence": {"period_ms": 1000, "cycles": 8},
            "first_seen": "2026-05-03T08:00:00+00:00",
            "last_seen": "2026-05-03T08:00:08+00:00",
            "occurrence_count": 8,
            "detector_version": "TOGGLE_LOOP/v1",
        }

        # Act
        finding = Finding.from_dict(as_dict)

        # Assert
        assert finding.first_seen == datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
        assert finding.last_seen == datetime(2026, 5, 3, 8, 0, 8, tzinfo=UTC)
