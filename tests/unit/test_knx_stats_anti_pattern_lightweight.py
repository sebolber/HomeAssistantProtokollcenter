"""Iter 63 / U13: Lightweight Anti-Pattern-Erkennung fuer Top-Sender-Badge.

Voller Detector (detect_patterns) ist im Detail-Pane verfuegbar. Hier:
binaere "hat etwas Auffaelliges?"-Flag, ohne ts/typ zu brauchen — die
liefert das Bulk-Lookup nicht. Reduzierte Heuristik:
Konstant-Wert-Spam (Var=0 ueber >= 5 Samples).
"""

from __future__ import annotations

from custom_components.messagehub.processing.knx_stats import (
    has_anti_pattern_in_samples,
)


def test_returns_false_for_empty() -> None:
    assert has_anti_pattern_in_samples([]) is False


def test_returns_false_for_single_value() -> None:
    assert has_anti_pattern_in_samples([42]) is False


def test_returns_false_below_min_samples() -> None:
    # 4 < 5 — nicht ausreichend Evidenz fuer Konstant-Wert-Spam.
    assert has_anti_pattern_in_samples([0, 0, 0, 0]) is False


def test_returns_true_for_5_identical_zero_values() -> None:
    # Klassischer Hörmann-Default-0-Spam: 5x DPT 9.001 == 0.
    assert has_anti_pattern_in_samples([0, 0, 0, 0, 0]) is True


def test_returns_true_for_many_identical_floats() -> None:
    assert has_anti_pattern_in_samples([21.5] * 10) is True


def test_returns_false_for_varying_values() -> None:
    assert has_anti_pattern_in_samples([21.5, 22.0, 22.5, 23.0, 23.5]) is False


def test_returns_true_for_only_zero_with_one_none_in_between() -> None:
    # None-Werte werden ignoriert; restliche identisch -> Konstant.
    assert has_anti_pattern_in_samples([0, None, 0, 0, 0, 0]) is True


def test_returns_false_when_one_value_differs() -> None:
    assert has_anti_pattern_in_samples([0, 0, 0, 0, 1]) is False


def test_returns_false_when_too_many_none() -> None:
    # Nach None-Filter < 5 Werte -> nicht ausreichend.
    assert has_anti_pattern_in_samples([0, None, None, None, None, 0]) is False
