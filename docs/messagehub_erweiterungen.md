# Erweiterungen für `messagehub`

Ergänzend zum Basis-Konzept (`messagehub_konzept.md`) sammelt dieses Dokument alle sinnvollen Erweiterungen, die aus einer reinen Sammelstelle ein operativ wertvolles Werkzeug machen. Sortiert nach Wirkung pro Aufwand.

Diese Erweiterungen werden im `claude-code-runbook.md` ab Phase F (Iteration 26) in konkrete Implementierungs-Iterationen überführt.

---

## 1. Hoher Nutzen, moderater Aufwand

### 1.1 Deduplizierung & Aggregation

**Problem:** Eine wiederholt feuernde Quelle (z. B. KNX-Bus mit „Telegramm-Loss" 200× in 3 Minuten) erzeugt 200 identische Zeilen. Echte Eskalationen verschwinden im Rauschen.

**Lösung:** Fingerprint aus `source + severity + normalisierter Text` (Zahlen via Regex `\d+` → `N`, UUIDs → `UUID`, IPs → `IP`). Bei Duplikat innerhalb eines Zeitfensters: kein neuer Insert, sondern Counter-Increment am bestehenden Eintrag. Spalten `count`, `first_seen`, `last_seen`. Alte Einträge werden nicht mehr aggregiert, sobald sie als `resolved` markiert sind.

**Ergebnis:** Eine Zeile mit `count: 200`, klar als „aktive Welle" erkennbar.

### 1.2 Acknowledge & Status-Lifecycle

**Problem:** Ohne Status-Mechanismus wird das System nach drei Wochen ignoriert — alles ist „immer noch da".

**Lösung:** Jede Nachricht hat einen Status: `new` → `acknowledged` → `resolved`, plus auto-Übergang `new` → `expired` nach Retention-Alter. Default-Filter im Dashboard: „nur unbestätigte Errors".

### 1.3 Severity-Eskalation per Pattern

**Lösung:** Konfigurierbare Regeln: „Wenn ≥ N Nachrichten mit `severity=error` und gleicher `source` innerhalb T Minuten → erzeuge zusammenfassende Nachricht `severity=critical` mit `source=messagehub.escalation`". Cooldown verhindert Doppel-Eskalationen.

### 1.4 Smart Notifications mit Quiet Hours & Throttling

**Problem:** Ohne Stellschrauben werden Push-Notifications zur Spam-Quelle und werden abgeschaltet.

**Lösung:** Forwarder zu Telegram/Pushover/ntfy/Signal mit drei verbindlichen Stellschrauben pro Channel:
- Severity-Schwellwert (z. B. nur ab `warning`)
- Quiet Hours (z. B. 22:00–07:00, mit Bypass für `error`)
- Throttling: max. 1 Push pro `source` pro 10 min

### 1.5 Korrelations-IDs & Trace-Gruppen

**Problem:** Logs sind isolierte Zeilen statt zusammenhängender Vorgänge.

**Lösung:** Eingehende Nachrichten können `trace_id` mitliefern. Wenn nicht: Auto-Generierung aus zeitlich-örtlicher Nähe (Hash aus `source + Zeitfenster`). Im UI: Detail-Pane zeigt verknüpfte Nachrichten der gleichen Trace-Gruppe — „Backup-Lauf 14:30 — 1 Start, 3 Warnings, 1 Fehler, 1 Recovery". Macht aus Logfile eine Story.

### 1.6 Volltextsuche via SQLite FTS5

**Lösung:** Schatten-Tabelle `messages_fts` mit Trigger-basiertem Sync (insert/update/delete). Substituiert `LIKE %dns%` durch eine echte Suche mit BM25-Ranking. Trivial in der Umsetzung, sehr nützlich beim Troubleshooting.

---

## 2. Hoher Nutzen, höherer Aufwand

### 2.1 Anomalie-Erkennung auf Frequenzen

**Lösung:** Pro Source rollender Exponential Weighted Moving Average (EWMA) der Nachrichtenrate. Bei aktueller Rate > 3σ über Mittel → Meta-Nachricht „Source X sendet 50× mehr als üblich". State persistiert in eigener Tabelle, übersteht Restarts. Kein ML, einfache Statistik.

**Ergebnis:** Erkennt Probleme, bevor sie als Fehler bemerkt werden.

### 2.2 Recurring-Pattern-Erkennung (optional)

**Lösung:** Rule-Mining auf Timestamps der dedupedten Fingerprints. „Dieser Fehler tritt jeden Montag um 03:15 auf" → deutet auf Cronjob. Aufwändig, daher als Wochen-Report.

### 2.3 Health-Score pro Source

**Lösung:** Rollierender Score 0–100 pro `source`, berechnet aus Severity-Gewichtung × Frequenz × Recency-Decay. Im Dashboard farbcodiert. Du siehst auf einen Blick, *welches* Subsystem Pflege braucht. Konzeptionell vergleichbar mit HAGHS (Home Assistant Global Health Score), aber quellbezogen.

### 2.4 Runbook-Verknüpfung

**Lösung:** Pro Source/Pattern eine Markdown-Notiz hinterlegbar: „Wenn `knx-bus: telegramm-loss` → 1. Buslast prüfen, 2. Linienkoppler-Status, …". Im Detail-Pane direkt eingeblendet.

**Ergebnis:** Spart bei jedem Vorfall echte Zeit. Bewährtes Pattern aus Incident-Workflows.

### 2.5 Automatische Remediation-Hooks

**Lösung:** Bei spezifischen Pattern wird eine HA-Automation getriggert: „Bei `unifi-ap: client-disconnect-storm` → starte AP neu". Riskant, daher per Default nur als Vorschlag im UI („Aktion ausführen?"). Echtes Auto-Remediation explizit pro Regel mit `confirm_required: false` freischaltbar. Audit-Eintrag bei jeder Ausführung.

---

## 3. Domain-spezifisch (KNX & Smart Home)

### 3.1 Geräte-Heartbeat-Tracking

**Problem:** Defekte Geräte schreien selten — sie verstummen. Stille Ausfälle sind das größte ungelöste Problem im Smart-Home-Monitoring.

**Lösung:** Pro `source` ein erwartetes Heartbeat-Intervall (z. B. KNX-Aktor sendet stündlich Status). Wenn Intervall × 1.5 überschritten wird → automatisch generierte Nachricht `severity=warning`, `source=messagehub.heartbeat`. Alert-Status setzt sich zurück, sobald Quelle wieder sendet.

### 3.2 KNX-Telegramm-Anreicherung

**Lösung:** Bei `source=knx-bus` Gruppenadresse aus `text` parsen (Regex `\d+/\d+/\d+`) und gegen ETS-Projekt-Daten anreichern. Lookup-Quelle: `<config>/messagehub/knx_groupaddresses.csv`, periodisch aus ETS exportiert. Anreicherung in `metadata.knx_label`.

**Ergebnis:** Aus „1/2/3" wird „Wohnzimmer Deckenlicht" — Logs werden erst lesbar.

### 3.3 Geo-Kontext für externe Nachrichten (optional)

**Lösung:** Bei IPs in Pi-hole-Logs automatisch ASN/Land via lokaler MaxMind-DB anreichern. Hilft beim Erkennen von Mustern.

---

## 4. Operational

### 4.1 Export & Forensik-Bundle

**Lösung:** Export endet nicht bei JSONL/CSV.
- Tägliches DB-Snapshot in vorhandenes Backup-Volume
- Import-Funktion (Migration, Wiederherstellung)
- Forensik-Bundle: ZIP mit Filter-Ergebnis + DB-Dump + Konfiguration für Support-Anfragen

### 4.2 Ingestion-Adapter jenseits von Webhooks

**Webhooks decken 80 % ab.** Restliche 20 % sind kritisch:
- **MQTT-Listener** mit Topic→Source-Mapping (Wildcards `+/#`)
- **Syslog-Listener** UDP auf Port 5514 (nicht 514 wegen Privilegien), RFC-3164-Parser
- **Polling-Adapter:** HTTP-Endpoint regelmäßig abfragen (z. B. Pi-hole API)
- **HA-Eventbus-Listener:** `logbook_entry`, `system_log_event`, `state_changed` mit `unavailable`-Filter

**Begründung:** Die meisten Quellen sprechen *kein* Webhook. Erst durch zusätzliche Adapter wird `messagehub` wirklich zur zentralen Stelle.

### 4.3 Tags & Workspaces

**Lösung:** Nachrichten taggbar (`#urlaub`, `#wartung`). Filter-Presets speicherbar pro Benutzer.

### 4.4 Audit-Log der Integration selbst

**Lösung:** Eigene Tabelle `audit_log`: wer hat wann welche Nachricht gelöscht, welchen Webhook angelegt, welche Retention geändert. Nicht in `messages` mischen. Kein Update-Endpoint — Audit-Einträge sind unveränderlich.

---

## 5. Analyse-Layer

### 5.1 Statistik-Dashboard (separat vom Stream)

**Lösung:** Eigener Tab im Panel. Heatmap (Stunde × Wochentag), Top-10-Sources, Severity-Verteilung über Zeit, MTTR pro Source (Zeit zwischen `error` und `resolved`).

**Ergebnis:** Read-only, aber liefert die Argumente, *welches* Subsystem als nächstes anzupacken ist.

### 5.2 Wochen-/Monatsreport per E-Mail

**Lösung:** Auto-generiert sonntags 23:00. „Letzte Woche: 12 Errors, davon 8 in Source X, mittlere Resolution-Zeit 4h. Empfehlung: prüfe Source X."

**Ergebnis:** Das Tool erzieht den Operator, statt umgekehrt.

---

## 6. Priorisierung für die Implementierung

Reihenfolge nach Wert pro Aufwand:

1. **Deduplizierung + Acknowledge-Lifecycle** — beides zusammen, weil sie sich gegenseitig bedingen. Macht das Tool alltagstauglich.
2. **Heartbeat-Tracking + Anomalie-Erkennung** — adressiert das fundamentale Problem stiller Ausfälle.
3. **Smart Notifications** mit Quiet Hours + Throttling — sonst wird Push nicht genutzt.
4. **MQTT- und Eventbus-Ingestion** — vervielfacht die Quellen ohne neue Skripte.
5. **Korrelations-Gruppen + Runbook-Links** — Schritt vom Reagieren zum Verstehen.

Alles andere (Geo-Anreicherung, Pattern-Mining, Reports) lohnt erst nach 2–3 Monaten Betrieb mit echten Daten.

---

## 7. Mapping auf Runbook-Iterationen

| Erweiterung | Iteration im Runbook |
|---|---|
| 1.1 Deduplizierung | 26 + 27 |
| 1.2 Status-Lifecycle | 28 + 29 |
| 1.3 Eskalation | 32 |
| 1.4 Smart Notifications | 30 + 31 |
| 1.5 Trace-Gruppen | 34 |
| 1.6 FTS5 | 33 |
| 2.1 Anomalie-Erkennung | 36 |
| 2.3 Health-Score | 40 |
| 2.4 Runbook-Verknüpfung | 43 |
| 2.5 Auto-Remediation | 47 |
| 3.1 Heartbeat | 35 |
| 3.2 KNX-Anreicherung | 48 |
| 4.1 Export & Forensik | 45 |
| 4.2 MQTT / Eventbus / Syslog | 37 + 38 + 39 |
| 4.3 Tags & Presets | 42 |
| 4.4 Audit-Log | 44 |
| 5.1 Stats-Dashboard | 41 |
| 5.2 Wochenreport | 46 |

Nicht aufgenommen (Backlog für v0.2):
- 2.2 Recurring-Pattern-Erkennung
- 3.3 Geo-Kontext via MaxMind
