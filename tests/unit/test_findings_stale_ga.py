"""Iter 25 (knx-findings): Detector `STALE_GA`.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.3.
Erkennt: GA war frueher aktiv, ist seit X Tagen tot. Im Gegensatz zu
ORPHAN_GA hatte sie schon mal Telegramme gesehen — sie hat nur
aufgehoert zu senden.

Severity: info (siehe §9.3 — Beobachtungs-Hinweis, kein Bug).
Evidence: `{last_seen, days_silent}`.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings.stale_ga import (
    STALE_GA_DEFAULT_THRESHOLD_DAYS,
    detect_stale_ga,
)


def _ts(days_ago: float, now: datetime) -> datetime:
    return now - timedelta(days=days_ago)


class TestStaleGaDetector:
    def test_stale_ga_emits_finding_when_last_seen_older_than_threshold(
        self,
    ) -> None:
        # Arrange — last_seen 60 Tage her, default Schwelle 30 Tage.
        now = datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
        last_seen = _ts(60.0, now)

        # Act
        finding = detect_stale_ga(
            ga="1/2/3",
            last_seen=last_seen,
            now=now,
        )

        # Assert
        assert isinstance(finding, Finding)
        assert finding.code == "STALE_GA"
        assert finding.severity == "info"
        assert finding.ga == "1/2/3"
        assert finding.evidence["last_seen"] == last_seen.isoformat()
        assert finding.evidence["days_silent"] == 60

    def test_no_finding_when_recent(self) -> None:
        # Arrange — last_seen vor 5 Tagen (unter Schwelle).
        now = datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
        finding = detect_stale_ga(
            ga="1/2/3",
            last_seen=_ts(5.0, now),
            now=now,
        )
        assert finding is None

    def test_no_finding_when_last_seen_is_none(self) -> None:
        # Arrange — keine Vorgeschichte (das ist ORPHAN_GA-Fall).
        finding = detect_stale_ga(
            ga="1/2/3",
            last_seen=None,
            now=datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC),
        )
        assert finding is None

    def test_finding_at_exact_threshold_inclusive(self) -> None:
        # Arrange — exakt an der Schwelle -> Finding.
        now = datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
        finding = detect_stale_ga(
            ga="1/2/3",
            last_seen=_ts(STALE_GA_DEFAULT_THRESHOLD_DAYS, now),
            now=now,
        )
        assert finding is not None

    def test_threshold_can_be_overridden(self) -> None:
        # Arrange — User-spezifischer Schwellwert.
        now = datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
        finding = detect_stale_ga(
            ga="1/2/3",
            last_seen=_ts(7.0, now),
            now=now,
            threshold_days=5,
        )
        assert finding is not None
        assert finding.evidence["days_silent"] == 7

    def test_default_threshold_is_30_days(self) -> None:
        assert STALE_GA_DEFAULT_THRESHOLD_DAYS == 30

    def test_evidence_days_silent_is_int(self) -> None:
        # Arrange — fractional days werden gerundet, damit die UI keine
        # 32.4-Tage-Anzeigen rendern muss.
        now = datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
        finding = detect_stale_ga(
            ga="1/2/3",
            last_seen=_ts(32.4, now),
            now=now,
        )
        assert finding is not None
        assert isinstance(finding.evidence["days_silent"], int)
        assert finding.evidence["days_silent"] == 32
