"""Iter 18 (knx-findings): Detector `MULTI_TIME_MASTER`.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.1 F14.
Erkennt: >=2 unterschiedliche `knx_source` schreiben auf eine Zeit-/
Datums-GA (DPT 10.001/11.001/19.001) — typisches Symptom fuer
versehentliche Doppel-Aktivierung des Time-Master-Modus auf zwei
Geraeten (Drift, Konflikt).

Severity: error (Doppel-Zeitquellen erzeugen Drift, siehe §9.3).
Evidence: `{sources, clock_dpt}`.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings.multi_time_master import (
    CLOCK_DPTS,
    detect_multi_time_master,
)
from custom_components.messagehub.processing.knx_stats import TelegramSample


def _ts(seconds: float) -> datetime:
    return datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC) + timedelta(seconds=seconds)


def _w(source: str, t: float) -> TelegramSample:
    return TelegramSample(
        ts=_ts(t),
        value="2026-05-03T08:00:00",
        telegramtype="GroupValueWrite",
        source=source,
    )


class TestMultiTimeMasterDetector:
    def test_multi_time_master_emits_finding_for_two_sources_on_clock_dpt(
        self,
    ) -> None:
        # Arrange — DPT 10.001 (Time-of-day), zwei Sources schreiben.
        samples = [_w("1.1.5", 0.0), _w("1.1.6", 60.0)]

        # Act
        finding = detect_multi_time_master(
            ga="0/0/2", dpt="10.001", samples=samples, now=_ts(60.0)
        )

        # Assert
        assert isinstance(finding, Finding)
        assert finding.code == "MULTI_TIME_MASTER"
        assert finding.severity == "error"
        assert finding.ga == "0/0/2"
        assert sorted(finding.evidence["sources"]) == ["1.1.5", "1.1.6"]
        assert finding.evidence["clock_dpt"] == "10.001"

    def test_no_finding_for_single_source(self) -> None:
        samples = [_w("1.1.5", t) for t in (0.0, 60.0, 120.0)]
        finding = detect_multi_time_master(
            ga="0/0/2", dpt="10.001", samples=samples, now=_ts(120.0)
        )
        assert finding is None

    def test_no_finding_for_non_clock_dpt(self) -> None:
        samples = [_w("1.1.5", 0.0), _w("1.1.6", 1.0)]
        finding = detect_multi_time_master(
            ga="1/2/3", dpt="9.001", samples=samples, now=_ts(1.0)
        )
        assert finding is None

    def test_finding_for_dpt_11001_date(self) -> None:
        # Arrange — DPT 11.001 = Datum.
        samples = [_w("1.1.5", 0.0), _w("1.1.6", 60.0)]
        finding = detect_multi_time_master(
            ga="0/0/1", dpt="11.001", samples=samples, now=_ts(60.0)
        )
        assert finding is not None
        assert finding.evidence["clock_dpt"] == "11.001"

    def test_finding_for_dpt_19001_datetime(self) -> None:
        # Arrange — DPT 19.001 = Datum+Uhrzeit kombiniert.
        samples = [_w("1.1.5", 0.0), _w("1.1.6", 60.0)]
        finding = detect_multi_time_master(
            ga="0/0/3", dpt="19.001", samples=samples, now=_ts(60.0)
        )
        assert finding is not None
        assert finding.evidence["clock_dpt"] == "19.001"

    def test_only_writes_count_not_reads(self) -> None:
        # Arrange — Reads von zwei Sources zaehlen NICHT.
        samples = [
            TelegramSample(
                ts=_ts(0.0), value=None,
                telegramtype="GroupValueRead", source="1.1.5",
            ),
            TelegramSample(
                ts=_ts(1.0), value=None,
                telegramtype="GroupValueRead", source="1.1.6",
            ),
        ]
        finding = detect_multi_time_master(
            ga="0/0/2", dpt="10.001", samples=samples, now=_ts(1.0)
        )
        assert finding is None

    def test_clock_dpts_constant(self) -> None:
        # Decision: DPT 10.001 (Time), 11.001 (Date), 19.001 (DateTime).
        assert frozenset({"10.001", "11.001", "19.001"}) == CLOCK_DPTS
