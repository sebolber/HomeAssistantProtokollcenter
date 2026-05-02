"""Iter 66 / WR-V: Multi-byte-ASCII-Decoder fuer Tupel-Werte.

xknx liefert DPT-16.x-Strings haeufig als Tupel von Byte-Werten
(z. B. (32, 32, 37, 32, 84, 111, 116, 97, 108, ...) = "  %  Total"). Im
UI sah das vorher wie ein Zahlentupel aus, jetzt wird es zur lesbaren
String-Darstellung dekodiert.
"""

from __future__ import annotations

from custom_components.messagehub.processing.knx_dpt import format_value


def test_dpt16_tuple_decoded_to_string() -> None:
    # "  %  Total %" mit Padding-Nullen, typisch DPT 16.001.
    bytes_tuple = (32, 32, 37, 32, 84, 111, 116, 97, 108, 32, 32, 32, 32, 37)
    out = format_value("16.001", bytes_tuple)
    assert "Total" in out
    assert "%" in out


def test_dpt16_string_passthrough() -> None:
    # Wenn xknx schon einen String liefert: nicht doppelt dekodieren.
    assert format_value("16.000", "Hello") == "Hello"


def test_unknown_dpt_with_byte_tuple_decoded() -> None:
    # GA ohne ETS-DPT: Heuristik soll trotzdem greifen.
    bytes_tuple = (32, 32, 37, 32, 84, 111, 116, 97, 108, 32, 32, 32, 32, 37)
    out = format_value(None, bytes_tuple)
    assert "Total" in out
    assert "(32" not in out


def test_unknown_dpt_with_short_tuple_not_misinterpreted() -> None:
    # 3-Byte-Tupel koennten DPT 10/11 sein — nicht alle als String werten.
    # Unsere Heuristik kickt nur wenn printable-Bytes ueberwiegen.
    # (10, 20, 30) sind nicht printable -> bleibt als Tupel-String.
    out = format_value(None, (10, 20, 30))
    assert "(10" in out  # Tupel-Repr beibehalten


def test_unknown_dpt_with_non_byte_tuple_not_decoded() -> None:
    out = format_value(None, (1.5, 2.5, 3.5))
    # Floats -> nicht als Bytes interpretiert.
    assert "1.5" in out


def test_unknown_dpt_with_oversized_int_not_decoded() -> None:
    out = format_value(None, (32, 32, 300, 84))
    # 300 > 255 -> bricht heuristik, fallback auf str(value).
    assert "300" in out


def test_unknown_dpt_with_mostly_non_printable_bytes_not_decoded() -> None:
    # 4 von 5 Bytes < 32 -> nicht printable -> nicht als String werten.
    out = format_value(None, (1, 2, 3, 4, 65))
    assert "65" in out
    assert "A" not in out  # 65 ist 'A', sollte aber nicht dekodieren


def test_dpt16_tuple_with_padding_nulls_stripped() -> None:
    # DPT 16.000 ist 14 Byte fest mit Null-Padding.
    bytes_tuple = (72, 105, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)  # "Hi"
    out = format_value("16.000", bytes_tuple)
    assert out == "Hi"
