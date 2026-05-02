"""Iter 69 / K2: Prometheus-Text-Exporter fuer messagehub-Metriken.

Pure Funktion `format_prometheus_metrics`: nimmt vorberechnete Counts
und liefert ein Prometheus-text-format-String. Aufrufer kann das in
einem aiohttp-Response zuruecksenden.

Format-Spezifikation: https://prometheus.io/docs/instrumenting/exposition_formats/
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Final

# Sortierte Severity-Liste fuer reproduzierbare Ausgabe.
_SEVERITIES: Final = ("debug", "info", "warning", "error")


def format_prometheus_metrics(
    *,
    total: int,
    severity_total: Mapping[str, int],
    severity_24h: Mapping[str, int],
    knx_total: int = 0,
    webhook_total: int = 0,
) -> str:
    """Erzeugt einen Prometheus-Text-Format-String.

    Drei Metric-Familien:
    - messagehub_messages_total (counter, all-time pro Severity)
    - messagehub_messages_24h (gauge, letzte 24h pro Severity)
    - messagehub_total (counter, all-time gesamt)
    - messagehub_knx_telegrams_total (counter)
    - messagehub_webhooks_total (gauge)

    Reihenfolge ist deterministisch — wichtig fuer Tests + Diff-freier
    Scrape.
    """
    lines: list[str] = []

    # Gesamt-Total
    lines.append("# HELP messagehub_total Total messages stored")
    lines.append("# TYPE messagehub_total counter")
    lines.append(f"messagehub_total {total}")

    # Pro Severity, all-time
    lines.append(
        "# HELP messagehub_messages_total Messages by severity (all-time)"
    )
    lines.append("# TYPE messagehub_messages_total counter")
    for sev in _SEVERITIES:
        count = int(severity_total.get(sev, 0))
        lines.append(f'messagehub_messages_total{{severity="{sev}"}} {count}')

    # Pro Severity, letzte 24h
    lines.append(
        "# HELP messagehub_messages_24h Messages by severity (last 24 hours)"
    )
    lines.append("# TYPE messagehub_messages_24h gauge")
    for sev in _SEVERITIES:
        count = int(severity_24h.get(sev, 0))
        lines.append(f'messagehub_messages_24h{{severity="{sev}"}} {count}')

    # KNX-Telegramme
    lines.append(
        "# HELP messagehub_knx_telegrams_total KNX telegrams logged (whitelist)"
    )
    lines.append("# TYPE messagehub_knx_telegrams_total counter")
    lines.append(f"messagehub_knx_telegrams_total {knx_total}")

    # Webhooks
    lines.append("# HELP messagehub_webhooks_total Configured webhooks")
    lines.append("# TYPE messagehub_webhooks_total gauge")
    lines.append(f"messagehub_webhooks_total {webhook_total}")

    return "\n".join(lines) + "\n"
