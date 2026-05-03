"""Markdown-Export der Findings (Iter 29 / knx-findings).

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §5.4 (E15).
Copy-Paste-Vorlage fuer die ETS-Notiz-Spalte: Tabellen-Markdown mit
Code, GA, Severity, Source, Last-Seen und der wesentlichen Evidence.

Reine Funktion — kein DB-Zugriff. Service-Layer liest die Findings
und ruft hier auf.
"""

from __future__ import annotations

import json
from collections.abc import Iterable
from typing import Any

from .findings import Finding

_EMPTY_PLACEHOLDER = "_Keine Findings im aktuellen Filter._"


def format_findings_markdown(findings: Iterable[Finding]) -> str:
    """Liefert eine Markdown-Tabelle mit den Findings.

    Spalten: Code | GA | Severity | Source | Last-Seen | Evidence.
    Pipes in Evidence-Werten werden HTML-entitaet-escaped (`&#124;`),
    damit die Tabelle nicht zerbricht.
    """
    rows = list(findings)
    if not rows:
        return _EMPTY_PLACEHOLDER + "\n"

    lines = [
        "| Code | GA | Severity | Source | Last-Seen | Evidence |",
        "|------|----|----------|--------|-----------|----------|",
    ]
    for finding in rows:
        evidence_str = _render_evidence(finding.evidence)
        lines.append(
            f"| {_escape(finding.code)} "
            f"| {_escape(finding.ga or '(global)')} "
            f"| {_escape(finding.severity)} "
            f"| {_escape(finding.source or '—')} "
            f"| {_escape(finding.last_seen.isoformat())} "
            f"| {evidence_str} |"
        )
    return "\n".join(lines) + "\n"


def _render_evidence(evidence: dict[str, Any]) -> str:
    """Rendert Evidence-Dict als Inline-JSON, sortierte Keys.

    Keine Whitespaces im JSON (kompakt), Pipes escaped.
    """
    raw = json.dumps(evidence, sort_keys=True, separators=(",", ":"), default=str)
    return _escape(raw)


def _escape(value: str) -> str:
    """Escaped Markdown-Pipes als `&#124;` und Newlines als `<br>`.

    Pipes wuerden sonst die Tabelle zerbrechen; Newlines wuerden eine
    neue Tabelle anfangen. `\\|` waere semantisch korrekt aber wird in
    HA-Dashboards (markdown-lite) nicht zuverlaessig gerendert; HTML-
    Entitaet ist sicher.
    """
    return value.replace("|", "&#124;").replace("\n", "<br>")


__all__ = ["format_findings_markdown"]
