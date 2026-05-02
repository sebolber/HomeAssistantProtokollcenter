"""Iter 71 / CR-37: Tests fuer assert_admin_user.

Pure Funktion ohne HA-Stack — testet, dass alle Bypass-Pfade abgefangen
werden:
- None-User (anonymous Request) → 403
- User-Object ohne is_admin-Attribut → 403
- is_admin=False → 403
- is_admin=True → OK
"""

from __future__ import annotations

from dataclasses import dataclass

import pytest
from aiohttp import web

from custom_components.messagehub.api._auth import assert_admin_user


@dataclass
class _FakeUser:
    is_admin: bool


def test_admin_user_passes() -> None:
    user = _FakeUser(is_admin=True)
    # No exception -> ok.
    assert_admin_user(user)


def test_non_admin_user_raises_forbidden() -> None:
    user = _FakeUser(is_admin=False)
    with pytest.raises(web.HTTPForbidden) as excinfo:
        assert_admin_user(user)
    assert "admin required" in str(excinfo.value.reason)


def test_none_user_raises_forbidden() -> None:
    with pytest.raises(web.HTTPForbidden):
        assert_admin_user(None)


def test_object_without_is_admin_attr_raises() -> None:
    class _Stranger:
        pass

    with pytest.raises(web.HTTPForbidden):
        assert_admin_user(_Stranger())


def test_object_with_truthy_non_bool_is_admin_passes() -> None:
    # Defensiv: truthy aber nicht bool -> wird wie True behandelt.
    # (HA liefert immer bool, aber Mock-Daten koennten 1 statt True
    # zurueckliefern.)
    class _LooseUser:
        is_admin = 1

    assert_admin_user(_LooseUser())


def test_object_with_falsy_is_admin_raises() -> None:
    class _Stranger:
        is_admin = 0

    with pytest.raises(web.HTTPForbidden):
        assert_admin_user(_Stranger())


def test_string_is_admin_treated_as_truthy() -> None:
    # Pathological case: jemand setzt is_admin="yes" — gilt als truthy.
    # Defensive Tests dokumentieren das Verhalten.
    class _StringAdmin:
        is_admin = "yes"

    assert_admin_user(_StringAdmin())


def test_empty_string_is_admin_raises() -> None:
    class _EmptyString:
        is_admin = ""

    with pytest.raises(web.HTTPForbidden):
        assert_admin_user(_EmptyString())
