"""Iter 34: Hersteller-Hinweise fuer den KNX-Stats-Detail-Pane.

Liest aus const.KNX_MANUFACTURER_HINTS und matcht Hersteller-Strings
case-insensitive per Substring. Liefert ein DTO mit doku-URL + Tipp-
Liste.

Nachhaltige Architektur: Hersteller-Wissen ist hartkodiert in const.py
(versionsweise pflegeleicht), keine externe Datenquelle, kein Internet-
Zugriff. Match ist robust gegen Schreibweisen wie 'Hörmann KG
Verkaufsgesellschaft'.
"""

from __future__ import annotations

from typing import Any

from ..const import KNX_MANUFACTURER_HINTS


def lookup_manufacturer_hints(
    manufacturer: str | None,
) -> dict[str, Any] | None:
    """Liefert {doc_url, tips, matched_key} fuer einen Hersteller-String.

    `manufacturer` darf der raw-ETS-String sein (z.B. "Hörmann KG
    Verkaufsgesellschaft"). Bei kein Match: None.
    """
    if not manufacturer or not isinstance(manufacturer, str):
        return None
    needle = manufacturer.lower()
    for key, value in KNX_MANUFACTURER_HINTS.items():
        if key in needle:
            return {
                "matched_key": key,
                "doc_url": value.get("doc_url", ""),
                "tips": list(value.get("tips", [])),
            }
    return None
