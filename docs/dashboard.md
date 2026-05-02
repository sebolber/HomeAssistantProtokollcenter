# Lovelace-Dashboard-Vorlagen

Drei Wege, die `messagehub`-Sensoren in Dashboards zu nutzen — vom
Ein-Klick-Import bis zum hand-konfigurierten Layout.

## Schnellstart: „Zu Dashboard hinzufügen" (HA-Standard)

Seit v0.8.1 sind alle Sensoren als ein **Gerät** gruppiert. Damit
funktioniert der HA-Standard-Workflow wie auf dem Screenshot von z. B.
Forecast.Solar:

1. **Settings → Geräte & Dienste → Message Hub**
2. Auf **„1 Gerät"** klicken → Geräte-Detail-Seite öffnet sich
3. Im Block **Sensoren** rechts steht **„Zu Dashboard hinzufügen"**
4. Dashboard und View wählen → HA fügt einen vertikalen Stack mit
   **allen Entitäten** ein

Das ist der schnellste Weg. Du kannst die Cards danach individuell
anpassen oder komplett ersetzen.

## Manuell: vorgefertigtes Dashboard zum Copy-Paste

Wer ein gepoltertes Layout will (KPI-Reihe, Gauges, Conditional-Banner,
Trend-Graph), kopiert die YAML-Vorlage unten in eine neue View.

## Verfügbare Entitäten

| Entity-ID | Was | State-Class |
|---|---|---|
| `sensor.messagehub_total_messages` | Gesamtzahl aller Nachrichten | `total` |
| `sensor.messagehub_errors_total` | Errors all-time | `total` |
| `sensor.messagehub_warnings_total` | Warnings all-time | `total` |
| `sensor.messagehub_info_total` | Info all-time | `total` |
| `sensor.messagehub_debug_total` | Debug all-time | `total` |
| `sensor.messagehub_errors_last_24h` | Errors letzte 24 h | `measurement` |
| `sensor.messagehub_warnings_last_24h` | Warnings letzte 24 h | `measurement` |
| `sensor.messagehub_messages_last_1h` | Alle Nachrichten letzte 1 h | `measurement` |
| `sensor.messagehub_messages_last_7d` | Alle Nachrichten letzte 7 Tage | `measurement` |
| `sensor.messagehub_worst_source_health` | Schlechtester Health-Score (0–100 %) | `measurement` |
| `sensor.messagehub_last_message` | Text der letzten Nachricht (truncated) + Attribute | — |
| `binary_sensor.messagehub_has_unacknowledged_errors` | `on` solange unbestätigte Errors existieren | — |

> **Hinweis:** Die exakten Entity-IDs hängen von der `entry_id` der
> Integration ab. HA-Standard ist `sensor.<friendly_name>` mit
> Slug-ifizierung — bei mehrfacher Installation hängt HA `_2`, `_3` an.
> Im Beispiel unten gehe ich von der Standard-Single-Installation aus.

## Komplettes Dashboard-Beispiel

Datei `dashboard.yaml`, oder direkt in eine bestehende Lovelace-View
einkopieren:

```yaml
title: Message Hub
icon: mdi:message-alert
panel: false
cards:

  # --- KPI-Reihe ---
  - type: glance
    title: Live-Status
    columns: 4
    state_color: false
    entities:
      - entity: sensor.messagehub_messages_last_1h
        name: Letzte 1 h
        icon: mdi:clock-fast
      - entity: sensor.messagehub_errors_last_24h
        name: Errors 24 h
        icon: mdi:alert-circle
      - entity: sensor.messagehub_warnings_last_24h
        name: Warnings 24 h
        icon: mdi:alert
      - entity: sensor.messagehub_total_messages
        name: Gesamt
        icon: mdi:database

  # --- Severity-Verteilung als 4 Mini-Cards ---
  - type: horizontal-stack
    cards:
      - type: entity
        entity: sensor.messagehub_errors_total
        name: Errors
        icon: mdi:close-circle
        state_color: false
      - type: entity
        entity: sensor.messagehub_warnings_total
        name: Warnings
        icon: mdi:alert
      - type: entity
        entity: sensor.messagehub_info_total
        name: Info
        icon: mdi:information-outline
      - type: entity
        entity: sensor.messagehub_debug_total
        name: Debug
        icon: mdi:bug-outline

  # --- Health-Gauge ---
  - type: gauge
    entity: sensor.messagehub_worst_source_health
    name: Worst-Source-Health
    min: 0
    max: 100
    severity:
      green: 80
      yellow: 50
      red: 0

  # --- Letzte Nachricht groß ---
  - type: entity
    entity: sensor.messagehub_last_message
    name: Letzte Nachricht
    icon: mdi:message-text-outline
    state_color: false

  # --- Bedingt: Banner wenn unbestätigte Errors existieren ---
  - type: conditional
    conditions:
      - entity: binary_sensor.messagehub_has_unacknowledged_errors
        state: "on"
    card:
      type: markdown
      content: >
        ⚠ **Es gibt unbestätigte Errors.**
        [Im Panel ansehen](/messagehub)

  # --- 24h-Trend als Mini-Graph ---
  - type: history-graph
    title: Trend 7 Tage
    hours_to_show: 168
    refresh_interval: 60
    entities:
      - sensor.messagehub_errors_last_24h
      - sensor.messagehub_warnings_last_24h
      - sensor.messagehub_messages_last_1h
```

## Einzelne Karten — als Bausteine

### Severity-Anteil als Stacked-Bar

Lovelace hat keine native Stacked-Bar — am einfachsten via [Mushroom-Cards](https://github.com/piitaya/lovelace-mushroom)
oder [Bar-Card](https://github.com/custom-cards/bar-card) (HACS-Frontend
beide installierbar). Pure-HA-Variante:

```yaml
type: vertical-stack
cards:
  - type: entities
    title: Severity-Verteilung
    entities:
      - type: custom:bar-card    # falls bar-card installiert
        entities:
          - entity: sensor.messagehub_errors_total
            color: "#db4437"
          - entity: sensor.messagehub_warnings_total
            color: "#f59e0b"
          - entity: sensor.messagehub_info_total
            color: "#03a9f4"
          - entity: sensor.messagehub_debug_total
            color: "#6b7280"
```

### Nur Errors mit Attention-Highlight

```yaml
type: gauge
entity: sensor.messagehub_errors_last_24h
name: Errors 24 h
min: 0
max: 20
severity:
  green: 0
  yellow: 3
  red: 10
```

### Mini-Graph mit Trend-Linie (Custom-Card)

Mit [mini-graph-card](https://github.com/kalkih/mini-graph-card) (HACS):

```yaml
type: custom:mini-graph-card
name: Errors-Trend
entities:
  - sensor.messagehub_errors_last_24h
  - sensor.messagehub_warnings_last_24h
hours_to_show: 168
points_per_hour: 1
line_width: 2
show:
  fill: fade
  legend: true
```

### Letzte Nachricht mit allen Attributen

```yaml
type: entities
title: Aktuell
entities:
  - entity: sensor.messagehub_last_message
    name: Text
  - type: attribute
    entity: sensor.messagehub_last_message
    attribute: severity
    name: Severity
  - type: attribute
    entity: sensor.messagehub_last_message
    attribute: source
    name: Quelle
  - type: attribute
    entity: sensor.messagehub_last_message
    attribute: timestamp
    name: Zeit
```

### Source-Health-Map (alle Quellen)

Die `source_scores`-Attribute sind ein Mapping aller Sources auf ihre
Health-Scores. Mit einem `template`-Sensor lässt sich das in eine
Tabelle gießen:

```yaml
template:
  - sensor:
      - name: messagehub_source_count
        state: "{{ state_attr('sensor.messagehub_worst_source_health',
                              'source_scores') | count }}"
      - name: messagehub_worst_source
        state: "{{ state_attr('sensor.messagehub_worst_source_health',
                              'worst_source') }}"
```

Dann in Lovelace:

```yaml
type: entities
title: Source-Health
entities:
  - sensor.messagehub_worst_source_health
  - sensor.messagehub_source_count
  - sensor.messagehub_worst_source
```

## Tipps

- **State-Class `total`** auf den All-Time-Sensoren bedeutet: HA legt sie
  automatisch in der Statistik-Datenbank ab. Du kannst sie damit in
  History-Graphen verwenden, ohne dass HA sie als zurücksetzbare Counter
  interpretiert.
- **Live-Updates ohne 5-Min-Polling:** Alle Sensoren lauschen auf das
  Event `messagehub_message_added` und aktualisieren sich sofort, wenn
  eine neue Nachricht reinkommt. Der 5-Min-Tick ist nur Sicherheitsnetz.
- **Performance:** Die Sensoren cachen nichts — jeder Update macht eine
  `SELECT COUNT(*)`. Das ist auf normalen DBs (<100 k Rows) unproblematisch.
- **Eigene Templates** für spezielle Cuts (z. B. „Errors letzte 1 h" oder
  „nur Source `pihole`") direkt in HA als Template-Sensoren bauen — die
  Roh-Daten kommen aus dem REST-Endpoint
  `/api/messagehub/messages?severity=error&from=...`.
