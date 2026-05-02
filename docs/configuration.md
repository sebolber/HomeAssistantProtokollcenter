# Konfiguration im Detail

Detail-Referenz zur [README](../README.md). Hier finden sich die Tiefen-Themen:
JSONPath-Mapping für Webhooks, KNX-Severity-Mapping, Channel-Konfigurationen
pro Typ, Auto-Remediation, Heartbeats und mehr.

## Inhalt

- [JSONPath-Mapping](#jsonpath-mapping)
- [KNX-Adressen im Detail](#knx-adressen-im-detail)
- [Notification-Channels](#notification-channels)
- [Heartbeat-Quellen](#heartbeat-quellen)
- [Auto-Remediation](#auto-remediation)
- [Tags und Korrelations-IDs](#tags-und-korrelations-ids)
- [Automation-Cookbook](#automation-cookbook)
- [REST-API-Übersicht](#rest-api-übersicht)
- [Eventbus](#eventbus)

## JSONPath-Mapping

**Wozu:** Externe Sender liefern oft nicht das Standard-Format
(`{severity, source, text, metadata}`), sondern haben eigene Schemas wie
Grafana-Alerts oder Pi-hole-Notifications. Mit JSONPath kannst du jedes
Eingangs-JSON auf unsere Standardfelder mappen.

**Standard-Schema (ohne Mapping):**

```json
{
  "severity": "warning",
  "source": "pihole",
  "text": "Upstream DNS unreachable",
  "metadata": {"host": "pi.hole"}
}
```

**Beispiel: Grafana-Alert** liefert von Haus aus etwa:

```json
{
  "ruleName": "High Memory Usage",
  "state": "alerting",
  "message": "Memory > 90% for 5m",
  "evalMatches": [{"value": 92, "metric": "mem"}],
  "ruleUrl": "https://grafana.example/dashboard/abc"
}
```

Mapping im Webhook konfigurieren:

```json
{
  "severity": "$.state",
  "source": "$.ruleName",
  "text": "$.message",
  "metadata": "$.evalMatches"
}
```

Der Severity-Mapper kennt synonyme Wörter — `alerting` → `error`,
`paused` → `info`, `ok` → `info`, `critical` → `error` etc. (Liste in
`processing/field_mapping.py`).

**Beispiel: Pi-hole** liefert pro Webhook ein Array — verschachtelt:

```json
{
  "level": "warning",
  "app": {"name": "pihole-FTL"},
  "message": "DNSSEC validation failed",
  "extra": {"queries": 17, "domain": "test.local"}
}
```

Mapping:

```json
{
  "severity": "$.level",
  "source": "$.app.name",
  "text": "$.message",
  "metadata": "$.extra"
}
```

**Tips:**

- Pfade beginnen mit `$.` (Wurzel)
- Array-Index: `$.alerts[0].title`
- Verschachtelt: `$.outer.inner.value`
- Wenn ein Pfad nicht matcht, fallen wir auf den **Webhook-Default**
  zurück (Default-Source und Default-Severity aus der Konfig)
- Fehlt das `text`-Feld: wir nehmen `JSON.stringify(payload)` als
  Fallback, damit nichts verloren geht

## KNX-Adressen im Detail

### Severity-Mapping „auto"

Für Boolean-DPTs (DPT 1.x — Stör-Bits, Schaltzustände) ist die naheliegende
Frage: gleiche Severity für `true` und `false`? Meist nicht.

Beispiel: Stör-Bit einer Heizungspumpe.
- `true` (Pumpe meldet Störung) → Severity `error`
- `false` (Störung weg) → Severity `info`

Konfiguration:

| Feld | Wert |
|---|---|
| Severity | `auto` |
| `severity_on_true` | `error` |
| `severity_on_false` | `info` |

Die Inline-Pille im Panel öffnet ein Popover, mit dem du `auto` setzen
kannst — Defaults sind dann `warning` (true) und `info` (false). Für
abweichende Werte den Edit-Modal (✎) öffnen.

### ETS-CSV-Import

Wenn dein ETS-Projekt nicht als `.knxproj` in der HA-Integration liegt,
kannst du eine CSV exportieren und über **„📂 ETS-CSV importieren"**
einlesen. Erwartetes Format (UTF-8, Komma- oder Semikolon-getrennt):

```csv
GA;Name;DPT
1/0/0;Wohnzimmer Licht schalten;1.001
1/0/1;Wohnzimmer Licht Status;1.001
2/0/0;Heizung Pumpe Stoerung;1.005
```

Spalten-Reihenfolge: GA, Name, DPT. Erste Zeile darf Header sein, wir
erkennen das automatisch.

## Notification-Channels

Channels leiten neue Messages oberhalb einer Severity-Schwelle an externe
Notifier weiter. Backend-Forwarder ist da; UI-Editor im Panel folgt in
v0.6 — vorerst per REST-API konfigurieren.

### Telegram

```json
{
  "name": "Family Telegram",
  "channel_type": "telegram",
  "enabled": true,
  "severity_threshold": "warning",
  "quiet_start": "22:00",
  "quiet_end": "07:00",
  "quiet_bypass_error": true,
  "throttle_seconds": 300,
  "config": {
    "bot_token": "1234:abcdef...",
    "chat_id": "-100123456"
  }
}
```

POST: `POST /api/messagehub/channels` (admin-only).

### Pushover

```json
{
  "name": "iPhone Pushover",
  "channel_type": "pushover",
  "config": {
    "user_key": "u...",
    "app_token": "a...",
    "device": "iphone"
  }
}
```

`device` ist optional — leer = alle Geräte des Pushover-Users.

### ntfy

```json
{
  "name": "Self-hosted ntfy",
  "channel_type": "ntfy",
  "config": {
    "url": "https://ntfy.example.com",
    "topic": "smart-home-alerts",
    "token": "tk_..."
  }
}
```

`token` ist optional, nur für geschützte Server.

### Native HA-Notify

```json
{
  "name": "via mobile_app",
  "channel_type": "notify",
  "config": {
    "service": "notify.mobile_app_pixel"
  }
}
```

Damit kannst du jeden bestehenden HA-Notify-Service als Sink nutzen.

### Quiet Hours / Throttling

- `quiet_start` / `quiet_end` — Zeitfenster im 24-h-Format. Während
  dieser Zeit werden Messages **gequeued**, nicht weitergeleitet.
- `quiet_bypass_error: true` — Errors ignorieren das Quiet-Fenster und
  pushen trotzdem (Standard für `error`).
- `throttle_seconds` — minimaler Abstand zwischen Pushes pro
  `(channel, source)`-Kombination. Bei Burst von 50 identischen Errors
  in 1 min bekommst du nicht 50 Pushes, sondern einen aggregierten alle
  N Sekunden.

## Heartbeat-Quellen

Erkennt **stille Quellen**, die normalerweise regelmäßig schicken aber
plötzlich aufhören.

```json
{
  "source": "nas.storage_check",
  "expected_interval_seconds": 3600,
  "enabled": true
}
```

POST: `POST /api/messagehub/heartbeats`.

Backend-Job läuft alle 60 s. Wenn `now - last_seen > expected_interval * 1.5`,
wird automatisch eine Message erzeugt:

```
severity: warning
source: messagehub.heartbeat
text: "Source 'nas.storage_check' silent for 95 min (expected every 60 min)"
metadata: {silent_since: "...", expected_interval: 3600}
```

Sobald der Heartbeat wiederkommt, wird automatisch eine `info`-Message
„recovered" generiert.

## Auto-Remediation

```json
{
  "name": "Restart Pi-hole on DNS-failure",
  "source_pattern": "pihole",
  "fingerprint": null,
  "automation_id": "automation.restart_pihole",
  "confirm_required": false,
  "enabled": true
}
```

POST: `POST /api/messagehub/remediation-hooks`.

**Felder:**

- `source_pattern` — exakter Source-String oder Regex
- `fingerprint` — optional, dann triggert nur die exakt gleiche Message-
  Signatur (Source + normalisierter Text)
- `automation_id` — ID einer existierenden HA-Automation, die mit
  `automation.trigger` aufgerufen wird
- `confirm_required: true` — Hub legt **statt** des sofortigen Triggers
  einen Vorschlag in der Detail-Pane an, der vom User bestätigt werden muss

## Tags und Korrelations-IDs

**Tags:** beliebige Strings pro Message zum Gruppieren — z. B. `urgent`,
`maintenance`, `false-positive`.

```bash
curl -X POST https://ha.example/api/messagehub/messages/42/tags \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tag": "urgent"}'
```

**Korrelations-IDs:** wenn ein einzelnes Ereignis mehrere Messages
auslöst (z. B. „Server abgestürzt" → KNX-Stör-Bit, Syslog-Crash,
Heartbeat-Stille), kannst du sie über `metadata.correlation_id`
verknüpfen. Im Detail-Pane werden alle Messages mit gleicher
`correlation_id` als „verwandte Ereignisse" angezeigt.

## Automation-Cookbook

### Eigene Severity-Logik mit Templates

```yaml
- service: messagehub.add_message
  data:
    severity: >-
      {% set t = states('sensor.heizung_temperatur') | float %}
      {% if t < 5 %}error
      {% elif t < 10 %}warning
      {% else %}info{% endif %}
    source: heizung
    text: "Vorlauftemperatur {{ states('sensor.heizung_temperatur') }} °C"
```

### Periodischer Health-Check

```yaml
automation:
  - alias: "Daily backup health"
    trigger:
      - platform: time
        at: "23:30:00"
    action:
      - service: messagehub.add_message
        data:
          severity: >-
            {% if states('sensor.last_backup_age_hours') | int > 30 %}
              error
            {% else %}
              info
            {% endif %}
          source: backup.daily
          text: >-
            Last backup {{ states('sensor.last_backup_age_hours') }} h ago
          metadata:
            backup_size: "{{ states('sensor.last_backup_size_mb') }}"
```

### Bestätigte Errors silent halten

Wenn ein Error im Panel auf `acknowledged` gesetzt wurde, signalisiert
das **„User weiß Bescheid"**. Die Channels und Auto-Remediation-Hooks
respektieren das — keine erneute Notification, kein zweites Restart-
Skript-Trigger, bis der Status wieder auf `new` gesetzt oder die Message
gelöscht wird.

## REST-API-Übersicht

Alle Endpunkte erfordern Admin-Auth (`Authorization: Bearer <long-lived-token>`).

| Method | Pfad | Was |
|---|---|---|
| `GET` | `/api/messagehub/messages` | Liste mit Filter/Pagination |
| `GET` | `/api/messagehub/messages/{id}` | Einzelne Message |
| `DELETE` | `/api/messagehub/messages/{id}` | Löschen |
| `POST` | `/api/messagehub/messages/{id}/status` | Status setzen (new/acknowledged/resolved) |
| `POST` | `/api/messagehub/messages/{id}/severity` | Severity ändern |
| `GET`/`POST`/`DELETE` | `/api/messagehub/messages/{id}/tags` | Tag-Verwaltung |
| `GET` | `/api/messagehub/sources` | Distinct-Sources-Liste |
| `GET` | `/api/messagehub/stats` | Total + Severity-Counts (24 h) |
| `GET` | `/api/messagehub/stats-extended` | Heatmap, Top-Sources |
| `GET`/`POST` | `/api/messagehub/webhooks` | Webhooks-Liste / Anlegen |
| `GET`/`PUT`/`DELETE` | `/api/messagehub/webhooks/{id}` | Webhook-Detail |
| `GET`/`POST` | `/api/messagehub/knx-addresses` | KNX-Adressen / Anlegen / CSV-Import |
| `PUT`/`DELETE` | `/api/messagehub/knx-addresses/{ga}` | Adresse aktualisieren / löschen |
| `GET` | `/api/messagehub/knx-discovery` | GAs aus HA-KNX-Projekt |
| `GET`/`POST`/`PUT`/`DELETE` | `/api/messagehub/channels` | Notification-Channels |
| `POST` | `/api/messagehub/channels/{id}/test` | Test-Push |
| `GET`/`POST`/`PUT`/`DELETE` | `/api/messagehub/mqtt-topics` | MQTT-Subscriptions |
| `GET`/`POST`/`PUT`/`DELETE` | `/api/messagehub/remediation-hooks` | Auto-Remediation |
| `POST` | `/api/messagehub/heartbeats` | Heartbeat-Quellen |
| `GET` | `/api/messagehub/audit` | Audit-Log |
| `GET` | `/api/messagehub/export` | Export (JSONL/CSV) |
| `GET` | `/api/messagehub/runbook/{source}` | Runbook lesen |

## Eventbus

Die Integration feuert eigene HA-Events, auf die Automationen reagieren
können:

| Event | Wann | Daten |
|---|---|---|
| `messagehub_message_added` | Nach jedem Insert | komplettes Message-DTO |
| `messagehub_message_deleted` | Nach Delete (auch bulk) | `{id}` oder `{bulk: true, count}` |
| `messagehub_threshold_exceeded` | Wenn Source mehr als N Errors in M Min produziert | `{source, severity, count, window}` |

Beispiel:

```yaml
automation:
  - alias: "Error-Burst → SMS"
    trigger:
      - platform: event
        event_type: messagehub_threshold_exceeded
    condition:
      - condition: template
        value_template: "{{ trigger.event.data.severity == 'error' }}"
    action:
      - service: notify.sms
        data:
          message: >-
            {{ trigger.event.data.source }}: 
            {{ trigger.event.data.count }} Errors in
            {{ trigger.event.data.window }} min
```
