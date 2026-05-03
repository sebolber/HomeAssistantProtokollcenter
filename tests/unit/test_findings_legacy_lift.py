"""Iter 5 (knx-findings): Bestand auf neuen Vertrag heben.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.10:
- `HealthFinding` (knx_stats.py) -> Finding mit `code = "HEALTH_*"`
- Anti-Pattern-Findings (Finding mit kind="constant_value" etc.) ->
  Finding mit `code = "PATTERN_*"`
- evidence-Dict transportiert die strukturierten Detector-Outputs
  (z. B. {"busload_max_pct": 42.0, "threshold": 20.0})

Bestehende Tests in test_knx_stats_patterns.py / test_knx_health_score.py
bleiben gruen — die neuen Lift-Funktionen sind additiv.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from custom_components.messagehub.const import KNX_FINDING_DEFAULT_SEVERITIES
from custom_components.messagehub.processing.findings import (
    lift_health_findings,
    lift_pattern_findings,
)
from custom_components.messagehub.processing.knx_stats import (
    Finding as LegacyPatternFinding,
)
from custom_components.messagehub.processing.knx_stats import (
    HealthScoreInput,
    TelegramSample,
    detect_patterns,
)


def _ts(seconds: float) -> datetime:
    return datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC) + timedelta(seconds=seconds)


class TestHealthFindingLift:
    def test_health_finding_emits_code_health_busload(self) -> None:
        # Arrange — Buslast knapp ueber Schwelle (default 20.0).
        input_ = HealthScoreInput(
            repeat_ratio_pct=0.0,
            busload_max_pct=25.0,
            silent_devices=0,
            open_alarms=0,
        )
        now = _ts(0)

        # Act
        findings = lift_health_findings(input_, now=now)

        # Assert
        codes = [f.code for f in findings]
        assert "HEALTH_BUSLOAD" in codes
        busload = next(f for f in findings if f.code == "HEALTH_BUSLOAD")
        assert busload.severity == "warning"  # < critical
        assert busload.evidence["busload_max_pct"] == 25.0
        assert busload.first_seen == now
        assert busload.last_seen == now
        assert busload.detector_version.startswith("HEALTH_BUSLOAD/")

    def test_health_finding_emits_repeat_rate(self) -> None:
        # Arrange — Wiederhol-Quote ueber Schwelle (default 0.5%).
        input_ = HealthScoreInput(
            repeat_ratio_pct=2.0,
            busload_max_pct=0.0,
            silent_devices=0,
            open_alarms=0,
        )

        # Act
        findings = lift_health_findings(input_, now=_ts(0))

        # Assert
        codes = [f.code for f in findings]
        assert "HEALTH_REPEAT_RATE" in codes

    def test_health_finding_critical_above_threshold(self) -> None:
        # Arrange — Buslast oberhalb Critical-Schwelle (40 %).
        input_ = HealthScoreInput(
            repeat_ratio_pct=0.0,
            busload_max_pct=45.0,
            silent_devices=0,
            open_alarms=0,
        )

        # Act
        findings = lift_health_findings(input_, now=_ts(0))

        # Assert — critical -> "error"
        busload = next(f for f in findings if f.code == "HEALTH_BUSLOAD")
        assert busload.severity == "error"

    def test_health_finding_no_findings_when_inputs_clean(self) -> None:
        # Arrange — alle Werte unter Schwelle.
        input_ = HealthScoreInput(
            repeat_ratio_pct=0.0,
            busload_max_pct=0.0,
            silent_devices=0,
            open_alarms=0,
        )

        # Act
        findings = lift_health_findings(input_, now=_ts(0))

        # Assert
        assert findings == []

    def test_health_finding_has_no_ga_or_source(self) -> None:
        # HEALTH-Findings sind bus-weit, nicht GA-spezifisch.
        input_ = HealthScoreInput(
            repeat_ratio_pct=0.0,
            busload_max_pct=25.0,
            silent_devices=2,
            open_alarms=0,
        )
        findings = lift_health_findings(input_, now=_ts(0))
        for f in findings:
            assert f.ga is None
            assert f.source is None


class TestPatternFindingLift:
    def test_pattern_finding_emits_code_pattern_constant_value(self) -> None:
        # Arrange — 15 identische Werte aus 1.1.220 auf 1/2/3.
        samples = [
            TelegramSample(
                ts=_ts(i),
                value=0.0,
                telegramtype="GroupValueWrite",
                source="1.1.220",
            )
            for i in range(15)
        ]
        legacy = detect_patterns(samples, dpt="9.001")

        # Act
        lifted = lift_pattern_findings(
            legacy, ga="1/2/3", source="1.1.220", now=_ts(15)
        )

        # Assert
        codes = [f.code for f in lifted]
        assert "PATTERN_CONSTANT_VALUE" in codes
        cv = next(f for f in lifted if f.code == "PATTERN_CONSTANT_VALUE")
        assert cv.ga == "1/2/3"
        assert cv.source == "1.1.220"
        assert cv.severity in ("warning", "error", "info")
        assert cv.detector_version.startswith("PATTERN_CONSTANT_VALUE/")

    def test_pattern_finding_lifts_all_legacy_kinds(self) -> None:
        # Arrange — drei Kinds simulieren ueber LegacyPatternFinding direkt.
        legacy = [
            LegacyPatternFinding(kind="constant_value", severity="orange", text="x"),
            LegacyPatternFinding(kind="read_burst", severity="orange", text="y"),
            LegacyPatternFinding(kind="multiple_response", severity="orange", text="z"),
            LegacyPatternFinding(kind="heartbeat_spam", severity="yellow", text="h"),
        ]

        # Act
        lifted = lift_pattern_findings(legacy, ga="1/2/3", source="1.1.5", now=_ts(0))

        # Assert
        codes = {f.code for f in lifted}
        assert codes == {
            "PATTERN_CONSTANT_VALUE",
            "PATTERN_READ_BURST",
            "PATTERN_MULTIPLE_RESPONSE",
            "PATTERN_HEARTBEAT_SPAM",
        }

    def test_pattern_finding_severity_mapping_orange_to_warning(self) -> None:
        legacy = [LegacyPatternFinding(kind="constant_value", severity="orange", text="x")]
        lifted = lift_pattern_findings(legacy, ga="1/2/3", source="1.1.5", now=_ts(0))
        assert lifted[0].severity == "warning"

    def test_pattern_finding_severity_mapping_red_to_error(self) -> None:
        legacy = [LegacyPatternFinding(kind="constant_value", severity="red", text="x")]
        lifted = lift_pattern_findings(legacy, ga="1/2/3", source="1.1.5", now=_ts(0))
        assert lifted[0].severity == "error"


class TestLegacyContractDefaults:
    def test_legacy_health_codes_have_default_severities(self) -> None:
        # Alle HEALTH_*-Codes brauchen Defaults, sonst kracht der Resolver.
        for code in (
            "HEALTH_BUSLOAD",
            "HEALTH_REPEAT_RATE",
            "HEALTH_SILENCE",
            "HEALTH_ALARMS",
        ):
            assert code in KNX_FINDING_DEFAULT_SEVERITIES, f"missing default for {code}"

    def test_legacy_pattern_codes_have_default_severities(self) -> None:
        for code in (
            "PATTERN_CONSTANT_VALUE",
            "PATTERN_READ_BURST",
            "PATTERN_MULTIPLE_RESPONSE",
            "PATTERN_HEARTBEAT_SPAM",
        ):
            assert code in KNX_FINDING_DEFAULT_SEVERITIES, f"missing default for {code}"


class TestEvidencePayload:
    def test_health_finding_evidence_contains_inputs(self) -> None:
        input_ = HealthScoreInput(
            repeat_ratio_pct=0.0,
            busload_max_pct=25.0,
            silent_devices=2,
            open_alarms=0,
        )
        findings = lift_health_findings(input_, now=_ts(0))
        silence = next(f for f in findings if f.code == "HEALTH_SILENCE")
        assert silence.evidence["silent_devices"] == 2

    def test_pattern_finding_evidence_contains_text(self) -> None:
        # Legacy-Text bleibt als evidence["legacy_text"] erhalten — UI darf
        # ihn als Fallback rendern, bis die Translations stehen.
        legacy = [LegacyPatternFinding(kind="constant_value", severity="orange", text="abc")]
        lifted = lift_pattern_findings(legacy, ga="1/2/3", source="1.1.5", now=_ts(0))
        assert lifted[0].evidence.get("legacy_text") == "abc"


class TestExistingTestsStillWork:
    """Iter 5 darf existierende Tests nicht brechen — Stichprobe."""

    def test_existing_pattern_detector_still_returns_legacy_finding(self) -> None:
        samples = [
            TelegramSample(ts=_ts(i), value=0.0, telegramtype="GroupValueWrite", source="1.1.220")
            for i in range(15)
        ]
        legacy = detect_patterns(samples, dpt="9.001")
        kinds = {f.kind for f in legacy}
        assert "constant_value" in kinds
