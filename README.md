# Message Hub für Home Assistant

<img src="assets/icon.svg" alt="Message Hub icon" width="96" align="right"/>

Zentrale Sammelstelle für strukturierte Nachrichten (Info / Warning / Error / Debug)
aus beliebigen Quellen — eingehend über Webhooks, MQTT, KNX-Bus, Eventbus, Syslog
oder den Service `messagehub.add_message`. Persistent in eigener SQLite-Datenbank,
mit eigenem Sidebar-Panel direkt in Home Assistant.

[![HACS](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz)
[![Releases](https://img.shields.io/github/v/release/sebolber/HomeAssistantProtokollcenter)](https://github.com/sebolber/HomeAssistantProtokollcenter/releases)

## Inhalt

- [Was ist Message Hub?](#was-ist-message-hub)
- [Installation](#installation)
- [Erste Schritte](#erste-schritte)
- [Konfiguration](#konfiguration)
  - [Im Panel: Webhooks](#webhooks)
  - [Im Panel: KNX-Adressen](#knx-adressen)
  - [Im Panel: MQTT-Topics](#mqtt-topics)
  - [Im Panel: Notification-Channels](#notification-channels)
  - [Im Panel: Heartbeat-Quellen](#heartbeat-quellen)
  - [Im Panel: Auto-Remediation-Hooks](#auto-remediation-hooks)
  - [Optionen (Retention / Hard-Cap / Syslog)](#optionen)
- [Nachrichten erzeugen](#nachrichten-erzeugen)
  - [Service `messagehub.add_message`](#service-messagehubadd_message)
  - [Webhook (HTTP-POST)](#webhook-http-post)
  - [MQTT](#mqtt)
  - [HA-Eventbus](#ha-eventbus)
  - [Syslog](#syslog)
  - [KNX-Bus](#knx-bus)
- [Automation-Cookbook](#automation-cookbook)
- [Sensoren für Dashboards](#sensoren-für-dashboards)
- [UI-Bedienung](#ui-bedienung)
- [Troubleshooting](#troubleshooting)
- [Update](#update)
- [Entwicklung](#entwicklung)
- [Lizenz](#lizenz)

## Was ist Message Hub?

Eine Custom-Integration, die Meldungen aus allen Ecken deines Smart-Home-Setups
einsammelt, normalisiert, dedupliziert und in einem **dedizierten Panel** mit
Filtern und Live-Updates anzeigt. Statt Telegram-Spam und 17 verschiedener
HA-Notifications hast du *eine* Inbox.

**Typische Quellen:** Pi-hole, Grafana, KNX-Stör-Bits, Backup-Skripte,
Zigbee2MQTT-Availability, Syslog von Routern, eigene Bash-Skripte, externe
Webhooks (`curl`/`wget`), Home-Assistant-Automationen.

**Was das Panel zeigt:** Live-Liste mit Severity-Pillen, relativer Zeit und
Volltextsuche · Detailansicht mit Metadaten, Tags und Status · Statistik mit
Heatmap und Top-Sources · Audit-Log aller administrativen Aktionen ·
Einstellungen für alle Eingangskanäle.

## Installation

### Via HACS (empfohlen)

1. HACS öffnen → 3-Punkte-Menü oben rechts → **„Benutzerdefinierte Repositories"**
2. URL eintragen: `https://github.com/sebolber/HomeAssistantProtokollcenter`
   · Kategorie: **„Integration"**
3. „Message Hub" erscheint in der HACS-Liste → **Herunterladen**
4. **Home Assistant neu starten**
5. **Settings → Geräte & Dienste → „+ Integration hinzufügen" → „Message Hub"**

Updates kommen über HACS automatisch, wenn neue Releases getaggt werden.

### Manuell

```bash
git clone https://github.com/sebolber/HomeAssistantProtokollcenter.git /tmp/mh
cp -r /tmp/mh/custom_components/messagehub <ha-config>/custom_components/
```

Dann HA neu starten und unter **Settings → Geräte & Dienste** hinzufügen.

## Erste Schritte

Nach der Installation:

1. **Sidebar-Eintrag „Messages"** klicken — leeres Panel erscheint.
2. Im leeren Zustand zeigt das Panel einen **„+ Test-Nachricht senden"**-Button.
   Klick → eine Demo-Message landet sofort in der Liste. Damit weißt du, dass
   das Panel und der Service-Call funktionieren.
3. Auf **Statistik** klicken — du siehst die Demo-Message in der KPI-Karte
   „Letzte 24 h" und in der Heatmap-Zelle für die aktuelle Stunde.
4. Auf **Einstellungen** klicken — leg deinen ersten echten Eingangskanal an
   (Webhook ist am einfachsten, siehe unten).

## Konfiguration

Konfiguration läuft an drei Orten:

| Was | Wo | Wann |
|---|---|---|
| Eingangskanäle (Webhooks, MQTT, KNX, Channels, Heartbeats) | **Panel → Einstellungen** | Laufzeit |
| Retention, Hard-Cap, Syslog-Port, Log-Level | **Settings → Geräte & Dienste → Message Hub → Konfigurieren** | Laufzeit |
| Datenbank-Speicherort, Zeitzone, Wartung | Automatisch, keine Aktion nötig | — |

Im Panel-Tab **Einstellungen** liegen alle Konfigurations-Bereiche in
**eigenen Sub-Tabs** (Webhooks · KNX-Bus · Channels · MQTT · Heartbeats ·
Auto-Remediation). Die KNX-Tabelle mit ihren bis zu 3000 Einträgen ist
damit von den anderen Sektionen entkoppelt — kein endloses Scrollen
mehr. Die Tab-Auswahl wird in `localStorage` gemerkt, du landest beim
nächsten Öffnen wieder im zuletzt benutzten Tab.

### Webhooks

**Wozu:** externe Quellen (Pi-hole, Grafana, Skripte, IoT) per `HTTP-POST`
einliefern lassen.

**Anlegen:**

1. Panel → Einstellungen → „**+ Webhook anlegen**"
2. Pflichtfelder:
   - **Name** — frei wählbar, nur Anzeige
   - **Default-Source** — z. B. `pihole`, `grafana`, `backup` (lowercase, max 64,
     `[a-z0-9._-]`). Kommt in jeder eingehenden Nachricht als `source`-Feld an.
   - **Default-Severity** — wird genommen, wenn der Sender keine Severity mitschickt
3. Optional: **JSONPath-Mapping** für nicht-Standard-Payloads — siehe
   [docs/configuration.md → JSONPath-Mapping](docs/configuration.md#jsonpath-mapping).
4. Speichern → die Karte zeigt die **fertige URL** mit Copy-Button.

Die URL hat das Format `https://<dein-ha-host>/api/webhook/<id>`. Kopiere sie
in den Sender (Pi-hole-Webhook, Grafana-Notifier, `curl`-Skript). Beispiel-Test:

```bash
curl -X POST https://ha.example/api/webhook/abc123 \
  -H "Content-Type: application/json" \
  -d '{"severity":"warning","text":"Manueller Test"}'
```

**Webhook nachträglich bearbeiten:** Auf der Card den Button **„✎ Bearbeiten"**
klicken — alle Felder sind editierbar inkl. JSONPath-Mapping.
**Aktivieren/Deaktivieren oder Löschen:** über das **`⋮`-Menü** rechts auf der
Card.

### KNX-Adressen

**Wozu:** KNX-Gruppenadressen-Whitelist. Nur GAs auf dieser Liste mit
`Loggen=ON` produzieren Einträge — alles andere wird ignoriert. Damit ist die
DB nicht voll von 100 Telegrammen/Sekunde.

**Voraussetzung:** Die [HA-KNX-Integration](https://www.home-assistant.io/integrations/knx/)
muss laufen (IP-Tunneling oder Routing). Sie feuert das `knx_event`, das wir
abhören.

**Schnellstart:**

1. Panel → Einstellungen → KNX-Gruppenadressen
2. **„✨ aus HA-KNX-Projekt übernehmen"** — wenn du dein ETS-Projekt in der
   KNX-Integration hochgeladen hast, importiert dieser Button alle GAs mit
   Label und DPT (zunächst alle mit Loggen=OFF, du aktivierst nachher gezielt).
3. Alternativ: GA manuell eingeben (Format `N/N/N`, z. B. `1/2/3`) — Label
   und DPT werden automatisch vorgeschlagen, wenn die GA im Projekt ist.

**Severity inline ändern:**

- In der Tabelle auf die Severity-Pille klicken → Popover mit 5 Optionen
  (`debug` / `info` / `warning` / `error` / `auto`)
- `auto` ist der Spezialfall für **Boolean-DPTs** (1.x): du wählst dann
  `severity_on_true` und `severity_on_false` — z. B. für ein Stör-Bit, das
  bei `1` als `error` und bei `0` als `info` geloggt wird

**Edit-Modal:** Stift-Icon in der Zeile — für Label, DPT und manuelle T/F-Mapping.
**Bulk:** mit der Suche filtern, dann gezielt jede Adresse togglen.

Details: [docs/configuration.md → KNX](docs/configuration.md#knx-adressen-im-detail).

### MQTT-Topics

**Wozu:** auf MQTT-Pattern abonnieren, eingehende Payloads werden zu Messages.

**Beispiel — Zigbee2MQTT-Verfügbarkeit:**

| Feld | Wert |
|---|---|
| Topic-Pattern | `zigbee2mqtt/+/availability` |
| Source | `zigbee.health` |
| Severity | `warning` |

Wildcards: `+` matcht *ein* Segment, `#` matcht den ganzen Subtree. HA-MQTT
löst das auf, wir matchen nur gegen die Whitelist.

### Notification-Channels

**Wozu:** Severity-Schwellen-basiertes Weiterleiten an Telegram, Pushover,
ntfy, Signal oder beliebige `notify.*`-Services. Mit **Quiet-Hours** (z. B. nach
22 Uhr keine Pushes außer für `error`) und **Throttling** (max. 1 Push pro
Quelle alle 5 Min).

**Konfiguration:** Panel → Einstellungen → Channels (Backend ist da, UI in
v0.5 minimal — Konfig per REST oder per `notify`-Workaround). Volle UI in v0.6.
Details: [docs/configuration.md → Channels](docs/configuration.md#notification-channels).

### Heartbeat-Quellen

**Wozu:** Erkennen, dass eine *stille* Quelle silent ist, die normalerweise alle
X Minuten was schicken sollte. Wenn der NAS sonst alle 60 Min einen
`storage_check`-Heartbeat sendet, aber 90 Min nichts kommt → Alert.

**Konfiguration:** Backend-API existiert
(`POST /api/messagehub/heartbeats`), UI-Editor folgt in v0.6.

### Auto-Remediation-Hooks

**Wozu:** Wenn eine Nachricht mit Source `X` (optional Fingerprint matcht),
HA-Automation `Y` triggern. Mit `confirm_required: true` muss der User
bestätigen, sonst läuft sie automatisch.

**Konfiguration:** Backend + minimale UI-Liste.
Details: [docs/configuration.md → Remediation](docs/configuration.md#auto-remediation).

### Optionen

Settings → Geräte & Dienste → Message Hub → **Konfigurieren**:

| Option | Default | Bedeutung |
|---|---|---|
| `retention_debug_days` | 7 | Debug-Messages älter als X Tage werden täglich gelöscht |
| `retention_info_days` | 30 | dito für Info |
| `retention_warning_days` | 90 | dito für Warning |
| `retention_error_days` | 365 | dito für Error |
| `hard_cap_total` | 100 000 | Wenn überschritten, werden älteste Messages gelöscht (FIFO) |
| `aggregation_window_minutes` | 10 | Identische Messages innerhalb dieses Fensters werden dedupliziert (Counter hochgezählt statt Duplikat) |
| `log_level` | `INFO` | DEBUG/INFO/WARNING/ERROR — schreibt in das HA-Logfile |
| `weekly_notify_service` | leer | z. B. `notify.email_admin` — bekommt jeden Sonntag den Wochenreport |
| `syslog_enabled` | false | UDP-Syslog-Listener aktivieren |
| `syslog_port` | 5514 | Port (Standard-Syslog 514 braucht Root, daher 5514 als Default) |

## Nachrichten erzeugen

Sechs Wege, je nach Quelle:

### Service `messagehub.add_message`

Aus jeder HA-Automation, jedem Skript, jedem Blueprint:

```yaml
service: messagehub.add_message
data:
  severity: error              # debug | info | warning | error
  source: heizung              # lowercase, max 64, [a-z0-9._-]
  text: "Pumpe meldet Störung"
  metadata:                    # optional, beliebiges Mapping
    raum: keller
    code: 42
```

`severity`, `source`, `text` sind Pflicht. `metadata` ist optional und beliebig.

### Webhook (HTTP-POST)

Nach dem Anlegen unter **Einstellungen → Webhooks** bekommst du eine URL.
Direkter POST:

```bash
curl -X POST https://ha.example/api/webhook/<id> \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "warning",
    "source": "pihole",
    "text": "Upstream DNS unreachable",
    "metadata": {"upstream": "1.1.1.1"}
  }'
```

Wenn der Sender ein **anderes JSON-Schema** liefert, konfiguriere
[JSONPath-Mapping](docs/configuration.md#jsonpath-mapping) im Webhook.

### MQTT

Pattern unter **Einstellungen → MQTT-Topics** anlegen. Eingehende Payloads
werden direkt zu Messages. Bei JSON-Payloads werden `severity`/`source`/`text`
aus dem Top-Level gelesen, sonst greifen die Defaults aus der Topic-Konfig.

### HA-Eventbus

Aus jeder Automation:

```yaml
event: messagehub_external
event_data:
  severity: info
  source: my_blueprint
  text: "Routine erfolgreich beendet"
```

Wir hören auf `messagehub_external` und legen daraus eine Message an.

### Syslog

Aktivieren in den Optionen (`syslog_enabled: true`, Port wählen). Der
UDP-Syslog-Listener parst RFC-3164/5424. Source wird aus dem Hostname
abgeleitet (`syslog.<hostname>`).

Beispiel auf einem Linux-Host:

```bash
logger -n ha.example -P 5514 -p user.warning "Backup nicht abgeschlossen"
```

### KNX-Bus

Voraussetzung: HA-KNX-Integration läuft, GA ist unter
**Einstellungen → KNX-Gruppenadressen** aktiv (`Loggen=ON`). Jedes Telegramm
auf dieser GA wird zur Message — Severity nach deinem Mapping.

## Automation-Cookbook

Praktische Beispiele zum Kopieren-und-Anpassen.

### 1. Generisches Logging-Script

Statt `messagehub.add_message` direkt aufzurufen, ein wiederverwendbares Skript:

```yaml
script:
  log_to_messagehub:
    alias: "Message Hub: Eintrag schreiben"
    fields:
      severity:
        description: "debug | info | warning | error"
        default: info
      source:
        description: "Quelle (lowercase)"
      text:
        description: "Nachrichtentext"
      meta:
        description: "Zusätzliche Felder als Mapping"
        default: {}
    sequence:
      - service: messagehub.add_message
        data:
          severity: "{{ severity }}"
          source: "{{ source }}"
          text: "{{ text }}"
          metadata: "{{ meta }}"
```

Aufruf:

```yaml
- service: script.log_to_messagehub
  data:
    severity: warning
    source: rolladen
    text: "Wind hat Rolladen automatisch hochgefahren"
    meta: {wind_kmh: "{{ states('sensor.wind') }}"}
```

### 2. Stör-Bit aus KNX in Message umwandeln (manuell)

Wenn du KNX nicht über die Whitelist machen willst:

```yaml
automation:
  - alias: "Heizung Störung melden"
    trigger:
      - platform: state
        entity_id: binary_sensor.heizung_stoerung
        to: "on"
    action:
      - service: messagehub.add_message
        data:
          severity: error
          source: heizung
          text: "Heizung meldet Störung"
          metadata:
            entity: "{{ trigger.entity_id }}"
            since: "{{ trigger.from_state.last_changed }}"
            value: "{{ states('sensor.heizung_temperatur') }}"
```

### 3. Externe API-Calls

```yaml
rest_command:
  notify_messagehub:
    url: "https://ha.example/api/webhook/<id>"
    method: POST
    content_type: "application/json"
    payload: >-
      {"severity": "{{ sev }}",
       "source": "external",
       "text": "{{ msg }}"}
```

Aufruf:

```yaml
- service: rest_command.notify_messagehub
  data:
    sev: info
    msg: "Backup-Job auf Server XYZ gestartet"
```

### 4. Auf Errors reagieren (Fan-out aus dem Hub)

Eine Automation, die auf jeden neuen `error` reagiert (z. B. eine LED rot
schalten oder ein Sticky-Notify auslösen):

```yaml
automation:
  - alias: "Hub-Error → Notify"
    trigger:
      - platform: event
        event_type: messagehub_message_added
        event_data:
          severity: error
    action:
      - service: notify.mobile_app_pixel
        data:
          title: "Smart-Home-Fehler"
          message: "{{ trigger.event.data.source }}: {{ trigger.event.data.text }}"
          data:
            ttl: 0
            priority: high
```

Mehr Beispiele inkl. Templating-Tricks: [docs/configuration.md → Cookbook](docs/configuration.md#automation-cookbook).

## Sensoren für Dashboards

Die Integration legt automatisch diese Entitäten an:

**All-time:**

| Entity-ID | Was |
|---|---|
| `sensor.messagehub_total_messages` | Gesamtzahl Messages in DB |
| `sensor.messagehub_errors_total` | Errors all-time |
| `sensor.messagehub_warnings_total` | Warnings all-time |
| `sensor.messagehub_info_total` | Info all-time |
| `sensor.messagehub_debug_total` | Debug all-time |

**Time-Windows:**

| Entity-ID | Was |
|---|---|
| `sensor.messagehub_messages_last_1h` | Alle Nachrichten letzte 1 h |
| `sensor.messagehub_errors_last_24h` | Errors letzte 24 h |
| `sensor.messagehub_warnings_last_24h` | Warnings letzte 24 h |
| `sensor.messagehub_messages_last_7d` | Alle Nachrichten letzte 7 Tage |

**Status / Aggregate:**

| Entity-ID | Was |
|---|---|
| `sensor.messagehub_worst_source_health` | Schlechtester Source-Health-Score (0–100 %) |
| `sensor.messagehub_last_message` | Text der letzten Message + Attribute |
| `binary_sensor.messagehub_has_unacknowledged_errors` | `on` solange unbestätigte Errors existieren |

**Fertige Dashboard-Vorlagen:** [docs/dashboard.md](docs/dashboard.md) —
KPI-Reihe, Severity-Verteilung, Health-Gauge, Trend-Graph,
Conditional-Banner, alles zum Copy-Paste in eine Lovelace-View.

Quick-Beispiel (eine Glance-Card):

```yaml
type: glance
title: Smart-Home-Status
entities:
  - entity: binary_sensor.messagehub_has_unacknowledged_errors
    name: Errors
  - entity: sensor.messagehub_errors_last_24h
    name: 24 h
  - entity: sensor.messagehub_warnings_last_24h
    name: Warnings
  - entity: sensor.messagehub_worst_source_health
    name: Health
```

## UI-Bedienung

**Nachrichten-Liste:**

- **Severity-Pille klicken** → Inline-Popover mit 4 Optionen, Severity wird
  sofort geändert
- **Zeile klicken** → Detail-Pane rechts mit Metadaten, Tags und Status
- **Volltextsuche** im Filter-Bar (debounced)
- **Quellen-Filter / Severity-Pills / Zeitraum** kombinierbar
- **Export** als JSONL oder CSV (in der Status-Bar)
- **Bulk-Löschen** über das `⋯`-Menü oben rechts

**Statistik:** KPI-Cards (Gesamt / 24 h / Errors / Warnings) · Severity-Stacked-Bar
· Top-Sources · Heatmap (Stunde × Wochentag, 30 Tage).

**Einstellungen:** Cards für Webhooks · Tabellen für KNX-Adressen, MQTT, Channels.

**Audit:** Alle administrativen Aktionen (Webhook anlegen, KNX-Severity ändern,
Bulk-Delete) sind unveränderlich protokolliert. Suche und expandierbare Details.

## Troubleshooting

| Symptom | Ursache | Fix |
|---|---|---|
| Sidebar zeigt „Messages" nicht | HA-Restart fehlt | Settings → System → Neu starten |
| Panel zeigt altes Design nach Update | Browser-Cache | Cmd/Strg+Shift+R im HA-Frontend |
| KNX-Telegramme erscheinen nicht | KNX-Integration läuft nicht / GA nicht aktiv | KNX-Setup prüfen, GA in Liste auf `Loggen=ON` setzen |
| Webhook gibt 401 zurück | Webhook-ID falsch oder webhook deaktiviert | URL aus Card kopieren, Status auf „Aktiv" |
| Datenbank wächst zu schnell | Retention-Defaults zu hoch oder kein Hard-Cap | Optionen anpassen (siehe oben) |
| MQTT-Pattern matcht nicht | HA-MQTT nicht konfiguriert oder Topic-String falsch | HA-MQTT-Integration prüfen, Pattern mit `mosquitto_sub` testen |
| Heatmap leer obwohl Daten da | Zeitzone-Problem? | DB-Timestamps sind UTC, Heatmap ist Local-Time. Prüfe HA-Zeitzone |

Wenn das nicht hilft: Issue eröffnen mit Output von **Settings → System → Logs**
gefiltert auf `messagehub`.

## Update

Über **HACS:** Update-Banner erscheint, wenn ein neuer Tag im Repo liegt.
Klick → Download → HA-Restart → Browser-Hard-Refresh.

Migrationen laufen automatisch beim Setup. Datenbank-Schema-Versionen werden
in der `schema_version`-Tabelle getrackt — Downgrades sind nicht unterstützt.

## Entwicklung

Beiträge willkommen. Setup:

```bash
git clone https://github.com/sebolber/HomeAssistantProtokollcenter.git
cd HomeAssistantProtokollcenter
bash scripts/start.sh -y          # Dependencies + dev-HA-Container
pytest                             # Backend-Tests
cd frontend && npm install && npm test   # Frontend-Tests
npm run build                      # Bundle bauen (committed)
```

Architektur-Spec siehe [docs/messagehub_konzept.md](docs/messagehub_konzept.md).
TDD-Workflow, Quality Gates und Code-Stil-Regeln: [CLAUDE.md](CLAUDE.md).
Setup-Details: [DEVELOPMENT.md](DEVELOPMENT.md).

### SonarCloud-Setup (für Maintainer)

Das Repo enthält [`sonar-project.properties`](sonar-project.properties) mit
Excludes für `frontend_dist/` (gebauter Vite-Output → sonst hunderte
False-Positives) und Pfad-bezogenen Regel-Ignorierungen für Tests.

Damit Sonar die Properties auch wirklich liest, in SonarCloud:

1. **Project → Administration → Analysis Method** → von „Automatic Analysis"
   auf **„CI-based"** umstellen
2. Im CI (GitHub Action) den `sonar-scanner` aufrufen, der die Properties
   automatisch aus dem Repo-Root liest

Solange „Automatic Analysis" aktiv bleibt, ignoriert Sonar die Properties-
Datei und meldet die Bundle-Findings weiter. Das ist die wahrscheinlichste
Ursache, falls trotz commited Properties der Bundle-Lärm bestehen bleibt.

## Lizenz

MIT — siehe [LICENSE](LICENSE).
