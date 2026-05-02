# Message Hub

Zentrale Sammelstelle für Nachrichten und Fehlermeldungen aus mehreren
Eingangskanälen — persistiert in eigener SQLite, dargestellt in einem
Sidebar-Panel.

## Was ist drin

- **Sidebar-Panel** mit Live-Liste, Filtern (Severity / Source / Suche / Zeit),
  Detail-Ansicht, Bulk-Lösch, Inline-Severity-Edit
- **Eingangskanäle**: Webhook (mit JSONPath-Mapping & Rate-Limiting),
  HA-Eventbus (`system_log_event`, `state_changed`, `logbook_entry`),
  KNX-Bus (mit GA-Whitelist + Severity-Mapping pro GA),
  MQTT (mit Wildcard-Topics), Syslog UDP (RFC-3164)
- **Auswertung**: Health-Score pro Source (0–100), Heatmap Stunde×Wochentag,
  Top-10-Sources, Severity-Time-Series, MTTR pro Source,
  EWMA-Anomalie-Erkennung (3σ-Burst), Pattern-Mining
- **Notifications**: Telegram, Pushover, ntfy, E-Mail, Signal — mit
  Quiet-Hours, Throttling, Severity-Eskalation, Test-Channel
- **Operations**: Audit-Log (unveränderlich), Export JSONL/CSV/Forensik-ZIP,
  Auto-Remediation-Hooks, Wochenreport per Mail, Retention-Job
- **DPT-Formatter** für KNX (1.x Boolean, 9.x Float, 10/11/19 Date/Time,
  16.x String, 232.x RGB) — rohe Bytes werden lesbar

## Voraussetzungen

- Home Assistant 2025.10 oder neuer
- Optional: KNX-Integration (für Bus-Capture), MQTT-Integration (für Topics)

## Installation

1. HACS → Custom Repositories → URL des Repos hinzufügen
2. Integration „Message Hub" suchen und installieren
3. HA neu starten
4. Einstellungen → Geräte & Dienste → Integration hinzufügen → „Message Hub"
5. Sidebar zeigt das neue Panel „Nachrichten"

## Konfiguration

Komplett über das Panel-UI. Keine YAML-Pflege nötig. Optional: Logger-Level
für Debugging über `logger:`-Block in `configuration.yaml` setzen.

Details in der [README](https://github.com/sebolber/homeassistantprotokollcenter)
und [docs/](https://github.com/sebolber/homeassistantprotokollcenter/tree/main/docs).
