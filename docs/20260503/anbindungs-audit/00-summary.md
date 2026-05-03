# Anbindungs-Audit — Summary

**Stand:** 2026-05-03
**Branch:** `claude/audit-frontend-integration-38eoO`
**Methodik:** Statisches Audit aller UseCases (Backend) gegen alle UI-Pfade (Frontend). Code-Lese-Beweise, ergänzt durch Playwright-Test-Skelette.

---

## Quick-Stats

| Metrik | Wert |
|---|---:|
| **Backend REST-Endpoints (View-Klassen)** | 57 URLs / 71 HTTP-Methoden |
| **Backend HA-Services** | 1 (`messagehub.add_message`) |
| **Backend HA-Webhooks** | dynamisch (n aus DB) |
| **Backend HA-Events** | 2 |
| **Backend HA-Entitäten** | 12 (11 Sensor + 1 BinarySensor) |
| **Frontend Custom Elements** | 22 |
| **Frontend ApiClient-Methoden** | 74 |
| **Anbindungs-Quote (UI-erreichbar)** | **88,6 % (70 / 79 Endpoints)** |
| **Echte Fehlanbindungen** | **3** (F-001, F-002, F-004) |
| **Tote Endpoint-/Code-Pfade** | **3** (F-003, F-007, F-008) |
| **Fehlende Lifecycle-Funktionen (Backend+Frontend)** | **2** (F-005, F-006) |
| **Sonstige Findings** | **3** (F-009 Manifest-Hygiene, F-010 Deep-Link, F-011 Test-Coverage) |
| **Total Findings** | **12** (3 hoch · 3 mittel · 6 niedrig) |
| **Quick-Wins (≤ 30 min)** | **7** |

---

## Top-10 kritische Findings (priorisiert)

| Rang | ID | Titel | Schweregrad | Aufwand |
|---|---|---|---|---|
| 1 | **F-001** | Channel-Test-Knopf fehlt — Notification-Konfig kann nicht verifiziert werden | hoch | S |
| 2 | **F-002** | MQTT-Topic-Edit fehlt — User muss „Löschen + Neu" simulieren | hoch | S |
| 3 | **F-004** | Findings-Ack zurücknehmen unmöglich (UI-Knopf fehlt, Code-Methode da) | mittel | S |
| 4 | **F-005** | Heartbeats können nicht gelöscht/deaktiviert werden | mittel | M |
| 5 | **F-006** | Auto-Remediation-Hooks können nicht editiert/getoggelt werden | mittel | M |
| 6 | **F-003** | MTTR-Endpoint dupliziert / ungenutzt | niedrig | S |
| 7 | **F-008** | Message-Single-GET ungenutzt — Detail-Refresh holt ganze Liste | niedrig | S |
| 8 | **F-009** | `websocket_api`-Dependency tot in Manifest | niedrig | S |
| 9 | **F-011** | KNX-GA-Export-URL ohne typisierten Helfer + Test | niedrig | S |
| 10 | **F-010** | Sub-Tabs (Settings/Stats) ohne Deep-Link | niedrig | M |

> F-007 (Webhook-Single-GET) und F-012 (Channel-Verifikation) sind im Detail-Dokument, aber redundant zu F-008 / F-001.

---

## Quick-Wins (≤ 30 min Aufwand)

Die folgenden 7 Findings sind in jeweils ≤ 30 min umsetzbar und sollten als erste Iteration ausgewählt werden:

| Finding | Beschreibung | Code-Stellen |
|---|---|---|
| F-001 | Channel-Test-Knopf | api-client.ts (+ Methode), components/channels-view.ts (+ Button) |
| F-002 | MQTT-Topic-Edit | api-client.ts (+ Methode), components/simple-list-view.ts (+ Edit-Modus für MqttTopicsView) |
| F-004 | Findings-Unack-Knopf | components/findings-view.ts (+ Button für acked Findings) |
| F-003 | MTTR-Entscheidung (Löschen oder UI) | 1 Code-Block: api/messages.py + async_register_views |
| F-007 | Webhook-Single-GET-Entscheidung | dito |
| F-008 | Message-Single-GET-Entscheidung | dito + Detail-Pane-Refresh-Strategie |
| F-011 | KNX-GA-Export-URL-Helfer | api-client.ts + Vitest-Test |

---

## Empfohlene Sprint-Reihenfolge

### Sprint 1 (Iter +1) — UI-Lücken schließen
- **F-001 + F-002 + F-004** zusammen (S+S+S = ~90 min)
- 3 Vitest-Tests + 3 Playwright-Tests (`test.fixme → test`)
- 1 Backend-Test pro Fix (smoke)
- CHANGELOG-Eintrag mit Audit-ID

### Sprint 2 (Iter +2) — Lifecycle vervollständigen
- **F-005 (Heartbeat)** + **F-006 (Remediation)** parallel (M+M)
- Backend: jeweils ein neuer DELETE/PUT-Endpoint + Repository-Methode
- Frontend: Action-Spalte in `simple-list-view.ts` für beide Komponenten

### Sprint 3 (Iter +3) — Code-Hygiene
- **F-003, F-007, F-008, F-009, F-011** als Sammel-PR
- Tote Endpoints löschen ODER bewusst dokumentieren
- Manifest aufräumen
- Helfer-Funktionen + Tests

### Sprint 4 (Iter +4, optional) — UX
- **F-010** Deep-Link-Routing für alle Sub-Tabs

---

## Was war NICHT zu beanstanden (positive Erkenntnisse)

1. ✅ **Saubere Schichten-Trennung:** Kein direkter `fetch()`-Call außerhalb des `ApiClient`. Alle 21 Komponenten gehen über die zentrale Klasse.
2. ✅ **0 broken contracts:** Jede ApiClient-Methode zeigt auf einen existierenden Backend-Endpoint. Keine 404er programmatisch erzeugt.
3. ✅ **Webhook-/Service-Patterns korrekt:** `messagehub.add_message`-Service ist sowohl im UI (Testnachricht) als auch über HA-Standard erreichbar — Best-Practice.
4. ✅ **HA-Konventionen eingehalten:** Custom Elements + `panel_custom`-Registrierung + Static-Path-Cache-Buster + Lazy-Imports — alles HA-idiomatisch.
5. ✅ **Saved-Filters als CRUD-Beispiel-Implementierung:** vollständig und konsistent (E038-E040, M51-M53).
6. ✅ **Cross-Tab-Navigation via Hash:** `#findings?source=…` aus Source-Detail-Pane → Findings-Tab funktioniert (stats-view.ts:71-85).
7. ✅ **Audit-Trail durchgängig:** alle CRUD-Endpoints loggen via `_audit(...)`.

---

## Audit-Output: Verzeichnisstruktur

```
docs/20260503/anbindungs-audit/
├── 00-summary.md            (dieses Dokument)
├── 01-backend-inventar.md   (57 Endpoints + 1 Service + 12 Entitäten + Webhook + Events)
├── 02-frontend-inventar.md  (22 Custom Elements + 74 ApiClient-Methoden + Navigation)
├── 03-mapping-matrix.md     (Status pro Endpoint: ✅/❌/🟡/⚠️/🔵)
├── 04-e2e-walkthrough.md    (Statisches Walkthrough pro Tab)
└── 05-findings.md           (12 Findings mit Fix + Akzeptanzkriterium)

e2e/audit/
├── README.md                (Setup-Anleitung)
├── package.json
├── playwright.config.ts
├── 00-smoke.spec.ts         (Panel + Top-Tabs)
├── 01-messages-tab.spec.ts  (Filter, Detail-Pane, Saved-Filter)
├── 02-stats-tab.spec.ts     (Sub-Tabs + Hash-Routing)
├── 03-settings-tab.spec.ts  (6 Sub-Tabs + 4× test.fixme für F-001/F-002/F-005/F-006)
├── 04-audit-tab.spec.ts     (Audit + 1× test.fixme für F-004)
└── fixtures/
    └── api-mock.ts          (Mock für Offline-Tests)
```

> **Status der Playwright-Tests:** Vorbereitet, **nicht ausgeführt** (Audit-Sandbox hat keinen Docker-Daemon und kein Browser-Bundle installiert). Für Live-Validierung siehe `e2e/audit/README.md`.

---

## Constraints & Caveats

1. **Keine Live-Tests:** Statisches Audit auf Code-Basis. Manuelle Re-Verifikation sollte nach Sprint 1 erfolgen.
2. **Kein Lasttest / Performance:** Audit fokussiert auf Funktionserreichbarkeit, nicht auf Performance.
3. **Auth-Modell vereinfacht:** Alle Views haben `RequireAdminView`. Es gibt keine differenzierten Rollen — Audit prüft daher nur die Admin-Sicht.
4. **i18n nicht im Scope:** Übersetzungen (`translations/de.json`, `en.json`) wurden nicht auf Vollständigkeit geprüft.
5. **Backend-WebSocket: 0 Commands:** F-009 ist eher Manifest-Hygiene als funktionaler Bug.

---

## Nächster Schritt für den Maintainer

1. Diesen Summary lesen (du bist hier).
2. Sprint 1 (F-001, F-002, F-004) als nächste Iteration einplanen — alle drei sind S-Aufwand und schließen die wichtigsten UI-Lücken.
3. Playwright-Setup laufen lassen (`docker-compose up -d` + Token + `npx playwright install`), um die Test-Skelette gegen Live-HA zu verifizieren — als Baseline VOR Sprint 1.
4. Pro Fix die zugehörige `test.fixme` in `e2e/audit/` aktivieren — Pipeline schlägt rot, sobald die Lücke noch offen ist.
