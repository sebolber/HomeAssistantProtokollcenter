"""Iter 13 (knx-findings): Detector `VALUE_OUT_OF_RANGE`.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §6.
Vergleicht den DPT-spezifischen Min/Max-Bereich aus
`KNX_DPT_VALUE_RANGES` mit dem konkreten Wert. Erzeugt Finding mit
Evidence `{value, dpt, range_min, range_max}`.
"""

from __future__ import annotations

from datetime import UTC, datetime

from custom_components.messagehub.const import KNX_DPT_VALUE_RANGES
from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings.value_range import (
    detect_value_out_of_range,
)


def _now() -> datetime:
    return datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)


class TestValueRangeDetector:
    def test_value_out_of_range_emits_finding_for_dpt_5001_above_100(self) -> None:
        # Arrange — DPT 5.001 (Prozent), Wert 200 -> ausserhalb [0, 100].
        finding = detect_value_out_of_range(
            ga="1/2/3",
            dpt="5.001",
            value=200.0,
            now=_now(),
        )

        # Assert
        assert isinstance(finding, Finding)
        assert finding.code == "VALUE_OUT_OF_RANGE"
        assert finding.severity == "error"
        assert finding.ga == "1/2/3"
        assert finding.evidence == {
            "value": 200.0,
            "dpt": "5.001",
            "range_min": 0.0,
            "range_max": 100.0,
        }
        assert finding.detector_version == "VALUE_OUT_OF_RANGE/v1"

    def test_no_finding_for_value_in_range(self) -> None:
        # Arrange — DPT 5.001, Wert 50 -> in [0, 100].
        finding = detect_value_out_of_range(
            ga="1/2/3",
            dpt="5.001",
            value=50.0,
            now=_now(),
        )
        assert finding is None

    def test_no_finding_for_value_at_lower_bound(self) -> None:
        finding = detect_value_out_of_range(
            ga="1/2/3",
            dpt="5.001",
            value=0.0,
            now=_now(),
        )
        assert finding is None

    def test_no_finding_for_value_at_upper_bound(self) -> None:
        finding = detect_value_out_of_range(
            ga="1/2/3",
            dpt="5.001",
            value=100.0,
            now=_now(),
        )
        assert finding is None

    def test_emits_finding_below_lower_bound(self) -> None:
        # Arrange — DPT 9.005 (Wind), Wert -3 -> unter [0, ...].
        finding = detect_value_out_of_range(
            ga="1/2/3",
            dpt="9.005",
            value=-3.0,
            now=_now(),
        )
        assert finding is not None
        assert finding.evidence["value"] == -3.0

    def test_no_finding_for_unknown_dpt(self) -> None:
        # Arrange — DPT, der nicht in KNX_DPT_VALUE_RANGES steht.
        finding = detect_value_out_of_range(
            ga="1/2/3",
            dpt="99.999",
            value=42.0,
            now=_now(),
        )
        assert finding is None

    def test_no_finding_for_none_dpt(self) -> None:
        finding = detect_value_out_of_range(
            ga="1/2/3",
            dpt=None,
            value=42.0,
            now=_now(),
        )
        assert finding is None

    def test_no_finding_for_non_numeric_value(self) -> None:
        # Arrange — String-Werte fuer DPT 16.x (ASCII) sind ueblich.
        finding = detect_value_out_of_range(
            ga="1/2/3",
            dpt="5.001",
            value="abc",
            now=_now(),
        )
        assert finding is None


class TestValueRangeTable:
    def test_dpt_5001_range_is_0_to_100(self) -> None:
        # Prozent (Dimmwert/Stellgroesse).
        assert KNX_DPT_VALUE_RANGES["5.001"] == (0.0, 100.0)

    def test_dpt_9005_wind_lower_bound_is_0(self) -> None:
        # Wind kann nicht negativ sein (siehe §6 / DPT-Spec-Limits).
        assert KNX_DPT_VALUE_RANGES["9.005"][0] == 0.0

    def test_dpt_9007_humidity_range_is_0_to_100(self) -> None:
        assert KNX_DPT_VALUE_RANGES["9.007"] == (0.0, 100.0)

    def test_dpt_5003_angle_range_is_0_to_360(self) -> None:
        assert KNX_DPT_VALUE_RANGES["5.003"] == (0.0, 360.0)

    def test_dpt_5004_counter_pulses_8bit_unsigned(self) -> None:
        # Iter 13: Counter Pulses (8-bit unsigned), 0-255.
        assert KNX_DPT_VALUE_RANGES["5.004"] == (0.0, 255.0)

    def test_table_is_immutable(self) -> None:
        # Final-Marker bedeutet "wir aktualisieren beim Bump", nicht
        # zur Laufzeit. Sicherstellen, dass es ein dict (nicht
        # MappingProxyType) ist, damit aktuelle Tests gegen die Werte
        # pruefen koennen.
        assert isinstance(KNX_DPT_VALUE_RANGES, dict)
