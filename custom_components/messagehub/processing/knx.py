"""Iter 48: KNX-Telegramm-Anreicherung.

Parsing der Gruppenadresse aus dem Text (Regex `\\d+/\\d+/\\d+`),
Lookup gegen ETS-CSV-Export, Ergebnis in metadata.knx_label.
"""

from __future__ import annotations

import csv
import io
import re

_GA_RE = re.compile(r"\b(\d+)/(\d+)/(\d+)\b")


def extract_group_address(text: str) -> str | None:
    """Liefert die erste KNX-Gruppenadresse oder None."""
    m = _GA_RE.search(text)
    if not m:
        return None
    return f"{m.group(1)}/{m.group(2)}/{m.group(3)}"


def load_ets_csv(content: str) -> dict[str, str]:
    """Liest ETS-CSV-Export und liefert {gruppenadresse: label}.

    Erwartet mind. zwei Spalten: address, name. Weitere werden ignoriert.
    """
    out: dict[str, str] = {}
    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames:
        return out
    addr_field = next(
        (f for f in reader.fieldnames if f.lower() in {"address", "ga", "gruppenadresse"}),
        None,
    )
    name_field = next(
        (f for f in reader.fieldnames if f.lower() in {"name", "label", "bezeichnung"}),
        None,
    )
    if addr_field is None or name_field is None:
        return out
    for row in reader:
        addr = (row.get(addr_field) or "").strip()
        name = (row.get(name_field) or "").strip()
        if addr and name:
            out[addr] = name
    return out


def lookup_label(text: str, lookup: dict[str, str]) -> str | None:
    ga = extract_group_address(text)
    if ga is None:
        return None
    return lookup.get(ga)


