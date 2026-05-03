"""Iter 12 (knx-findings): Detector `DPT_MISMATCH`.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.2 + §9.3.
Vergleicht `dpt` (Soll) mit `dpt_inferred` (Ist) ab Confidence-Schwelle.
Erzeugt `Finding` mit Evidence
`{project_dpt, inferred_dpt, confidence, samples}`.
"""

from __future__ import annotations

from datetime import UTC, datetime

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings.dpt_mismatch import (
    DPT_MISMATCH_CONFIDENCE_THRESHOLD,
    detect_dpt_mismatch,
)


def _now() -> datetime:
    return datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)


class TestDptMismatchDetector:
    def test_dpt_mismatch_emits_finding_when_inferred_differs_above_threshold(
        self,
    ) -> None:
        # Arrange — Soll 9.001, Ist 1.001 mit Confidence > 0.85.
        finding = detect_dpt_mismatch(
            ga="1/2/3",
            project_dpt="9.001",
            inferred_dpt="1.001",
            confidence=0.94,
            samples=52,
            now=_now(),
        )

        # Assert
        assert isinstance(finding, Finding)
        assert finding.code == "DPT_MISMATCH"
        assert finding.severity == "error"
        assert finding.ga == "1/2/3"
        assert finding.evidence == {
            "project_dpt": "9.001",
            "inferred_dpt": "1.001",
            "confidence": 0.94,
            "samples": 52,
        }
        assert finding.first_seen == _now()
        assert finding.last_seen == _now()
        assert finding.detector_version == "DPT_MISMATCH/v1"

    def test_no_finding_when_inferred_matches_project(self) -> None:
        # Arrange — DPTs identisch -> kein Finding.
        finding = detect_dpt_mismatch(
            ga="1/2/3",
            project_dpt="9.001",
            inferred_dpt="9.001",
            confidence=0.95,
            samples=52,
            now=_now(),
        )

        # Assert
        assert finding is None

    def test_no_finding_when_confidence_below_threshold(self) -> None:
        # Arrange — Confidence unter Schwelle -> kein Finding.
        finding = detect_dpt_mismatch(
            ga="1/2/3",
            project_dpt="9.001",
            inferred_dpt="1.001",
            confidence=0.6,
            samples=52,
            now=_now(),
        )

        # Assert
        assert finding is None

    def test_no_finding_when_project_dpt_missing(self) -> None:
        # Arrange — kein Soll-DPT (z. B. GA aus Bus, nicht in Whitelist).
        finding = detect_dpt_mismatch(
            ga="1/2/3",
            project_dpt=None,
            inferred_dpt="1.001",
            confidence=0.95,
            samples=52,
            now=_now(),
        )

        # Assert
        assert finding is None

    def test_no_finding_when_inferred_is_generic_9x_match_for_specific_project_9_x(
        self,
    ) -> None:
        # Arrange — Auto-Erkenner liefert generisches "9.x" (siehe
        # `infer_dpt_from_samples`, knx_stats.py:104). Wenn das Projekt
        # einen konkreten 9.xxx-Subtyp angibt, ist das KEIN Mismatch —
        # der Auto-Erkenner kann den Subtyp ohne Sensor-Kontext nicht
        # erraten.
        finding = detect_dpt_mismatch(
            ga="1/2/3",
            project_dpt="9.001",
            inferred_dpt="9.x",
            confidence=0.95,
            samples=52,
            now=_now(),
        )

        # Assert
        assert finding is None

    def test_threshold_is_0_85_per_decision(self) -> None:
        # Soll: zwischen 0.85 und Schwelle ist die Grenze.
        # Decision: 0.85 statt 0.80 — siehe Commit-Body.
        assert DPT_MISMATCH_CONFIDENCE_THRESHOLD == 0.85

    def test_finding_at_exact_threshold_inclusive(self) -> None:
        # Arrange — Confidence = Schwelle -> Finding (>= threshold).
        finding = detect_dpt_mismatch(
            ga="1/2/3",
            project_dpt="9.001",
            inferred_dpt="1.001",
            confidence=DPT_MISMATCH_CONFIDENCE_THRESHOLD,
            samples=10,
            now=_now(),
        )

        # Assert
        assert finding is not None

    def test_finding_just_below_threshold_yields_none(self) -> None:
        # Arrange — knapp unter der Schwelle.
        finding = detect_dpt_mismatch(
            ga="1/2/3",
            project_dpt="9.001",
            inferred_dpt="1.001",
            confidence=DPT_MISMATCH_CONFIDENCE_THRESHOLD - 0.01,
            samples=10,
            now=_now(),
        )

        # Assert
        assert finding is None
