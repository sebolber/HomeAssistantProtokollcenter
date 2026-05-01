# Message Hub für Home Assistant

Zentrale Sammelstelle für strukturierte Nachrichten (Info, Warning, Error, Debug)
aus beliebigen Quellen, eingehend über konfigurierbare Webhooks, persistent in
eigener SQLite-Datenbank, mit gefiltertem Dashboard-Panel direkt in Home Assistant.

## Features

- **Webhooks** mit konfigurierbarem JSONPath-Field-Mapping
- **REST-API** für Listen, Filter, Pagination, Stats
- **Sidebar-Panel** (Lit) mit Severity/Source/Volltext/Zeitraum-Filtern,
  Detail-Pane, Live-Updates über WebSocket
- **Counter-Sensoren** `messagehub_total`, `messagehub_errors_24h`,
  `messagehub_warnings_24h`, `messagehub_last_message`
- **Service** `messagehub.add_message` für Automationen
- **Retention** pro Severity, taeglicher Cleanup, wöchentliches VACUUM
- **Deduplizierung** mit Fingerprint-basiertem Aggregator
- **Status-Lifecycle** new → acknowledged → resolved
- **Notifications** (Telegram/Pushover/ntfy) mit Quiet Hours und Throttling
- **Heartbeat-Tracking** für stille Quellen, Anomalie-Erkennung (EWMA)
- **MQTT-, Eventbus- und Syslog-Eingänge**
- **FTS5-Volltextsuche**, Korrelations-IDs, Health-Score, Tags, Audit-Log
- **Wochenreport** per E-Mail, Auto-Remediation-Hooks, KNX-Anreicherung

## Installation

### Via HACS (empfohlen)

HACS → Integrationen → 3-Punkte-Menü → „Benutzerdefinierte Repositories" →
URL `https://github.com/sebolber/HomeAssistantProtokollcenter`, Kategorie
„Integration" → Installieren → HA neu starten → Geräte & Dienste → „Message Hub".

### Manuell

```bash
cp -r custom_components/messagehub <ha-config>/custom_components/
```
HA neu starten, dann unter Geräte & Dienste hinzufügen.

## Service `messagehub.add_message`

```yaml
service: messagehub.add_message
data:
  severity: error
  source: pihole
  text: DNS unreachable
  metadata:
    host: pi.hole
```

## Webhook anlegen

Settings-Tab im Panel → Webhook hinzufügen → JSONPath-Mapping bearbeiten.
Beispiel:

```json
{
  "severity": "$.level",
  "source": "$.app.name",
  "text": "$.message",
  "metadata": "$.extra"
}
```

## Entwicklung

Siehe `DEVELOPMENT.md` und `claude-code-runbook.md`.

```bash
bash scripts/start.sh -y          # alles auto-installieren und starten
pytest                             # alle Tests
cd frontend && npm test            # Frontend-Tests
```

## Lizenz

MIT — siehe `LICENSE`.
