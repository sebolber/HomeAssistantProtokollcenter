"""Iter 70 / CR-32: Pure Funktionen fuer GA-Werteverlauf-Export.

Iter 68 hat den Endpoint im View inline implementiert; das laesst die
Encoding-Logik (CSV-Quoting, JSON-Wrapper, Hard-Cap) ungetestet. Hier
extrahiert als pure helpers, damit Edge-Cases ohne HA-Stack getestet
werden koennen.
"""

from __future__ import annotations

import csv
import io
import json
from collections.abc import Sequence
from typing import Any, Final

# Hard-Cap auf 50 000 Samples — schuetzt vor Memory-Bombs (siehe
# CR-32 + CR-18). Bei einer aktiven GA mit 50 Tel/s sind das ca. 17 Min
# Werteverlauf — fuer Diagnostik mehr als genug.
EXPORT_MAX_SAMPLES: Final = 50_000


def cap_samples(samples: Sequence[dict[str, Any]]) -> list[dict[str, Any]]:
    """Wendet den Hard-Cap auf die Sample-Liste an.

    Zentrale Stelle, damit View und Tests denselben Cut nutzen.
    """
    return list(samples[:EXPORT_MAX_SAMPLES])


def format_ga_export_csv(
    ga: str, samples: Sequence[dict[str, Any]]
) -> str:
    """Liefert den Werteverlauf als CSV-String.

    Spalten: ts, ga, dev_source, telegramtype, value.
    Komplexe Werte (dict, list) werden json-encoded; primitive Werte
    (str/int/float/bool) gehen direkt rein. None wird zu leerem String.

    csv.writer kuemmert sich um Quoting bei Kommas/Anfuehrungszeichen
    in Werten — das ist die entscheidende Robustheits-Garantie hier.
    """
    capped = cap_samples(samples)
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\n")
    writer.writerow(["ts", "ga", "dev_source", "telegramtype", "value"])
    for s in capped:
        value = s.get("value")
        if value is None:
            cell: Any = ""
        elif isinstance(value, (str, int, float, bool)):
            cell = value
        else:
            cell = json.dumps(value, ensure_ascii=False)
        writer.writerow(
            [
                s.get("ts", ""),
                ga,
                s.get("dev_source", ""),
                s.get("telegramtype") or "",
                cell,
            ]
        )
    return buf.getvalue()


def format_ga_export_json(
    ga: str,
    from_iso: str,
    to_iso: str,
    samples: Sequence[dict[str, Any]],
) -> str:
    """Liefert den Werteverlauf als JSON-Wrapper-Objekt."""
    capped = cap_samples(samples)
    return json.dumps(
        {
            "ga": ga,
            "from": from_iso,
            "to": to_iso,
            "count": len(capped),
            "samples": [
                {
                    "ts": s.get("ts"),
                    "value": s.get("value"),
                    "telegramtype": s.get("telegramtype"),
                    "dev_source": s.get("dev_source"),
                }
                for s in capped
            ],
        },
        ensure_ascii=False,
    )


def safe_export_filename(ga: str, suffix: str) -> str:
    """Liefert einen sicheren Filename fuer Content-Disposition.

    Slashes im GA werden zu Bindestrichen — das macht den Filename
    cross-platform-tauglich.
    """
    cleaned = ga.replace("/", "-")
    return f"ga-{cleaned}.{suffix}"
