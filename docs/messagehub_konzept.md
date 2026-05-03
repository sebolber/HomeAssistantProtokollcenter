# Konzept: Home Assistant Custom Integration `messagehub`

**Zweck:** Zentrale Sammelstelle für strukturierte Nachrichten (Info, Warning, Error, Debug) aus beliebigen Quellen, eingehend über konfigurierbare Webhooks, persistent in eigener SQLite-Datenbank, mit gefiltertem Dashboard-Panel direkt in Home Assistant.

**Zielgruppe:** Eigenes Smart Home (KNX + HA), erweiterbar auf Pi-hole, externe Skripte, Geräte mit Webhook-Fähigkeit.

---

## 1. Architektur-Entscheidung

| Option | Bewertung |
|---|---|
| **Custom Integration** (gewählt) | Native Webhook-Unterstützung, eigenes Sidebar-Panel über `panel_custom`, Services, Sensoren, Config-Flow, läuft im HA-Prozess. |
| Add-on (Docker) | Overhead durch separaten Container, eigene Auth nötig, keine native HA-Integration ohne API-Brücke. Nur sinnvoll bei Multi-HA-Setups. |
| Reine Lovelace-Lösung | Keine Persistenz möglich, keine Webhooks. Verworfen. |

**Domain-Name:** `messagehub`
**Komponenten-Typ:** Custom Integration (`custom_components/messagehub/`)
**Persistenz:** Eigene SQLite-Datei in `<config>/messagehub/messages.db`
**Frontend:** Custom Panel (eigenständiger Sidebar-Eintrag „Messages")

---

## 2. Datenmodell

### 2.1 Tabelle `messages`

| Spalte | Typ | Constraints | Beschreibung |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | Eindeutige ID |
| `timestamp` | TEXT (ISO-8601 UTC) | NOT NULL, INDEXED | Empfangszeitpunkt |
| `severity` | TEXT | NOT NULL, CHECK IN (`debug`,`info`,`warning`,`error`) | Schweregrad |
| `source` | TEXT | NOT NULL, INDEXED | Logische Herkunft, z. B. `pihole`, `knx-bus`, `backup-job` |
| `text` | TEXT | NOT NULL | Nachrichtentext |
| `metadata` | TEXT (JSON) | NULL | Optionale Zusatzfelder, z. B. `{"host":"…","code":42}` |
| `webhook_id` | TEXT | NULL, INDEXED | Referenz auf empfangenden Webhook |

**Indizes:**
- `idx_messages_timestamp_desc` auf `timestamp DESC` (Hauptzugriff)
- `idx_messages_severity_timestamp` auf `(severity, timestamp DESC)`
- `idx_messages_source_timestamp` auf `(source, timestamp DESC)`

### 2.2 Tabelle `webhook_configs`

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INTEGER PK | Interne ID |
| `name` | TEXT UNIQUE | Anzeigename, z. B. „Pi-hole Alerts" |
| `webhook_id` | TEXT UNIQUE | Von HA generierte Webhook-ID (URL-Pfad-Bestandteil) |
| `default_severity` | TEXT | Fallback, wenn Payload kein Severity-Feld liefert |
| `default_source` | TEXT | Fallback für `source` |
| `field_map_json` | TEXT | JSONPath-Mapping (siehe §4.2) |
| `enabled` | INTEGER (0/1) | Soft-Deaktivierung möglich |
| `created_at` | TEXT | ISO-Timestamp |

---

## 3. Verzeichnisstruktur der Integration

```
custom_components/messagehub/
├── __init__.py              # async_setup_entry, Services, Lifecycle
├── manifest.json            # Domain, Version, Dependencies
├── const.py                 # Konstanten (DOMAIN, SEVERITIES, …)
├── config_flow.py           # UI-basierte Konfiguration
├── storage.py               # SQLite-Wrapper (aiosqlite)
├── webhook.py               # Webhook-Handler-Registrierung
├── api.py                   # HTTP-Endpoints für Panel (REST)
├── services.yaml            # Service-Definitionen
├── sensor.py                # Sensor-Plattform (Counter etc.)
├── translations/
│   ├── de.json
│   └── en.json
└── frontend/
    ├── messagehub-panel.js  # Custom Panel (Lit/Vanilla)
    └── dist/                # Build-Output, falls TS/Bundler
```

---

## 4. Webhook-Konzept

### 4.1 Registrierung

Jeder konfigurierte Webhook erhält über HA's `webhook`-Komponente eine eigene URL nach dem Schema:

```
POST https://<ha-host>/api/webhook/<webhook_id>
```

`<webhook_id>` ist eine zufällige, schwer zu erratende ID (z. B. 32 Zeichen Base32). Sie ersetzt die Authentifizierung — der HA-Standard für Webhooks.

### 4.2 Field-Mapping

Damit beliebige Payload-Strukturen verarbeitet werden können, definiert jeder Webhook ein Mapping:

```json
{
  "severity": "$.level",
  "source": "$.app.name",
  "text": "$.message",
  "timestamp": "$.ts",
  "metadata": "$.extra"
}
```

- JSONPath-Ausdrücke (z. B. via `jsonpath-ng`)
- Felder, die im Mapping fehlen, fallen auf die Defaults zurück
- `severity` wird auf das interne Schema gemappt (Mapping-Tabelle, z. B. `ERR` → `error`, `5` → `error`); unbekannte Werte → `info`
- `timestamp` ist optional; ohne Wert wird `now(UTC)` gesetzt
- Plain-Text-Bodies (kein JSON) werden vollständig in `text` übernommen, alle anderen Felder = Defaults

### 4.3 Validierung & Limits

- Body-Limit: 64 KB (konfigurierbar)
- Rate-Limit pro Webhook: 60 req/min (konfigurierbar)
- Bei Validierungsfehler → HTTP 400, Eintrag mit `severity=error`, `source=messagehub.internal` zur Selbstdiagnose

---

## 5. Services (für Automationen & manuelles Anlegen)

Definiert in `services.yaml`:

```yaml
add_message:
  name: Nachricht hinzufügen
  description: Fügt manuell eine Nachricht ein
  fields:
    severity:
      selector:
        select:
          options: [debug, info, warning, error]
    source:
      selector: { text: }
    text:
      selector: { text: { multiline: true } }
    metadata:
      selector: { object: }

delete_messages:
  name: Nachrichten löschen
  description: Löscht Nachrichten nach Filter
  fields:
    older_than_days: { selector: { number: { min: 0, max: 3650 } } }
    severity: { selector: { select: { multiple: true, options: [...] } } }
    source: { selector: { text: } }

purge_all:
  name: Datenbank leeren
  description: Löscht ALLE Nachrichten (irreversibel)
```

---

## 6. REST-API für das Panel

Eingebunden über `homeassistant.components.http.HomeAssistantView`. Auth via HA-Token (automatisch, da innerhalb HA).

| Methode | Endpoint | Zweck |
|---|---|---|
| `GET` | `/api/messagehub/messages` | Liste mit Filter & Pagination |
| `GET` | `/api/messagehub/messages/{id}` | Einzelne Nachricht (Detail) |
| `DELETE` | `/api/messagehub/messages/{id}` | Einzeln löschen |
| `POST` | `/api/messagehub/messages` | Manuell anlegen (entspricht Service) |
| `GET` | `/api/messagehub/sources` | Distinct-Liste der `source`-Werte (für Filter-Dropdown) |
| `GET` | `/api/messagehub/stats` | Counts pro Severity, letzte 24h |
| `GET` | `/api/messagehub/webhooks` | Liste der konfigurierten Webhooks |

### Query-Parameter für `GET /messages`

```
?limit=100               (default 100, max 1000)
&offset=0
&severity=error,warning  (CSV)
&source=pihole           (exakter Match, optional auch Wildcard *pihole*)
&search=DNS              (Volltext in text)
&from=2026-05-01T00:00Z
&to=2026-05-01T23:59Z
&order=desc              (default: timestamp desc)
```

---

## 7. Frontend-Panel

**Technik:** Vanilla Web Component oder Lit (kein React — passt nicht zu HA-Frontend-Konventionen).

**Registrierung:** über `panel_custom` mit eigenem Sidebar-Icon (`mdi:message-alert`).

### 7.1 Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Messages                                  [Refresh] [Settings] │
├────────────────────────────────────────────────────────────────┤
│ ┌──Filter──────────────────────────────────────────────────┐  │
│ │ Severity: [×Error] [×Warning] [ Info ] [ Debug ]         │  │
│ │ Source:   [▼ Alle Quellen]    Volltext: [           ]    │  │
│ │ Zeitraum: [▼ Letzte 24h]      Limit:    [100  ▼]         │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──Tabelle (virtualisiert)─────────────────────────────────┐  │
│ │ ⚠ │ 14:32:01 │ pihole       │ Upstream DNS unreachable…  │  │
│ │ ⓘ │ 14:31:55 │ knx-bus      │ Telegramm an 1/2/3 ok      │  │
│ │ ✕ │ 14:30:12 │ backup-job   │ Borg failed: SSH timeout   │  │
│ │ … │ …        │ …            │ …                          │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ Anzeige: 100 von 4.732 │ [⤓ Export CSV] [🗑 Filter löschen]  │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 Verhalten

- **Default-Ansicht:** letzte 100 Nachrichten, sortiert nach `timestamp DESC`, kein Filter aktiv.
- **Filter sind UND-verknüpft.** Severity-Filter ist Multi-Select (Toggle-Chips), Source ist Dropdown mit Distinct-Werten, Volltext ist Substring-Suche auf `text`, Zeitraum ist Preset-Dropdown (Letzte Stunde, 24h, 7 Tage, Custom-Range).
- **Live-Update:** WebSocket-Subscription auf `messagehub_message_added` Event; neue Nachrichten erscheinen oben mit kurzer Highlight-Animation, sofern sie zum aktiven Filter passen.
- **Detail-Pane:** Klick auf Zeile öffnet Side-Panel mit Volltext, Metadata-JSON, Webhook-Quelle, Lösch-Button.
- **Persistenz der Filter:** im Browser-LocalStorage pro Benutzer.
- **Severity-Icons & Farben:**
  - `error` → ✕ rot (`var(--error-color)`)
  - `warning` → ⚠ orange
  - `info` → ⓘ blau
  - `debug` → · grau

### 7.3 Settings-Subview

Tab im selben Panel, kein eigenes Menü:

- Liste der Webhooks mit Add/Edit/Delete (Inline-Form)
- Retention-Settings (max. Anzahl, max. Alter pro Severity)
- Datenbank-Status (Anzahl, Größe in MB, letzter Cleanup)
- Button „Datenbank exportieren" (vollständig, JSONL)

---

## 8. Sensoren (für Lovelace & Automationen)

Über die Sensor-Plattform werden zusätzlich registriert:

| Entity | Beschreibung |
|---|---|
| `sensor.messagehub_total` | Gesamtanzahl Nachrichten |
| `sensor.messagehub_errors_24h` | Anzahl `error` in letzten 24h |
| `sensor.messagehub_warnings_24h` | Anzahl `warning` in letzten 24h |
| `binary_sensor.messagehub_has_unacknowledged_errors` | `on`, wenn `error` in letzten 24h existiert |
| `sensor.messagehub_last_message` | State = letzte Nachricht (gekürzt), Attribute = volles Objekt |

So lassen sich z. B. Automationen bauen: „Push-Notification bei jedem neuen `error`".

---

## 9. Events (HA-Eventbus)

| Event | Trigger |
|---|---|
| `messagehub_message_added` | Bei jedem neuen Eintrag, Payload = vollständige Message |
| `messagehub_message_deleted` | Bei Löschung |
| `messagehub_threshold_exceeded` | Wenn z. B. > N Errors / Minute (konfigurierbar) |

Damit kann man HA-Automationen direkt auf Nachrichten reagieren lassen, ohne den Webhook-Pfad zu duplizieren.

---

## 10. Retention & Cleanup

- **Konfigurierbar pro Severity:**
  - `debug`: 7 Tage Default
  - `info`: 30 Tage
  - `warning`: 90 Tage
  - `error`: 365 Tage
- **Hard-Cap:** maximal N Nachrichten gesamt (Default 100.000), älteste werden zuerst gelöscht
- **Cleanup-Job:** täglich 03:30 lokal via HA-Scheduler (`async_track_time_change`)
- **Vacuum:** wöchentlich `VACUUM` auf SQLite-Datei

---

## 11. Konfiguration (Config-Flow)

UI-getrieben über `config_flow.py`:

1. **Erstinstallation:** keine Pflichtfelder, nur Bestätigung. DB wird angelegt.
2. **Options-Flow:** Retention-Settings, globale Limits, Logging-Level der Integration selbst.
3. **Webhooks** werden *nicht* im Config-Flow verwaltet, sondern direkt im Panel-Settings-Tab — das passt besser zum Bedienfluss.

---

## 12. Sicherheit & Datenschutz

- Webhooks haben keine Klartext-URLs in Logs
- Body-Truncation bei sehr großen Payloads, um DoS-Resistenz zu erhöhen
- Rate-Limit pro Webhook (Token-Bucket)
- Panel-Zugriff nur für HA-Admins (über `panel_custom` `require_admin: true` konfigurierbar — empfehlenswert)
- DSGVO-Hinweis: Nachrichten können personenbezogene Daten enthalten (z. B. IPs aus Pi-hole-Logs). Retention-Defaults sollten nicht zu lang sein. Export für Auskunftsrecht ist über die JSONL-Export-Funktion abgedeckt.

---

## 13. Phasen-Plan für die Implementierung

**Status:** Alle 12 Phasen abgeschlossen — siehe `CHANGELOG.md`
für die released Iterationen.

Sequenziell, jede Phase abgeschlossen testbar:

| Phase | Inhalt | Artefakt |
|---|---|---|
| **1** | Skelett: `manifest.json`, `__init__.py`, leerer Config-Flow, Domain registrieren | Integration installierbar, erscheint in „Geräte & Dienste" |
| **2** | SQLite-Storage-Layer mit Schema-Migration, Unit-Tests | `storage.py` mit CRUD-Tests |
| **3** | Service `add_message`, Eventbus-Event, erste Sensoren | Manuell anlegbar, in Logbook sichtbar |
| **4** | Webhook-Handler ohne Mapping (Hardcoded-Felder) | Erste Nachrichten per cURL einliefern |
| **5** | Field-Mapping per JSONPath, Webhook-Verwaltung in DB | Mehrere Webhooks parallel |
| **6** | REST-API für Panel | Endpoints per Postman testbar |
| **7** | Frontend-Panel: Tabelle + Filter + Pagination (Default-Ansicht) | Sidebar-Panel funktional |
| **8** | Live-Update via WebSocket-Subscription | Neue Nachrichten erscheinen ohne Reload |
| **9** | Detail-Pane, Lösch-Funktion, Export | Vollständige Bedienbarkeit |
| **10** | Settings-Subview, Webhook-CRUD im Panel | Self-Service |
| **11** | Retention-Job, Vacuum, Threshold-Events | Production-ready |
| **12** | Translations DE/EN, README, HACS-Konformität (`hacs.json`) | Veröffentlichbar |

---

## 14. Optionale Erweiterungen — Status

Alle ehemals als "Erweiterung" geplanten Features sind released.
Konkrete Iterationen + Versionen siehe `CHANGELOG.md`. Highlights:

- **Acknowledge-Lifecycle** `new → acknowledged → resolved` (v0.2)
- **Severity-Eskalation** (`processing/escalation.py`, v0.2)
- **Notifications-Channels** (Telegram/Pushover/ntfy/Slack) mit
  Channel-CRUD-UI und Test-Knopf (v0.2 - v0.14)
- **Korrelations-IDs** (`trace_id`-Spalte + Auto-Gruppierung, v0.3)
- **Volltextsuche** via SQLite FTS5 (v0.3)
- **MQTT-Eingang** (`listeners/mqtt.py` + Topic-Mapping, v0.3)
- **KNX-Bus-Analyse** Tab mit Anti-Pattern-Detection,
  Anomaly-Score, Bursts, Stille-Alarme, Trend, Heatmap,
  GA-Werteverlauf-Export (v0.11 - v0.14)
- **Saved Filters** serverseitig (Iter 92 / v0.14)
- **Prometheus** `/metrics`-Endpoint (Iter 69 / v0.14)
- **Auto-Remediation-Hooks** (v0.7+)

---

## 15. Beispiel-Webhook-Aufruf (Pi-hole-Adapter)

Pi-hole selbst kann keine Webhooks, also entweder Skript via Cron oder Lua-Block in dnsmasq. Beispiel-Skript:

```bash
#!/bin/bash
HA_URL="https://homeassistant.local"
HOOK_ID="abc123def456..."
LEVEL="warning"

curl -X POST "$HA_URL/api/webhook/$HOOK_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"level\": \"$LEVEL\",
    \"app\": {\"name\": \"pihole\"},
    \"message\": \"Blocklist-Update fehlgeschlagen: $1\",
    \"ts\": \"$(date -u +%FT%TZ)\",
    \"extra\": {\"host\": \"$(hostname)\"}
  }"
```

---

## 16. `manifest.json`

Aktueller Stand siehe `custom_components/messagehub/manifest.json`.
Wichtige Felder:
- `version`: bei jedem Release in `manifest.json` und Git-Tag
  synchron halten (Workflow `release.yml` validiert das).
- `loggers`: deklariert `custom_components.messagehub`,
  `aiosqlite`, `jsonpath_ng` — sonst taucht die Integration im HA-
  Log-Filter (Einstellungen → System → Protokolle) nicht auf.
- `dependencies`: `http`, `webhook`, `frontend`, `websocket_api` —
  benoetigt fuer das Custom-Panel + Webhook-Eingang.
- `config_flow: true`, `iot_class: local_push`,
  `integration_type: service`.

---

## 17. Test-Strategie

- **Unit-Tests** für Storage-Layer (in-memory SQLite), Field-Mapping, Severity-Normalisierung
- **Integrations-Tests** mit `pytest-homeassistant-custom-component`: Config-Flow, Service-Calls, Webhook-Empfang, Event-Firing
- **Frontend:** kein Unit-Test, dafür manuelle Test-Charts (Filter-Matrix)
- **Lasttest:** 10.000 Nachrichten/Stunde über 24h, Verifikation Retention & DB-Größe

---

**Ende des Konzepts.**
