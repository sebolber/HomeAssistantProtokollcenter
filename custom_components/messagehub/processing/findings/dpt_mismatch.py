"""Detector `DPT_MISMATCH` (Iter 12 / knx-findings).

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md`
§9.2 + §9.3. Vergleicht das vom User/ETS gepflegte Soll
(`knx_group_addresses.dpt`) mit dem vom Auto-Erkenner gelieferten Ist
(`knx_group_addresses.dpt_inferred`). Erzeugt einen `Finding` mit
Severity `warning` (Iter B2 — vorher ``error``), sobald die DPTs
ueber der Confidence-Schwelle auseinanderlaufen.

Decision: Confidence-Schwelle 0.85 (statt 0.80). False-Positives bei
DPT 9.x mit < 50 Samples gehaeufter — der Auto-Erkenner liefert dort
oft generisches "9.x", das wir bei kleineren Sample-Mengen nicht als
Soll-Mismatch werten wollen.

Iter B2: Severity heruntergesetzt auf ``warning``. Der DPT-Auto-
Erkenner ist werte-basiert und kann False-Positives produzieren —
typisch bei Stellantrieben mit DPT 5.001, die nur 0% und 100% senden,
die der frueherer ``_classify_int_samples`` faelschlich als 1.001
inferiert hat. Heuristik wurde gehaertet (Wert-Diversitaet erforderlich),
aber bis ein zweiter unabhaengiger Indikator (xknx-Tracer, ETS-Soll)
verfuegbar ist, bleibt das Severity-Default ``warning``.

`detect_dpt_mismatch` ist eine reine Funktion — Persistenz via
FindingsRepository.record macht der Aufrufer.
"""

from __future__ import annotations

from datetime import datetime
from typing import Final

from . import Finding, FindingSeverity

DPT_MISMATCH_CONFIDENCE_THRESHOLD: Final[float] = 0.85
"""Mindest-Confidence des Auto-Erkenners, bevor wir einen Mismatch melden.

Begruendung in der Modul-Docstring oben."""

_DPT_MISMATCH_SEVERITY: Final[FindingSeverity] = "warning"
_DPT_MISMATCH_VERSION: Final[str] = "DPT_MISMATCH/v2"
_GENERIC_FLOAT_DPT: Final[str] = "9.x"


def detect_dpt_mismatch(
    *,
    ga: str,
    project_dpt: str | None,
    inferred_dpt: str | None,
    confidence: float,
    samples: int,
    now: datetime,
) -> Finding | None:
    """Liefert einen `Finding`, wenn Soll- und Ist-DPT differieren.

    Bedingungen fuer einen Finding:
    1. project_dpt und inferred_dpt sind beide gesetzt.
    2. confidence >= DPT_MISMATCH_CONFIDENCE_THRESHOLD.
    3. project_dpt != inferred_dpt
       Ausnahme: inferred_dpt == "9.x" + project_dpt startet mit "9."
       — der Auto-Erkenner liefert dort generisch, der Projekt-Wert ist
       ein konkreter 9.xxx-Subtyp; das ist kein Widerspruch.
    """
    if project_dpt is None or inferred_dpt is None:
        return None
    if confidence < DPT_MISMATCH_CONFIDENCE_THRESHOLD:
        return None
    if project_dpt == inferred_dpt:
        return None
    if _is_compatible_generic_match(project_dpt, inferred_dpt):
        return None
    return Finding(
        code="DPT_MISMATCH",
        # Iter B2: schema_version=2, weil die Detector-Heuristik
        # (Wert-Diversitaet) sich gegenueber v1 geaendert hat. Alte
        # Acks gegen v1-Findings bleiben gueltig — siehe
        # docs/messagehub_knx_konfigurationsfehler_recherche.md §9.5.
        schema_version=2,
        severity=_DPT_MISMATCH_SEVERITY,
        ga=ga,
        source=None,
        evidence={
            "project_dpt": project_dpt,
            "inferred_dpt": inferred_dpt,
            "confidence": confidence,
            "samples": samples,
        },
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=_DPT_MISMATCH_VERSION,
    )


def _is_compatible_generic_match(project_dpt: str, inferred_dpt: str) -> bool:
    """True, wenn das Inferenz-Ergebnis ein generischer Subtyp-Treffer ist.

    Aktuell nur fuer 9.x-Floats: `infer_dpt_from_samples` liefert "9.x"
    ohne Subtyp, weil 9.001 (Temperatur), 9.004 (Lux), 9.005 (Wind),
    9.007 (Feuchte), 9.008 (CO2) sich aus Werten allein nicht
    unterscheiden lassen. Wenn das Projekt einen 9.xxx-Subtyp hat und
    der Auto-Erkenner generisch "9.x" liefert, sind beide vertraeglich.
    """
    return inferred_dpt == _GENERIC_FLOAT_DPT and project_dpt.startswith("9.")


__all__ = [
    "DPT_MISMATCH_CONFIDENCE_THRESHOLD",
    "detect_dpt_mismatch",
]
