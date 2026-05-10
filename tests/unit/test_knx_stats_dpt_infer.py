"""Iter 62 / WR-T: DPT-Auto-Erkennung aus Werte-Samples.

Wenn das ETS-Projekt keinen DPT pflegt (Top-Sender im Live-Bus zeigen
oft DPT "—"), greift heute der `_default`-Fallback (5,0 Tel/Min) und
die Recommendation-Engine kann nichts spezifisches sagen. Mit
`infer_dpt_from_samples` raten wir den DPT konservativ aus den Werten:

- 1.001 (Schalten): alle Werte aus {0, 1, True, False}.
- 5.001 (Dimmwert/8-bit unsigned): alle Werte int in [0, 255].
- 9.x (2-byte Float, generisch): irgendein Wert ist nicht-integer Float.
- None: nicht entscheidbar (gemischt, leer, Strings, etc.).
"""

from __future__ import annotations

import pytest

from custom_components.messagehub.processing.knx_stats import infer_dpt_from_samples


def test_returns_none_for_empty_samples() -> None:
    assert infer_dpt_from_samples([]) is None


def test_returns_1_001_for_all_bool_zero_one() -> None:
    assert infer_dpt_from_samples([0, 1, 0, 0, 1]) == "1.001"
    assert infer_dpt_from_samples([True, False, True, False]) == "1.001"
    assert infer_dpt_from_samples([0, 1, True, False]) == "1.001"


def test_returns_5_001_for_all_int_0_to_255() -> None:
    assert infer_dpt_from_samples([42, 100, 200, 50]) == "5.001"
    assert infer_dpt_from_samples([0, 255, 128]) == "5.001"


def test_does_not_return_5_001_for_only_zero_one_even_if_in_range() -> None:
    # 0/1 sind im 5.001-Range, aber stark hinweisend auf 1.001 (Schalten).
    # Heuristik: nur 0/1 -> 1.001.
    assert infer_dpt_from_samples([0, 1, 1, 0]) == "1.001"


def test_returns_9_x_for_any_non_integer_float() -> None:
    assert infer_dpt_from_samples([21.5, 22.0, 22.3]) == "9.x"
    assert infer_dpt_from_samples([0.0, 100.5, 200]) == "9.x"
    assert infer_dpt_from_samples([-10.5, 5.0, 0.1]) == "9.x"


def test_returns_none_for_mixed_string_and_numeric() -> None:
    assert infer_dpt_from_samples([1, "scene_1", 2]) is None


def test_returns_none_for_all_strings() -> None:
    assert infer_dpt_from_samples(["on", "off"]) is None


def test_int_outside_byte_range_falls_through_to_none() -> None:
    # 16-bit Werte oder Counter > 255 sind nicht 5.001. Ohne weitere
    # Indizien: lieber kein DPT raten als falsch raten.
    assert infer_dpt_from_samples([0, 100, 1000, 50000]) is None


@pytest.mark.parametrize(
    "values, expected",
    [
        ([1, 0, 1, 0, 1, 0, 1], "1.001"),
        ([10, 20, 30, 40], "5.001"),
        ([19.4, 21.0, 22.5], "9.x"),
        ([], None),
        ([None], None),
    ],
)
def test_examples_from_docstring(values: list[object], expected: str | None) -> None:
    assert infer_dpt_from_samples(values) == expected
