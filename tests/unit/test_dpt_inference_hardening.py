"""Iter B2: DPT-Auto-Inferenz haerter machen + DPT_MISMATCH-Severity senken.

Konzept-Schwaeche B2: ``infer_dpt_from_samples`` lieferte 1.001, sobald
alle Werte in {0, 1} liegen — ein Stellantrieb mit DPT 5.001, der nur
0% und 100% sendet, wuerde faelschlich als 1.001 inferiert. Der
Detector ``DPT_MISMATCH`` mit ``severity=error`` produzierte damit
systematische False-Positives.

Loesungen in dieser Iter:
1. 1.001 nur, wenn KEIN Wert >= 2 vorkommt UND KEIN Wert 100 ist
   (typischer Stellantrieb-Indikator).
2. 5.001 nur, wenn mindestens ein Wert >= 2 vorkommt (sonst kann es
   genauso 1.001 sein).
3. ``DPT_MISMATCH`` Severity auf ``warning`` (vorher ``error``).
"""

from __future__ import annotations

from datetime import datetime

from custom_components.messagehub.const import KNX_FINDING_DEFAULT_SEVERITIES
from custom_components.messagehub.processing.findings.dpt_mismatch import (
    detect_dpt_mismatch,
)
from custom_components.messagehub.processing.knx_stats import infer_dpt_from_samples


class TestInferDptHardening:
    def test_only_0_and_1_yields_1_001(self) -> None:
        assert infer_dpt_from_samples([0, 1, 0, 1, 0]) == "1.001"

    def test_only_0_and_100_does_not_yield_1_001(self) -> None:
        """Stellantrieb-Pattern: nur 0% und 100% — *kein* 1.001-Schluss.

        Vorher: 100 nicht in {0,1}, also fliesst das in 5.001-Branche;
        aber wenn Wert == 100 mehrfach vorkommt, ist das mit hoher
        Wahrscheinlichkeit ein Stellantrieb mit DPT 5.001.
        """
        result = infer_dpt_from_samples([0, 100, 0, 100, 100])
        assert result == "5.001"

    def test_values_above_1_yield_5_001(self) -> None:
        assert infer_dpt_from_samples([0, 50, 100, 25, 75]) == "5.001"

    def test_only_zeros_returns_none(self) -> None:
        """Sample-Sequenz ausschliesslich 0 — nicht entscheidbar."""
        assert infer_dpt_from_samples([0, 0, 0, 0, 0]) is None

    def test_only_ones_returns_none(self) -> None:
        """Sample-Sequenz ausschliesslich 1 — nicht entscheidbar."""
        assert infer_dpt_from_samples([1, 1, 1, 1, 1]) is None

    def test_bool_values_yield_1_001(self) -> None:
        assert infer_dpt_from_samples([True, False, True, False]) == "1.001"

    def test_float_yields_9_x_unchanged(self) -> None:
        assert infer_dpt_from_samples([21.5, 22.0, 22.5]) == "9.x"

    def test_mixed_above_and_below_byte_max_returns_none(self) -> None:
        """Out-of-range: nicht-entscheidbar — kein Falsch-Mapping auf 5.x."""
        assert infer_dpt_from_samples([0, 100, 300]) is None


class TestDptMismatchSeverity:
    def test_default_severity_is_warning(self) -> None:
        """B2: vorher 'error', jetzt 'warning' (siehe Konzept B2)."""
        assert KNX_FINDING_DEFAULT_SEVERITIES["DPT_MISMATCH"] == "warning"

    def test_finding_emits_warning(self) -> None:
        finding = detect_dpt_mismatch(
            ga="1/2/3",
            project_dpt="9.001",
            inferred_dpt="1.001",
            confidence=0.95,
            samples=200,
            now=datetime(2026, 5, 8, 12, 0, 0),
        )
        assert finding is not None
        assert finding.severity == "warning"
