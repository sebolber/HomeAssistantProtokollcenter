"""Iter 70 / CR-32: Tests fuer GA-Werteverlauf-Export.

Iter 68 hat den Endpoint inline ohne Tests gebaut — Hard-Cap, CSV-
Quoting, JSON-Encoding ungeprueft. Hier nachgeholt mit pure Helpers
aus processing/knx_stats_export.py.
"""

from __future__ import annotations

import csv
import io
import json

from custom_components.messagehub.processing.knx_stats_export import (
    EXPORT_MAX_SAMPLES,
    cap_samples,
    format_ga_export_csv,
    format_ga_export_json,
    safe_export_filename,
)

# ----------------------------------------------------------------------
# cap_samples


def test_cap_samples_applies_hard_cap() -> None:
    samples = [{"ts": str(i), "value": i} for i in range(EXPORT_MAX_SAMPLES + 100)]
    capped = cap_samples(samples)
    assert len(capped) == EXPORT_MAX_SAMPLES


def test_cap_samples_passthrough_below_limit() -> None:
    samples = [{"ts": "1", "value": 1}, {"ts": "2", "value": 2}]
    assert cap_samples(samples) == samples


def test_cap_samples_returns_new_list_not_mutating_source() -> None:
    samples = [{"ts": "1", "value": 1}]
    result = cap_samples(samples)
    result.append({"ts": "2", "value": 2})
    assert len(samples) == 1


# ----------------------------------------------------------------------
# format_ga_export_csv


def test_csv_has_header() -> None:
    out = format_ga_export_csv("1/2/3", [])
    assert out.startswith("ts,ga,dev_source,telegramtype,value\n")


def test_csv_writes_one_row_per_sample() -> None:
    samples = [
        {
            "ts": "2026-05-02T10:00:00",
            "value": 21.5,
            "dev_source": "1.1.5",
            "telegramtype": "GroupValueWrite",
        },
        {
            "ts": "2026-05-02T10:01:00",
            "value": 22.0,
            "dev_source": "1.1.5",
            "telegramtype": "GroupValueWrite",
        },
    ]
    out = format_ga_export_csv("1/3/5", samples)
    rows = list(csv.reader(io.StringIO(out)))
    assert len(rows) == 3  # Header + 2
    assert rows[1][0] == "2026-05-02T10:00:00"
    assert rows[1][1] == "1/3/5"
    assert rows[1][4] == "21.5"


def test_csv_quotes_values_with_commas_and_quotes() -> None:
    # Wert mit Komma + Anfuehrungszeichen — csv.writer muss korrekt quoten.
    samples = [
        {
            "ts": "2026-05-02T10:00:00",
            "value": 'foo, "bar"',
            "dev_source": "1.1.5",
            "telegramtype": "GroupValueWrite",
        },
    ]
    out = format_ga_export_csv("1/2/3", samples)
    rows = list(csv.reader(io.StringIO(out)))
    assert rows[1][4] == 'foo, "bar"'


def test_csv_handles_dict_value_as_json() -> None:
    samples = [
        {
            "ts": "2026-05-02T10:00:00",
            "value": {"red": 255, "green": 0, "blue": 128},
            "dev_source": "1.1.5",
            "telegramtype": "GroupValueWrite",
        },
    ]
    out = format_ga_export_csv("1/2/3", samples)
    rows = list(csv.reader(io.StringIO(out)))
    parsed = json.loads(rows[1][4])
    assert parsed == {"red": 255, "green": 0, "blue": 128}


def test_csv_handles_none_value_as_empty_cell() -> None:
    samples = [
        {
            "ts": "2026-05-02T10:00:00",
            "value": None,
            "dev_source": "1.1.5",
            "telegramtype": "GroupValueWrite",
        },
    ]
    out = format_ga_export_csv("1/2/3", samples)
    rows = list(csv.reader(io.StringIO(out)))
    assert rows[1][4] == ""


def test_csv_respects_export_max_samples() -> None:
    samples = [
        {"ts": str(i), "value": i, "dev_source": "1.1.5", "telegramtype": "GroupValueWrite"}
        for i in range(EXPORT_MAX_SAMPLES + 50)
    ]
    out = format_ga_export_csv("1/2/3", samples)
    rows = list(csv.reader(io.StringIO(out)))
    assert len(rows) == EXPORT_MAX_SAMPLES + 1  # Header inklusive


def test_csv_handles_missing_telegramtype() -> None:
    samples = [
        {"ts": "2026-05-02T10:00:00", "value": 1, "dev_source": "1.1.5", "telegramtype": None},
    ]
    out = format_ga_export_csv("1/2/3", samples)
    rows = list(csv.reader(io.StringIO(out)))
    assert rows[1][3] == ""


def test_csv_lineterminator_is_lf_not_crlf() -> None:
    # Default csv.writer setzt CRLF — wir wollen LF fuer cross-platform-
    # konsistente Files (vor allem fuer git/diff/text-tools).
    samples = [{"ts": "2026-05-02T10:00:00", "value": 1, "dev_source": "1.1.5", "telegramtype": ""}]
    out = format_ga_export_csv("1/2/3", samples)
    assert "\r\n" not in out
    assert out.count("\n") == 2  # Header + 1 Row


# ----------------------------------------------------------------------
# format_ga_export_json


def test_json_returns_valid_wrapper() -> None:
    out = format_ga_export_json("1/2/3", "2026-05-02T00:00:00", "2026-05-02T23:59:59", [])
    parsed = json.loads(out)
    assert parsed["ga"] == "1/2/3"
    assert parsed["from"] == "2026-05-02T00:00:00"
    assert parsed["to"] == "2026-05-02T23:59:59"
    assert parsed["count"] == 0
    assert parsed["samples"] == []


def test_json_includes_samples() -> None:
    samples = [
        {"ts": "T1", "value": 21.5, "telegramtype": "GroupValueWrite", "dev_source": "1.1.5"},
        {"ts": "T2", "value": 22.0, "telegramtype": "GroupValueWrite", "dev_source": "1.1.5"},
    ]
    out = format_ga_export_json("1/3/5", "F", "T", samples)
    parsed = json.loads(out)
    assert parsed["count"] == 2
    assert len(parsed["samples"]) == 2
    assert parsed["samples"][0]["ts"] == "T1"


def test_json_respects_export_max_samples() -> None:
    samples = [
        {"ts": str(i), "value": i, "telegramtype": "GroupValueWrite", "dev_source": "1.1.5"}
        for i in range(EXPORT_MAX_SAMPLES + 10)
    ]
    out = format_ga_export_json("1/2/3", "F", "T", samples)
    parsed = json.loads(out)
    assert parsed["count"] == EXPORT_MAX_SAMPLES
    assert len(parsed["samples"]) == EXPORT_MAX_SAMPLES


def test_json_preserves_complex_value_types() -> None:
    samples = [
        {"ts": "T", "value": [1, 2, 3], "telegramtype": "x", "dev_source": "y"},
        {"ts": "T2", "value": {"a": 1}, "telegramtype": "x", "dev_source": "y"},
    ]
    out = format_ga_export_json("1/2/3", "F", "T", samples)
    parsed = json.loads(out)
    assert parsed["samples"][0]["value"] == [1, 2, 3]
    assert parsed["samples"][1]["value"] == {"a": 1}


def test_json_uses_ensure_ascii_false() -> None:
    samples = [{"ts": "T", "value": "Türschloß", "telegramtype": "x", "dev_source": "y"}]
    out = format_ga_export_json("1/2/3", "F", "T", samples)
    # Umlaute bleiben als Unicode, nicht als \uxxxx-Sequence.
    assert "Türschloß" in out


# ----------------------------------------------------------------------
# safe_export_filename


def test_filename_replaces_slashes_with_dashes() -> None:
    assert safe_export_filename("1/2/3", "csv") == "ga-1-2-3.csv"
    assert safe_export_filename("22/3/45", "json") == "ga-22-3-45.json"


def test_filename_preserves_dashes() -> None:
    # Auch wenn die GA selbst Bindestriche enthielte, bleibt der Filename
    # eindeutig nutzbar (cross-platform).
    assert safe_export_filename("1-2-3", "csv") == "ga-1-2-3.csv"
