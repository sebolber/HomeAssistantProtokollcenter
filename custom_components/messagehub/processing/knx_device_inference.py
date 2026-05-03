"""Iter L2.3: Auto-Inferenz von Hersteller-Hinweisen aus GA-Labels.

Bewusst HA-frei (nur stdlib + const-Tabelle), damit Unit-Tests ohne
HA-Stack laufen koennen. Wird von ``api/knx_stats.py``-View genutzt
und dort auch im Frontend-DTO als ``inferred``-Feld gerendert.
"""

from __future__ import annotations

from ..const import KNX_MANUFACTURER_HINTS


def _canonicalize(name: str) -> str:
    """Lowercase + Umlaute normalisieren (Vergleichs-Sicht-Form)."""
    return (
        name.lower()
        .replace("ö", "oe")
        .replace("ä", "ae")
        .replace("ü", "ue")
        .replace("ß", "ss")
    )


def infer_manufacturer_from_labels(labels: list[str]) -> str | None:
    """Heuristische Inferenz aus den GA-Labels eines Geraets gegen
    ``KNX_MANUFACTURER_HINTS``.

    Sucht (case-insensitive) nach Hersteller-Namen oder eindeutigen
    Schluesselwoertern in den Labels. Konservativ: bei Mehrfach-Match
    wird ``None`` zurueckgegeben — wir wollen keinen falschen Vorschlag
    machen, der den Layer-2-Lookup auf eine falsche Schiene zwingt.

    Bevorzugt canonical-form: bei einem Treffer auf 'hörmann' oder
    'hoermann' wird immer 'hoermann' zurueckgegeben — konsistent zu
    ``knx_device_model_recommendations.py``-Tabellen-Keys.
    """
    if not labels:
        return None
    text = " ".join(s for s in labels if s).lower()
    if not text.strip():
        return None
    matches: set[str] = set()
    for manufacturer in KNX_MANUFACTURER_HINTS:
        normalized = manufacturer.lower()
        canonical = _canonicalize(manufacturer)
        if normalized in text or canonical in text:
            matches.add(canonical)
    if len(matches) == 1:
        return next(iter(matches))
    return None
