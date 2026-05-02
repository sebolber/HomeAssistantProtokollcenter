# Automatische Updates

Standardmäßig läuft das Update-Verfahren so:

1. Du setzt einen neuen `vX.Y.Z`-Tag auf GitHub.
2. HACS erkennt das automatisch beim nächsten Polling-Zyklus
   (Default: ~24 h, in HACS → Einstellungen anpassbar bis runter auf 1 h).
3. Du klickst **Update** in HACS und startest HA neu.
4. Das neue Bundle wird durch den Cache-Buster automatisch im Browser
   geladen.

Wer Schritt 3 ebenfalls automatisieren will, hat zwei Optionen.

## Variante A: HACS-Auto-Update-Service

HACS hat selbst eine Auto-Update-Funktion. Aktivierung:

1. **HACS** → Integration „Message Hub" öffnen
2. Drei-Punkte-Menü → **Information**
3. Beim Tab **Settings** den Schalter **„Automatic update"** aktivieren

HACS lädt dann das neue Repo bei jedem neuen Tag automatisch ins
`custom_components/`-Verzeichnis. **Aber**: ein HA-Restart ist trotzdem
nötig, damit der Code aktiv wird. Den musst du selbst auslösen oder
ebenfalls automatisieren.

## Variante B: HA-Automation mit Auto-Restart

Vollständige Pipeline: HACS sieht Update → installiert → HA startet
neu, alles ohne Klick. **Vorsicht:** ein HA-Restart bricht für 30–90 s
alle laufenden Automationen, Voice-Assistenten und Webhooks. Mache das
nur, wenn du dir sicher bist, dass das in deiner Setup-Reife OK ist.

```yaml
automation:
  - alias: "Auto-Update: Message Hub"
    description: >
      Installiert HACS-Updates der Message-Hub-Integration in der Nacht
      und startet HA automatisch neu.
    trigger:
      # Tagesfenster — nur in der Nacht, wenn niemand das Smart-Home aktiv nutzt
      - platform: time
        at: "03:30:00"
    condition:
      # Nur wenn ein Update verfuegbar ist
      - condition: state
        entity_id: update.message_hub_update
        state: "on"
    action:
      - service: messagehub.add_message
        data:
          severity: info
          source: messagehub.self
          text: "Auto-Update wird installiert"
      - service: update.install
        target:
          entity_id: update.message_hub_update
      - delay: "00:00:30"
      # Variante 1 — HA komplett neu starten:
      - service: homeassistant.restart
      # Variante 2 — sanfter, lädt nur die Integration neu (geht nicht
      # immer, je nach HA-Version):
      # - service: homeassistant.reload_config_entry
      #   data:
      #     entry_id: <deine_config_entry_id>
```

Die `entity_id` der Update-Entity kann je nach HA-Version variieren —
schau in **Entwicklerwerkzeuge → Zustände** nach `update.*messagehub*`.

## Variante C: Nur informieren, nicht installieren

Wenn du Updates **bemerken** willst, aber selbst entscheiden, **wann**
du installierst:

```yaml
automation:
  - alias: "Notify: Message-Hub-Update verfuegbar"
    trigger:
      - platform: state
        entity_id: update.message_hub_update
        to: "on"
    action:
      - service: notify.mobile_app_pixel    # oder beliebiger notify-Service
        data:
          title: "Message Hub Update"
          message: >-
            Neue Version {{ state_attr('update.message_hub_update',
            'latest_version') }} ist da.
            Aktuell: {{ state_attr('update.message_hub_update',
            'installed_version') }}.
          data:
            url: "/hacs"
```

## Was du **nicht** automatisieren musst

- **Browser-Bundle-Refresh.** Der Cache-Buster `?v=<mtime>` an der Panel-
  module_url ändert sich bei jedem Bundle-Rebuild. Sobald das neue
  Bundle nach dem Update auf der HA-Maschine liegt und HA neu gestartet
  ist, lädt jeder Browser das neue Bundle automatisch — kein hartes
  `Cmd+Shift+R` nötig.
- **DB-Schema-Migrationen.** Beim Setup läuft `MigrationRunner` mit
  Schema-Versionierung. Beim Update auf eine neue Version werden
  fehlende Migrationen einmalig durchgespielt; danach läuft alles weiter.
- **Frontend-Bundle-Build.** HACS zieht den committeten
  `frontend_dist/messagehub-panel.js`-Output mit. Es gibt kein
  npm-install / build auf dem User-Host.

## Was du **manuell** tun musst

- **Den Tag setzen** auf GitHub. Das ist die einzige Aktion, die nicht
  automatisierbar ist (außer durch Conventional-Commits + GitHub
  Actions auf dem Maintainer-Repo). Aktuell: GitHub-Web-UI →
  *Releases → Draft a new release* → Tag eintippen → Publish.
