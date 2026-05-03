"""Iter 24 (knx-findings): Detector `ORPHAN_GA`.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.3.
Erkennt: GA aus der Whitelist (`knx_group_addresses`), die im Auswerte-
zeitraum kein einziges Telegramm gesehen hat — *im Projekt, aber stumm*.

Severity: info (siehe §9.3 — Aufraeum-Hinweis, kein Bug).
Evidence: `{period_from, period_to}`.
"""

from __future__ import annotations

from datetime import UTC, datetime

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings.orphan_ga import (
    detect_orphan_ga,
)


def _now() -> datetime:
    return datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)


class TestOrphanGaDetector:
    def test_orphan_ga_emits_finding_for_silent_whitelist_entry(self) -> None:
        # Arrange — GA in der Whitelist, aber Telegramm-Count = 0.
        finding = detect_orphan_ga(
            ga="1/2/3",
            telegram_count=0,
            period_from="2026-04-26T00:00:00+00:00",
            period_to="2026-05-03T00:00:00+00:00",
            now=_now(),
        )

        # Assert
        assert isinstance(finding, Finding)
        assert finding.code == "ORPHAN_GA"
        assert finding.severity == "info"
        assert finding.ga == "1/2/3"
        assert finding.evidence["period_from"] == "2026-04-26T00:00:00+00:00"
        assert finding.evidence["period_to"] == "2026-05-03T00:00:00+00:00"

    def test_no_finding_when_telegrams_observed(self) -> None:
        finding = detect_orphan_ga(
            ga="1/2/3",
            telegram_count=42,
            period_from="2026-04-26T00:00:00+00:00",
            period_to="2026-05-03T00:00:00+00:00",
            now=_now(),
        )
        assert finding is None

    def test_no_finding_when_one_telegram_observed(self) -> None:
        # Arrange — auch ein einzelnes Telegramm reicht, dann ist die GA
        # NICHT mehr "stumm".
        finding = detect_orphan_ga(
            ga="1/2/3",
            telegram_count=1,
            period_from="2026-04-26T00:00:00+00:00",
            period_to="2026-05-03T00:00:00+00:00",
            now=_now(),
        )
        assert finding is None

    def test_negative_count_treated_as_no_data(self) -> None:
        # Arrange — Defensive: Negative Counts sollten nicht in einen
        # Finding muenden, sondern als "unklar" zaehlen.
        finding = detect_orphan_ga(
            ga="1/2/3",
            telegram_count=-1,
            period_from="2026-04-26T00:00:00+00:00",
            period_to="2026-05-03T00:00:00+00:00",
            now=_now(),
        )
        assert finding is None
