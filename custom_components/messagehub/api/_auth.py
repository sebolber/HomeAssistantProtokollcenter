"""Iter 71 / CR-37: HA-frei testbare Auth-Logik.

`api/_helpers.py` importiert `homeassistant.components.http` — damit
laesst sich der Auth-Check nicht ohne HA-Test-Stack unit-testen. Diese
Datei haelt die pure Funktion in einem eigenen Modul, das nur
`aiohttp.web` braucht.
"""

from __future__ import annotations

from typing import Any

from aiohttp import web


def assert_admin_user(user: Any) -> None:
    """Wirft `web.HTTPForbidden`, wenn der User nicht Admin ist.

    Akzeptierte Eingaben:
    - `None` (kein hass_user — Request ohne Auth) → 403.
    - Object ohne `is_admin`-Attribut → 403.
    - Object mit `is_admin = False` → 403.
    - Object mit `is_admin = True` → kein Throw.

    `getattr(..., False)` faengt Mock-User ohne `is_admin`-Attribut
    sauber ab; in Production liefert HA `User(is_admin=bool)`.
    """
    if user is None or not getattr(user, "is_admin", False):
        raise web.HTTPForbidden(reason="admin required")
