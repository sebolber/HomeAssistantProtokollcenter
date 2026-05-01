# Iteration-Audit messagehub v0.1.0

Stand: nach Commit `0900ffb`. Diese Datei dokumentiert pro Iteration was 100 % in Production-Qualität ist, was als Library-Code vorhanden aber nicht verdrahtet ist, und was komplett fehlt.

## Legende

- ✅ vollständig + im Live-Pfad aktiv
- 🟡 Backend/Library da, aber nicht in `async_setup_entry` verdrahtet (Feature inert)
- 🟠 Backend da, UI-Stub
- ❌ nicht implementiert

## Phase A — Foundation & Storage (1–7)

| # | Inhalt | Status | Bemerkung |
|---|---|---|---|
| 1 | Repo-Bootstrap | ✅ | |
| 2 | SQLite-Storage | ✅ | |
| 3 | Models & Validierung | ✅ | |
| 4 | Message-Repository CRUD | ✅ | |
| 5 | Service `add_message` + Eventbus | ✅ | |
| 6 | Counter-Sensoren | ✅ | |
| 7 | Config-Flow + Options | ✅ | OptionsUpdateListener fehlt (Review #5) |

## Phase B — Webhook-Eingang (8–12)

| # | Inhalt | Status |
|---|---|---|
| 8 | Webhook-Handler | ✅ |
| 9 | Webhook-Configs in DB + dynamische Registrierung | ✅ |
| 10 | JSONPath-Field-Mapping | ✅ |
| 11 | Rate-Limiting + Body-Limits + Self-Diagnose | ✅ |
| 12 | Severity-Mapping pro Webhook | ✅ |

## Phase C — REST-API (13–15)

| # | Inhalt | Status |
|---|---|---|
| 13 | List + Get | ✅ |
| 14 | Filter + Pagination | ⚠️ FTS5/Count-Inkonsistenz (Review #2) |
| 15 | Delete/Sources/Stats/Webhooks | ✅ |

## Phase D — Frontend-Panel (16–21)

| # | Inhalt | Status |
|---|---|---|
| 16 | Panel-Registrierung + Build | ✅ |
| 17 | Tabelle (mit Sticky-Header-Legende) | ✅ |
| 18 | Severity-Filter | ✅ |
| 19 | Source/Volltext/Zeitraum-Filter | ✅ |
| 20 | Detail-Pane + Delete | ✅ |
| 21 | WebSocket Live-Update | ✅ |

## Phase E — Verwaltung & Lifecycle (22–25)

| # | Inhalt | Status |
|---|---|---|
| 22 | Settings-Tab Webhook-Liste | ✅ |
| 23 | Webhook Add/Edit/Delete UI | ✅ |
| 24 | Retention-Job | ✅ |
| 25 | Translations DE/EN, README, hacs.json | ✅ |

## Phase F — Dedup & Lifecycle (26–29)

| # | Inhalt | Status |
|---|---|---|
| 26 | Fingerprint | ✅ |
| 27 | Aggregation auf Insert | ⚠️ Race-Condition (Review #1) |
| 28 | Status-Lifecycle (DB) | ✅ |
| 29 | Acknowledge-UI | 🟠 set_status-Backend, aber kein Button im Detail-Pane |

## Phase G — Notifications (30–32)

| # | Inhalt | Status |
|---|---|---|
| 30 | Forwarder + Telegram | 🟡 Channel-Plugin-Pattern, kein Forwarder-Aufruf bei Insert |
| 31 | Quiet Hours + Throttling | 🟡 Logik OK, kein UI, kein Wire-up |
| 32 | Severity-Eskalation | 🟡 EscalationEngine ist da, wird nicht periodisch evaluiert |

## Phase H — Intelligenz (33–36)

| # | Inhalt | Status |
|---|---|---|
| 33 | SQLite FTS5 | ✅ (mit Inkonsistenz-Bug) |
| 34 | Korrelations-IDs | 🟡 Spalte da, keine Auto-Generierung, kein UI-Filter |
| 35 | Heartbeat-Tracking | 🟡 Repo da, kein periodischer Check, kein UI |
| 36 | Anomalie-Erkennung | 🟡 EWMA-Funktionen, keine periodische Evaluierung |

## Phase I — Mehr Eingangskanäle (37–39)

| # | Inhalt | Status |
|---|---|---|
| 37 | MQTT-Adapter | 🟡 Mapping-Funktionen, kein MQTT-Subscribe |
| 38 | HA-Eventbus-Listener | 🟡 Mapper-Funktionen, kein async_listen-Wire-up |
| 39 | Syslog-UDP | 🟡 RFC-3164-Parser, kein UDP-Server |

## Phase J — Analytics (40–42)

| # | Inhalt | Status |
|---|---|---|
| 40 | Health-Score | 🟡 Funktion da, keine dynamischen Sensoren |
| 41 | Statistik-Dashboard | ✅ KPI-Cards + Severity-Bars (Heatmap fehlt) |
| 42 | Tags & Filter Presets | 🟠 add/remove/get-Backend, kein UI-Editor |

## Phase K — Operations (43–45)

| # | Inhalt | Status |
|---|---|---|
| 43 | Runbook-Verknüpfung | 🟠 Lookup da, keine Anzeige im Detail-Pane |
| 44 | Audit-Log | 🟡 Repo da, keine API-Aufrufe schreiben rein, kein UI-Tab |
| 45 | Export & Forensik | 🟡 Library-Funktionen, kein REST-Endpoint, kein Button |

## Phase L — Reports & Auto-Remediation (46–48)

| # | Inhalt | Status |
|---|---|---|
| 46 | Wochenreport | 🟡 Generator da, kein Scheduler, kein Mail-Dispatch |
| 47 | Auto-Remediation | 🟡 Pattern-Matching, kein Service-Call, kein UI |
| 48 | KNX-Anreicherung | 🟡 Parser/Lookup da, nicht im Insert-Pfad verdrahtet |

## Plan zum Schließen der Lücken

**Round 1 — CRITICAL aus Review (heute):**
1. Race-Condition `insert_or_aggregate` → `BEGIN IMMEDIATE`/`COMMIT`
2. `list_filtered`/`count_filtered` → DRY-Refactor mit gemeinsamem Where-Builder
3. Migration 0015: Composite-Index `(severity, status)`
4. Options-Update-Listener für Retention-Job
5. Eventbus-Listener verdrahten (Iter 38)
6. KNX-Anreicherung im Insert-Pfad (Iter 48)
7. Audit-Log-Aufrufe aus API-Views (Iter 44)
8. Acknowledge-Button im Detail-Pane (Iter 29)
9. Tag-Editor im Detail-Pane (Iter 42)
10. Runbook-Anzeige im Detail-Pane (Iter 43)
11. Export-Endpoints + Button (Iter 45)
12. Audit-Log-UI als 4. Tab (Iter 44)
13. Heartbeat-Periodic-Job + UI (Iter 35)
14. Anomaly-Periodic-Evaluation (Iter 36)

**Bewusst auf v0.2 verschoben** (brauchen User-Setup, nicht über UI lösbar):
- MQTT-Adapter (Iter 37) — braucht MQTT-Broker
- Syslog-UDP-Listener (Iter 39) — Port-Binding, Sicherheits-Implikationen
- Telegram/Pushover-Wire-up (Iter 30/31) — braucht Channel-Credentials
- Wochenreport-Mail-Dispatch (Iter 46) — braucht notify.email-Konfiguration
- Remediation-Hook-Execution (Iter 47) — sicherheitskritisch, explizit pro Hook
