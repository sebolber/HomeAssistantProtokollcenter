"""Iter 6: parse_iso_period und validate_knx_ga aus api/_helpers.py.

Beide Helpers sind pure functions ueber dict-/Mapping-Inputs und
testbar ohne HA-Stack.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from aiohttp import web

from custom_components.messagehub.api._validation import (
    parse_iso_period,
    validate_knx_ga,
    validate_note,
)


class TestParseIsoPeriod:
    def test_empty_uses_default_days(self) -> None:
        f, t = parse_iso_period({}, default_days=7)
        from_dt = datetime.fromisoformat(f)
        to_dt = datetime.fromisoformat(t)
        delta = to_dt - from_dt
        assert timedelta(days=6, hours=23) <= delta <= timedelta(days=7, hours=1)

    def test_only_to_set_derives_from(self) -> None:
        to_iso = datetime(2026, 5, 2, 12, 0, 0, tzinfo=UTC).isoformat(timespec="seconds")
        f, t = parse_iso_period({"to": to_iso}, default_days=3)
        assert t == to_iso
        from_dt = datetime.fromisoformat(f)
        assert from_dt == datetime(2026, 4, 29, 12, 0, 0, tzinfo=UTC)

    def test_both_set_used_verbatim(self) -> None:
        f_in = "2026-05-01T00:00:00+00:00"
        t_in = "2026-05-02T00:00:00+00:00"
        f, t = parse_iso_period({"from": f_in, "to": t_in})
        assert f == f_in
        assert t == t_in

    def test_to_before_from_raises_400(self) -> None:
        with pytest.raises(web.HTTPBadRequest):
            parse_iso_period(
                {"from": "2026-05-02T00:00:00+00:00", "to": "2026-05-01T00:00:00+00:00"}
            )

    def test_to_equals_from_raises_400(self) -> None:
        same = "2026-05-02T00:00:00+00:00"
        with pytest.raises(web.HTTPBadRequest):
            parse_iso_period({"from": same, "to": same})

    def test_invalid_iso_raises_400(self) -> None:
        with pytest.raises(web.HTTPBadRequest):
            parse_iso_period({"from": "not-iso", "to": "2026-05-02T00:00:00+00:00"})

    def test_period_exceeding_max_raises_400(self) -> None:
        with pytest.raises(web.HTTPBadRequest):
            parse_iso_period(
                {
                    "from": "2026-01-01T00:00:00+00:00",
                    "to": "2026-05-01T00:00:00+00:00",
                }
            )


class TestValidateKnxGa:
    def test_valid_three_part(self) -> None:
        assert validate_knx_ga("1/2/3") == "1/2/3"

    def test_valid_max_subgroup(self) -> None:
        assert validate_knx_ga("31/7/255") == "31/7/255"

    def test_two_digit_main(self) -> None:
        assert validate_knx_ga("12/3/45") == "12/3/45"

    def test_invalid_format_raises_400(self) -> None:
        for bad in ["", "1/2", "1/2/3/4", "abc", "1.2.3", "/1/2/3", "1/2/3 "]:
            with pytest.raises(web.HTTPBadRequest):
                validate_knx_ga(bad)

    def test_non_string_raises_400(self) -> None:
        with pytest.raises(web.HTTPBadRequest):
            validate_knx_ga(123)  # type: ignore[arg-type]


class TestValidateNote:
    def test_normal_string_passes(self) -> None:
        assert validate_note("kurzer Hinweis") == "kurzer Hinweis"

    def test_none_returns_none(self) -> None:
        assert validate_note(None) is None

    def test_int_returns_none(self) -> None:
        assert validate_note(42) is None

    def test_dict_returns_none(self) -> None:
        assert validate_note({"a": 1}) is None

    def test_empty_string_passes(self) -> None:
        assert validate_note("") == ""

    def test_long_string_raises_400(self) -> None:
        with pytest.raises(web.HTTPBadRequest):
            validate_note("x" * 1001)

    def test_max_length_param_respected(self) -> None:
        assert validate_note("x" * 100, max_length=200) == "x" * 100
        with pytest.raises(web.HTTPBadRequest):
            validate_note("x" * 201, max_length=200)
