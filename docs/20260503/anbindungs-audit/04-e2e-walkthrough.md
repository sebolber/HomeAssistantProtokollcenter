# Phase 4 — E2E-Walkthrough (User-Perspektive)

**Stand:** 2026-05-03
**Methodik:** Statisches Walkthrough auf Basis Phase 1-3, ergänzt durch Playwright-Test-Skelette unter `e2e/audit/`.

---

## 4.0 Ausführungs-Constraint

In dieser Audit-Sandbox steht **keine laufende Home-Assistant-Instanz** zur Verfügung:
- Docker-Daemon ist nicht erreichbar (`/var/run/docker.sock` fehlt) — `docker-compose -f docker-compose.dev.yml up` schlägt fehl.
- Headless-Browser (Playwright Chromium-Bundle) ist nicht installiert (nur die Playwright-Library selbst).

**Konsequenz:** Die in `e2e/audit/` erzeugten Tests sind **vorbereitet, aber nicht ausgeführt**. Sie laufen sofort in einer Umgebung mit:
1. `docker-compose -f docker-compose.dev.yml up` (HA auf `http://localhost:8124`)
2. `npx playwright install chromium`
3. Long-Lived-Access-Token in `.env` als `HA_TOKEN`.

Das tabellarische Walkthrough unten ist **statisch verifiziert** (Code-Lese-Pfade, keine Laufzeit-Beweise). Wo eine echte Klicksimulation nötig wäre, ist „**TODO MANUELL**" markiert.

---

## 4.1 Walkthrough — Hauptebene

> Voraussetzung: Admin-User in HA, Sidebar-Eintrag „Messages" sichtbar (`require_admin=True`, `__init__.py:572`).

### 4.1.1 Initial-Load

| Schritt | Erwartet | Code-Beleg |
|---|---|---|
| 1. Sidebar-Klick „Messages" | Panel rendert in `<main>`, Tab `messages` aktiv (default) | messagehub-panel.ts:625-631 |
| 2. Auto-Calls beim Mount | `setAuth(token)`, `listSources`, `listMessages`, `getStats` (sequenziell aus `firstUpdated`) | messagehub-panel.ts:90 + Sub-Komponenten |
| 3. Filter-Bar sichtbar | Severity-Chips (alle 4), Source-Dropdown, Volltext, Zeitraum, KNX-Read-Toggle, Saved-Filters-Dropdown | messagehub-panel.ts:479-528 |
| 4. Status-Bar | „X von Y" + Export-Buttons (jsonl/csv) + Bulk-Delete (wenn gefiltert) + Testnachricht | messagehub-panel.ts:531-572 |
| 5. Tabelle | `<message-table>` mit Severity-Pill, Source, Text, Timestamp; Klick öffnet `<detail-pane>` | messagehub-panel.ts:604 |

✅ Alle 5 Schritte statisch verifiziert.

### 4.1.2 Tab-Navigation

| Klick | Erwartetes Ergebnis | Verifikation |
|---|---|---|
| Tab „Statistik" | `<stats-view>` rendert mit 3 Sub-Tabs (live/knx/findings) | stats-view.ts:88-106 |
| Tab „Einstellungen" | `<settings-view>` rendert mit 6 Sub-Tabs | settings-view.ts:247-262 |
| Tab „Audit" | `<audit-view>` rendert Audit-Tabelle | audit-view.ts:73 |

✅ Alle Top-Tabs erreichbar — keine toten Tabs.

---

## 4.2 Walkthrough — Tab „Nachrichten"

| User-Aktion | API-Call | Erwartet | Status |
|---|---|---|---|
| Severity-Chip „Error" toggeln | `listMessages({severity:["error"]})` | Tabelle filtert | ✅ messagehub-panel.ts:153-197 |
| Source-Dropdown wählen | `listMessages({source:"…"})` | Tabelle filtert | ✅ |
| Volltextsuche tippen | debounced (300ms) `listMessages({search:…})` | Tabelle filtert | ✅ messagehub-panel.ts:316-323 |
| Zeitraum „Letzte 24h" | `listMessages({from:…})` | Tabelle filtert | ✅ |
| KNX-Reads ausblenden | `listMessages({hideKnxRead:true})` | GroupValueRead-Telegramme weg | ✅ E001 Param |
| „Filter zurücksetzen" | `listMessages()` (keine Filter) | Vollständige Liste | ✅ |
| Saved-Filter speichern | `upsertSavedFilter("Name","messages",filters)` | Eintrag im Dropdown | ✅ E039 |
| Saved-Filter laden | LocalState aus Item, `listMessages` | Filter aktiviert | ✅ |
| Saved-Filter löschen | `deleteSavedFilter(id)` | Dropdown-Eintrag weg | ✅ E040 |
| „+ Testnachricht" | `hass.callService("messagehub","add_message",…)` | Toast „gesendet", Liste reloaded | ✅ S001 (entgegen ursprünglicher Annahme: über UI erreichbar) |
| „↓ JSONL" Anchor | Browser GET `/api/messagehub/export?format=jsonl` | Download-Datei | ✅ E022 |
| „↓ CSV" Anchor | Browser GET `/api/messagehub/export?format=csv` | Download-Datei | ✅ E022 |
| „Gefilterte löschen" | `deleteMessages(filters)` mit confirm | Toast + Reload | ✅ E002 |
| Overflow-Menü „Alle löschen" | `deleteMessages({})` mit confirm | Toast + Reload | ✅ E002 |
| Zeile in Tabelle klicken | `<detail-pane>` öffnet von rechts | Pane sichtbar | ✅ |
| Detail-Pane: Severity-Pill klicken | `setMessageSeverity(id, sev)` | Tabelle und Pane aktualisiert | ✅ E006 |

✅ **Alle 16 Klickpfade im Messages-Tab statisch verifiziert.**

### 4.2.1 Detail-Pane

| User-Aktion | API-Call | Erwartet | Status |
|---|---|---|---|
| Pane öffnet | `getMessageTags(id)` + `getRunbookForSource(source, fingerprint?)` | Tags + ggf. Runbook | ✅ E007, E025 |
| Status „acknowledge" | `setMessageStatus(id,"acknowledged")` | Pill-Update + Reload | ✅ E005 |
| Status „resolve" | `setMessageStatus(id,"resolved")` | dito | ✅ E005 |
| Tag-Add (Enter) | `addMessageTag(id,tag)` | neues Chip | ✅ E008 |
| Tag-Chip „×" | `removeMessageTag(id,tag)` | Chip weg | ✅ E009 |
| „Löschen"-Button | `deleteMessage(id)` + Pane schließt | Tabelle reload | ✅ E004 |

---

## 4.3 Walkthrough — Tab „Statistik"

### 4.3.1 Sub-Tab „Live-Status"

| Aktion | API-Call | Verifikation |
|---|---|---|
| Tab betreten | `Promise.all([getStats(), listSources(), getStatsExtended(30)])` | stats-live-view.ts:46-49 |
| Heatmap-Render | aus `stats_extended.heatmap` | ✅ |
| Top-Sources-Bar | aus `stats_extended.top_sources` | ✅ |
| KPI-Cards | `total`, `severity_24h.error/warning/info/debug` | ✅ |

✅ E011, E012 angebunden. **TODO MANUELL:** Verifizieren, dass MTTR aus `stats_extended` korrekt gerendert wird (oder ob es nur „leere Zelle" gibt).

### 4.3.2 Sub-Tab „KNX-Bus-Analyse"

> Diese Komponente ist mit ~2400 Zeilen die größte. Im Folgenden die User-relevanten Aktionen.

| Aktion | API-Call | Status |
|---|---|---|
| Tab betreten (Bus-Analyse aktiv) | `getKnxBusAnalysisState` → `getKnxStatsSummary/Top/TopBySource/...` (Promise.all) | ✅ E064 + 12 weitere |
| Toggle „Bus-Analyse aktivieren" | `setKnxBusAnalysisState(true/false)` | ✅ E065 |
| Filter „Zeitraum" ändern | Re-Fetch aller Stats mit neuem `from/to` | ✅ |
| GA-Zeile klicken | `getKnxStatsGaDetail(ga,filters)` → Detail-Pane öffnet | ✅ E050 |
| Im GA-Pane „Ack" | `acknowledgeKnxGa(ga,note?)` | ✅ E069 |
| Im GA-Pane „Unack" | `unacknowledgeKnxGa(ga)` | ✅ E071 |
| Im GA-Pane „Sensitiv markieren" | `setKnxStatsSensitive(ga,true)` | ✅ E060 |
| Im GA-Pane „Export CSV" Anchor | Browser GET `/knx-stats/ga/{ga}/export?format=csv` | ✅ E053 (Anchor, nicht ApiClient) |
| Im GA-Pane „Export JSON" Anchor | dito mit `format=json` | ✅ E053 |
| Source-Zeile klicken | `getKnxStatsSourceDetail(src,filters)` | ✅ E051 |
| Im Source-Pane „Alle Acken" | `acknowledgeKnxBulk(src, ...)` | ✅ E070 |
| Im Source-Pane „Findings ansehen" | `window.location.hash = "#findings?source=…"` | ✅ Cross-Tab-Navigation, stats-view.ts:71-85 |
| Timeline-Chart-Klick | `getKnxStatsTimeline({gas:[...]})` | ✅ E052 |
| Heatmap | `getKnxStatsHeatmap` | ✅ E054 |
| Trend-Vergleich | `getKnxStatsTrend` | ✅ E055 |
| Health-Score-Card | `getKnxStatsHealthScore` | ✅ E066 |
| Busload-Chart | `getKnxStatsBusload` | ✅ E067 |
| Bus-Health-Tabelle | `getKnxStatsBusHealth` | ✅ E068 |
| Long-Term-Modus | `getKnxStatsLongTerm` | ✅ E063 |
| Bursts-Tabelle | `getKnxStatsBursts` | ✅ E062 |
| Sensitive-Log-Bereich | `getKnxStatsSensitiveLog` | ✅ E059 |
| Orphans-Tabelle | `getKnxStatsOrphans` | ✅ E057 |
| Silence-Tabelle | `getKnxStatsSilence` | ✅ E058 |
| Alarms-Tabelle | `getKnxStatsAlarms` | ✅ E056 |

✅ **24/25 KNX-Stats-Endpunkte über UI erreichbar.** Einziger nicht erreichbarer: `mttr` (E013) — kein KNX-Bezug, nur Messages-MTTR.

### 4.3.3 Sub-Tab „Konfigurations-Check" (Findings)

| Aktion | API-Call | Status |
|---|---|---|
| Tab betreten | `listFindings()` | ✅ E072 |
| URL-Hash `#findings?source=X.Y.Z` | tab-Wechsel + Source-Filter | ✅ stats-view.ts:71-85 |
| Severity-Filter | `listFindings({severity:…})` | ✅ |
| „Per-GA aktualisieren" | `refreshFindings(ga, periodDays)` | ✅ E079 |
| „Markdown exportieren" | `exportFindingsMarkdown()` → Download | ✅ E078 |
| Finding „Ack"-Button | `acknowledgeFinding({ga,code,note?,sticky?})` | ✅ E073 |
| Finding „Ack zurücknehmen" | **kein UI-Button** — `unacknowledgeFinding` bleibt ungenutzt | ⚠️ **FINDING F-004** (E074) |
| Severity-Override-Form | `listSeverityOverrides`, `setSeverityOverride`, `clearSeverityOverride` | ✅ E075-E077 |

⚠️ **Walkthrough-Finding:** Es gibt keinen UI-Pfad, einen einmal akzeptierten Finding wieder „zu öffnen". Die Methode existiert im ApiClient, ist aber an keinen Knopf gebunden.

---

## 4.4 Walkthrough — Tab „Einstellungen"

### 4.4.1 Sub-Tab „Webhooks"

| Aktion | API-Call | Status |
|---|---|---|
| Tab betreten | `listWebhooks()` | ✅ E015 |
| „+ Webhook anlegen" → Form ausfüllen → Speichern | `createWebhook(payload)` | ✅ E016 |
| Edit-Button → Form → Speichern | `updateWebhook(webhook_id,payload)` | ✅ E018 |
| Overflow → „Aktivieren/Deaktivieren" | `updateWebhook(webhook_id,{enabled})` | ✅ E018 |
| Overflow → „Löschen" | `deleteWebhook(webhook_id)` | ✅ E019 |
| „Kopieren"-Button | `navigator.clipboard.writeText(url)` (kein API-Call) | ✅ |

### 4.4.2 Sub-Tab „KNX-Bus" (KNX-Adressen)

| Aktion | API-Call | Status |
|---|---|---|
| Tab betreten | `listKnxAddresses()` | ✅ E043 |
| „+ Adresse" → Speichern | `upsertKnxAddress(payload)` | ✅ E044 |
| „Aus ETS-Projekt" → Discovery-Modal | `discoverKnxFromProject()` | ✅ E041 |
| „Sync-Vorschau" | `syncKnxProject(items, false)` | ✅ E042 (apply=false) |
| „Sync anwenden" | `syncKnxProject(items, true)` | ✅ E042 (apply=true) |
| „CSV-Import" → File-Upload | `importKnxCsv(text)` | ✅ E044 |
| Bulk-Edit ausgewählter GAs | `bulkPatchKnxAddresses(addresses, patch)` | ✅ E045 |
| Einzel-„Löschen" | `deleteKnxAddress(addr)` | ✅ E046 |
| Inline-Edit speichern | `upsertKnxAddress(payload)` | ✅ E044 |

### 4.4.3 Sub-Tab „Channels"

| Aktion | API-Call | Status |
|---|---|---|
| Tab betreten | `listChannels()` | ✅ E026 |
| „+" → Speichern | `createChannel(payload)` | ✅ E027 |
| Edit → Speichern | `updateChannel(id, payload)` | ✅ E028 |
| „Löschen" | `deleteChannel(id)` | ✅ E029 |
| **„Test-Nachricht senden"** | **❌ KEIN UI-Knopf vorhanden** — Backend-Endpoint `POST /channels/{id}/test` (E030) ungenutzt | ⚠️ **FINDING F-001** |

### 4.4.4 Sub-Tab „MQTT" (Topic-Subscriptions)

| Aktion | API-Call | Status |
|---|---|---|
| Tab betreten | `listMqttTopics()` | ✅ E031 |
| „+ Hinzufügen" | `createMqttTopic(payload)` | ✅ E032 |
| **Edit-Knopf** | **❌ FEHLT** — Backend-Endpoint `PUT /mqtt-topics/{id}` (E033) ungenutzt | ⚠️ **FINDING F-002** |
| „Löschen" | `deleteMqttTopic(id)` | ✅ E034 |

> **Achtung:** simple-list-view.ts:212-237 zeigt nur Anzeige + „Löschen" — kein Edit. Der Backend-Kommentar (api/messages.py:976-979) sagt explizit: „Iter 83 / CR-4: PUT-Handler für MQTT-Topic-Edit. Vorher fehlte er — Frontend musste DELETE+POST simulieren". Die Backend-Seite wurde gefixed, das Frontend wurde nie ergänzt.

### 4.4.5 Sub-Tab „Heartbeats"

| Aktion | API-Call | Status |
|---|---|---|
| Tab betreten | `listHeartbeats()` | ✅ E023 |
| „+ Hinzufügen" | `upsertHeartbeat(source, interval)` | ✅ E024 |
| **„Löschen"-Button** | **fehlt im UI UND Backend** — `simple-list-view.ts:296-321` rendert keine Löschen-Spalte; Backend hat kein DELETE-Endpoint für Heartbeats | ⚠️ **FINDING F-005** |
| **„Pausieren/Aktivieren"** | dto. fehlend | ⚠️ Teil von F-005 |

### 4.4.6 Sub-Tab „Auto-Remediation"

| Aktion | API-Call | Status |
|---|---|---|
| Tab betreten | `listRemediationHooks()` | ✅ E035 |
| „+ Hinzufügen" | `createRemediationHook(payload)` | ✅ E036 |
| **„Edit"-Button** | **fehlt im UI UND Backend** — Backend hat kein PUT für Hooks | ⚠️ **FINDING F-006** |
| „Löschen" | `deleteRemediationHook(id)` | ✅ E037 |
| **„Toggle Aktiv/Inaktiv"** | dto. fehlend (nur Anlegen mit `enabled=true`, kein späteres Toggle) | ⚠️ Teil von F-006 |

---

## 4.5 Walkthrough — Tab „Audit"

| Aktion | API-Call | Status |
|---|---|---|
| Tab betreten | `listAudit(200)` | ✅ E020 |
| Suche | clientseitig auf geladenem Array (kein API-Call) | ✅ |
| Zeile expandieren | nur DOM-Toggle | ✅ |
| „Alle löschen" + Confirm | `clearAuditLog()` | ✅ E021 |

✅ Audit-Tab vollständig erreichbar.

---

## 4.6 Direkt-URL-Aufrufe (Routen ohne Menü-Eintrag)

| URL | Verhalten | Status |
|---|---|---|
| `/messagehub#findings` | öffnet Stats → Findings-Sub-Tab | ✅ stats-view.ts:71-85 |
| `/messagehub#findings?source=1.1.42` | dto. + setzt Source-Filter | ✅ |
| `/messagehub-panel/messagehub-panel.js?v=…` | Statisch geserved aus `frontend_dist/` | ✅ |
| `/api/messagehub/...` | aiohttp-Views, immer auth-pflichtig (HA-Token) | ✅ |
| `/api/webhook/<webhook_id>` | HA-natives Webhook-Empfangsfenster | ✅ |

> **Routen-Test (TODO MANUELL):** Die Sub-Tabs in `settings-view` und `stats-view` haben **keine eigene URL**, nur LocalStorage-Persistenz. Bei Reload des Tabs fällt der User auf den letzten gewählten Sub-Tab zurück. Cross-Linking nur via `#findings` (siehe oben). Für tieferes Deep-Linking müsste man Hash-Routing für alle Sub-Tabs einführen.

---

## 4.7 Außerhalb des Messagehub-Panels (HA-Standard-Pfade)

| Use-Case | Erreichbarkeit | Status |
|---|---|---|
| `messagehub.add_message` Service | UI „+ Testnachricht"-Button **+** HA-Entwicklertools / YAML-Automation | ✅ |
| Webhook-Empfang `/api/webhook/<id>` | URL im Settings-Tab kopierbar; externe Sender (Pi-hole, Skripte) treffen ihn direkt | ✅ |
| HA-Sensoren (EN001-EN012) | HA-„Geräte & Dienste" → „Message Hub" → Entitäten | ✅ |
| HA-Repair-Issues (R001/R002) | HA-Reparaturen-Bereich, popup-Notification | ✅ |
| HA-Bus-Events (EV001/EV002) | HA-Entwickler → Events anhören | ✅ |
| Prometheus `/api/messagehub/metrics` | extern (Scraper) | ✅ (per Design) |

---

## 4.8 Gesamtbild

| Bereich | Klickpfade getestet | Lücken |
|---|---:|---|
| Messages-Tab | 16 + 6 (Detail-Pane) | keine |
| Stats → Live | 5 | keine |
| Stats → KNX | 24 | keine |
| Stats → Findings | 8 | 1 (F-004 Unack) |
| Settings → Webhooks | 6 | keine |
| Settings → KNX-Bus | 9 | keine |
| Settings → Channels | 5 | 1 (F-001 Test) |
| Settings → MQTT | 4 | 1 (F-002 Edit) |
| Settings → Heartbeats | 2 | 1 (F-005 Delete/Toggle) |
| Settings → Remediation | 3 | 1 (F-006 Edit/Toggle) |
| Audit | 4 | keine |
| Direkt-URLs | 5 | keine (nur Hash-Routing-Lücke außerhalb #findings) |

**Erkannte UI-Lücken: 5** (F-001, F-002, F-004, F-005, F-006), siehe Phase 5.

---

## 4.9 Playwright-Test-Skelette

Erzeugt unter `e2e/audit/`:
- `playwright.config.ts` — Konfiguration für lokale HA-Instanz
- `00-smoke.spec.ts` — Panel lädt, Tabs erreichbar
- `01-messages-tab.spec.ts` — Filter, Saved-Filter, Detail-Pane
- `02-stats-tab.spec.ts` — Sub-Tab-Wechsel, Hash-Routing
- `03-settings-tab.spec.ts` — Alle 6 Sub-Tabs erreichbar, Lücken explizit als `test.fixme` markiert
- `04-audit-tab.spec.ts` — Audit-Liste, Clear-Button
- `README.md` — Setup-Anleitung
- `fixtures/api-mock.ts` — Mock-Daten für Tests, die ohne HA-Backend laufen sollen (per `route.fulfill`)

> **Status der Tests:** Vorbereitet, **nicht ausgeführt** (Docker + Browser-Bundle fehlen). Sie sind so geschrieben, dass sie in einer normalen Dev-Umgebung mit `npx playwright test` direkt laufen.

### Manuelle Re-Exec-Anleitung

```bash
# 1. HA-Instanz starten
docker compose -f docker-compose.dev.yml up -d
# 2. Long-Lived-Token in HA erzeugen (Profil → Long-Lived Access Tokens)
echo "HA_TOKEN=eyJhbGc..." > e2e/audit/.env
# 3. Playwright + Browser installieren
cd e2e/audit && npm install && npx playwright install chromium
# 4. Tests ausführen
npx playwright test --reporter=html
# 5. Trace + Screenshots im Report
npx playwright show-report
```
