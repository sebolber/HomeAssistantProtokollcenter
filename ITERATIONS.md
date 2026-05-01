# Iterations Tracker

Status der Iterationen aus `claude-code-runbook.md` §6.

## Phase A — Foundation & Storage
- [x] Iteration 1 — Repo-Bootstrap
- [x] Iteration 2 — SQLite-Storage-Schicht
- [x] Iteration 3 — Models & Validierung
- [x] Iteration 4 — Message-Repository (CRUD)
- [x] Iteration 5 — Service add_message + Eventbus
- [x] Iteration 6 — Sensoren (Counter)
- [x] Iteration 7 — Config-Flow (Erstinstallation + Options)

## Phase B — Webhook-Eingang
- [x] Iteration 8 — Webhook-Handler-Skelett
- [x] Iteration 9 — Webhook-Konfiguration in DB
- [x] Iteration 10 — JSONPath-Field-Mapping
- [x] Iteration 11 — Rate-Limiting & Body-Limits
- [x] Iteration 12 — Severity-Mapping-Tabelle

## Phase C — REST-API
- [x] Iteration 13 — Endpoints list und get
- [x] Iteration 14 — Filter & Pagination
- [x] Iteration 15 — Endpoints delete, sources, stats, webhooks

## Phase D — Frontend-Panel
- [x] Iteration 16 — Panel-Registrierung & Build-Pipeline
- [x] Iteration 17 — Tabellen-Komponente
- [x] Iteration 18 — Severity-Filter
- [x] Iteration 19 — Source-/Volltext-/Zeitraum-Filter
- [x] Iteration 20 — Detail-Pane + Loesch-Funktion
- [x] Iteration 21 — WebSocket-Subscription Live-Update

## Phase E — Verwaltung & Lifecycle
- [x] Iteration 22 — Settings-Tab Webhook-Liste
- [x] Iteration 23 — Webhook Add/Edit/Delete UI
- [x] Iteration 24 — Retention-Job
- [x] Iteration 25 — Translations DE/EN, README, hacs.json

## Phase F — Erweiterungen Lifecycle & Dedup
- [x] Iteration 26 — Deduplizierung Fingerprint
- [x] Iteration 27 — Aggregation auf Insert
- [x] Iteration 28 — Status-Lifecycle
- [x] Iteration 29 — Acknowledge-UI

## Phase G — Notifications
- [x] Iteration 30 — Forwarder + Telegram
- [x] Iteration 31 — Quiet Hours + Throttling
- [x] Iteration 32 — Severity-Eskalation

## Phase H — Intelligenz
- [ ] Iteration 33 — SQLite FTS5
- [ ] Iteration 34 — Korrelations-IDs
- [ ] Iteration 35 — Heartbeat-Tracking
- [ ] Iteration 36 — Anomalie-Erkennung

## Phase I — Mehr Eingangskanaele
- [ ] Iteration 37 — MQTT-Adapter
- [ ] Iteration 38 — HA-Eventbus-Listener
- [ ] Iteration 39 — Syslog-UDP-Listener

## Phase J — Analytics & Tagging
- [ ] Iteration 40 — Health-Score
- [ ] Iteration 41 — Statistik-Dashboard
- [ ] Iteration 42 — Tags & Saved Filter Presets

## Phase K — Operations
- [ ] Iteration 43 — Runbook-Verknuepfung
- [ ] Iteration 44 — Audit-Log
- [ ] Iteration 45 — Export & Forensik-Bundle

## Phase L — Reports & Auto-Remediation
- [ ] Iteration 46 — Wochenreport per Mail
- [ ] Iteration 47 — Auto-Remediation-Hooks
- [ ] Iteration 48 — KNX-Anreicherung & Final Polish
