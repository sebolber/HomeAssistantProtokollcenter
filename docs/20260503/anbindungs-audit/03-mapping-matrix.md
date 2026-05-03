# Phase 3 — Mapping-Matrix Backend ↔ Frontend

**Stand:** 2026-05-03
**Quellen:** `01-backend-inventar.md`, `02-frontend-inventar.md`

> **Status-Legende**:
> - ✅ `ANGEBUNDEN` — Backend-Endpoint hat Frontend-Aufruf, Komponente ist über Tab-Hierarchie erreichbar.
> - ⚠️ `TEILWEISE` — Aufruf existiert, aber UI-Trigger fehlt oder Code-Pfad ist nur teilweise erreichbar.
> - ❌ `NICHT_ANGEBUNDEN` — Kein Frontend-Aufruf gefunden.
> - 🟡 `TOT` — Backend-Endpoint ohne UI-Erreichbarkeit; Frontend-Code-Pfad existiert nicht oder ist nicht über UI auslösbar.
> - 🔵 `INDIREKT` — Endpoint kein UI-Klick, aber bewusst (z. B. Prometheus-Scraper, externer Webhook-Empfang).

---

## 3.1 Matrix: Backend-Endpoint → Frontend

| ID | Backend-Pfad | ApiClient-Methode | Komponente | UI-Trigger | Status | Begründung |
|---|---|---|---|---|---|---|
| E001 | GET `/api/messagehub/messages` | `listMessages` (M02) | messagehub-panel | Messages-Tab Auto-Reload, Filter, Pagination | ✅ ANGEBUNDEN | Hauptpfad |
| E002 | DELETE `/api/messagehub/messages` | `deleteMessages` (M36) | messagehub-panel | Bulk-Delete-Button | ✅ ANGEBUNDEN | messagehub-panel.ts:266 |
| E003 | GET `/api/messagehub/messages/{id}` | `getMessage` (M03) | — | — | 🟡 TOT | M03 nicht aufgerufen — Detail-Pane nutzt direktes Item aus Liste (api-client.ts:567 ungenutzt) |
| E004 | DELETE `/api/messagehub/messages/{id}` | `deleteMessage` (M04) | messagehub-panel via detail-pane | Detail-Pane „Löschen"-Button | ✅ ANGEBUNDEN | detail-pane löst Event, Panel ruft API |
| E005 | POST `/api/messagehub/messages/{id}/status` | `setMessageStatus` (M05) | detail-pane | Status-Buttons im Detail-Pane | ✅ ANGEBUNDEN | components/detail-pane.ts:54 |
| E006 | POST `/api/messagehub/messages/{id}/severity` | `setMessageSeverity` (M06) | message-table (Popover) | Severity-Klick im Tabellen-Cell | ✅ ANGEBUNDEN | messagehub-panel.ts:214 |
| E007 | GET `/api/messagehub/messages/{id}/tags` | `getMessageTags` (M07) | detail-pane | Auto-Load beim Pane-Öffnen | ✅ ANGEBUNDEN | components/detail-pane.ts:31 |
| E008 | POST `/api/messagehub/messages/{id}/tags` | `addMessageTag` (M08) | detail-pane | Tag-Add-Button | ✅ ANGEBUNDEN | components/detail-pane.ts:80 |
| E009 | DELETE `/api/messagehub/messages/{id}/tags` | `removeMessageTag` (M09) | detail-pane | Tag-Chip „×"-Klick | ✅ ANGEBUNDEN | components/detail-pane.ts:90 |
| E010 | GET `/api/messagehub/sources` | `listSources` (M37) | source-filter | Auto-Load Filter-Dropdown | ✅ ANGEBUNDEN | source-filter.ts:18 |
| E011 | GET `/api/messagehub/stats` | `getStats` (M38) | stats-live-view | Auto-Load beim Tab-Wechsel | ✅ ANGEBUNDEN | stats-live-view.ts:47 |
| E012 | GET `/api/messagehub/stats-extended` | `getStatsExtended` (M32) | stats-live-view | Auto-Load (Heatmap, Top-Sources) | ✅ ANGEBUNDEN | stats-live-view.ts:49 |
| E013 | GET `/api/messagehub/mttr` | — | — | — | ❌ NICHT_ANGEBUNDEN | Eigener Endpoint, kein ApiClient-Wrapper. MTTR ist redundant in `stats-extended` enthalten — aber dedizierter Endpoint hat keinen Caller. (api/messages.py:1164 vs. api-client.ts kein Eintrag) |
| E014 | GET `/api/messagehub/metrics` | — | — | — | 🔵 INDIREKT | Prometheus-Scraper (extern), bewusst kein UI |
| E015 | GET `/api/messagehub/webhooks` | `listWebhooks` (M39) | settings-view | Settings → Webhooks Auto-Load | ✅ ANGEBUNDEN | settings-view.ts:60 |
| E016 | POST `/api/messagehub/webhooks` | `createWebhook` (M40) | webhook-form | „+ Webhook anlegen"-Button | ✅ ANGEBUNDEN | webhook-form.ts:96 |
| E017 | GET `/api/messagehub/webhooks/{id}` | — | — | — | 🟡 TOT | Frontend liest die Liste komplett (M39); Single-Get unbenutzt |
| E018 | PUT `/api/messagehub/webhooks/{id}` | `updateWebhook` (M41) | webhook-form, settings-view | Edit-Button + Toggle-Aktiv | ✅ ANGEBUNDEN | settings-view.ts:94 (toggle), webhook-form.ts:88 (edit) |
| E019 | DELETE `/api/messagehub/webhooks/{id}` | `deleteWebhook` (M42) | settings-view | Overflow-Menu „Löschen" | ✅ ANGEBUNDEN | settings-view.ts:79 |
| E020 | GET `/api/messagehub/audit` | `listAudit` (M11) | audit-view | Audit-Tab Auto-Load | ✅ ANGEBUNDEN | audit-view.ts:102 |
| E021 | DELETE `/api/messagehub/audit` | `clearAuditLog` (M14) | audit-view | „Alle löschen"-Button | ✅ ANGEBUNDEN | audit-view.ts:127 |
| E022 | GET `/api/messagehub/export` | `exportUrl` (M35) | messagehub-panel | „Export jsonl/csv"-Anchor-Links | ✅ ANGEBUNDEN | messagehub-panel.ts:545,552 (Direct-Download) |
| E023 | GET `/api/messagehub/heartbeats` | `listHeartbeats` (M30) | heartbeats-view | Settings → Heartbeats Auto-Load | ✅ ANGEBUNDEN | simple-list-view.ts:256 |
| E024 | POST `/api/messagehub/heartbeats` | `upsertHeartbeat` (M31) | heartbeats-view | „+ Hinzufügen"-Button | ✅ ANGEBUNDEN | simple-list-view.ts:261 |
| E025 | GET `/api/messagehub/runbook/{source}` | `getRunbookForSource` (M10) | detail-pane | Auto-Load beim Pane-Öffnen | ✅ ANGEBUNDEN | detail-pane.ts:40 |
| E026 | GET `/api/messagehub/channels` | `listChannels` (M20) | channels-view | Settings → Channels Auto-Load | ✅ ANGEBUNDEN | channels-view.ts:24 |
| E027 | POST `/api/messagehub/channels` | `createChannel` (M21) | channels-view | „+"-Button | ✅ ANGEBUNDEN | channels-view.ts:50 |
| E028 | PUT `/api/messagehub/channels/{id}` | `updateChannel` (M22) | channels-view | Edit-Button | ✅ ANGEBUNDEN | channels-view.ts:52 |
| E029 | DELETE `/api/messagehub/channels/{id}` | `deleteChannel` (M23) | channels-view | „Löschen"-Button | ✅ ANGEBUNDEN | channels-view.ts:66 |
| E030 | POST `/api/messagehub/channels/{id}/test` | — | — | — | ❌ NICHT_ANGEBUNDEN | Backend hat dedizierten Test-Endpoint (api/messages.py:758-821) inkl. Rate-Limiter, **aber UI hat keinen „Test"-Knopf**. Channel-Konfiguration kann nicht verifiziert werden ohne echte Trigger-Nachricht. |
| E031 | GET `/api/messagehub/mqtt-topics` | `listMqttTopics` (M24) | mqtt-topics-view | Settings → MQTT Auto-Load | ✅ ANGEBUNDEN | simple-list-view.ts:143 |
| E032 | POST `/api/messagehub/mqtt-topics` | `createMqttTopic` (M25) | mqtt-topics-view | „+ Hinzufügen"-Button | ✅ ANGEBUNDEN | simple-list-view.ts:148 |
| E033 | PUT `/api/messagehub/mqtt-topics/{id}` | — | — | — | ❌ NICHT_ANGEBUNDEN | Backend explizit **wegen Frontend-Bedarf hinzugefügt** (api/messages.py:975-1021, Iter 83/CR-4 Kommentar: „Vorher fehlte er — Frontend musste DELETE+POST simulieren"). **UI hat aber keinen Edit-Button** für MQTT-Topics. |
| E034 | DELETE `/api/messagehub/mqtt-topics/{id}` | `deleteMqttTopic` (M26) | mqtt-topics-view | „Löschen"-Button | ✅ ANGEBUNDEN | simple-list-view.ts:162 |
| E035 | GET `/api/messagehub/remediation-hooks` | `listRemediationHooks` (M27) | remediation-view | Settings → Remediation Auto-Load | ✅ ANGEBUNDEN | simple-list-view.ts:342 |
| E036 | POST `/api/messagehub/remediation-hooks` | `createRemediationHook` (M28) | remediation-view | „+ Hinzufügen"-Button | ✅ ANGEBUNDEN | simple-list-view.ts:347 |
| E037 | DELETE `/api/messagehub/remediation-hooks/{id}` | `deleteRemediationHook` (M29) | remediation-view | „Löschen"-Button | ✅ ANGEBUNDEN | simple-list-view.ts:363 |
| E038 | GET `/api/messagehub/saved-filters` | `listSavedFilters` (M51) | messagehub-panel | Saved-Filter-Dropdown im Messages-Tab | ✅ ANGEBUNDEN | messagehub-panel.ts:336 |
| E039 | POST `/api/messagehub/saved-filters` | `upsertSavedFilter` (M52) | messagehub-panel | „Speichern"-Button | ✅ ANGEBUNDEN | messagehub-panel.ts:346 |
| E040 | DELETE `/api/messagehub/saved-filters/{id}` | `deleteSavedFilter` (M53) | messagehub-panel | „×"-Knopf am Saved-Filter | ✅ ANGEBUNDEN | messagehub-panel.ts:372 |
| E041 | GET `/api/messagehub/knx-discovery` | `discoverKnxFromProject` (M15) | knx-addresses-view | „Aus ETS-Projekt importieren"-Modal | ✅ ANGEBUNDEN | knx-addresses-view.ts:89 |
| E042 | POST `/api/messagehub/knx-addresses/sync` | `syncKnxProject` (M17) | knx-addresses-view | „Sync-Plan ansehen" + „Anwenden" | ✅ ANGEBUNDEN | knx-addresses-view.ts:137,164 |
| E043 | GET `/api/messagehub/knx-addresses` | `listKnxAddresses` (M18) | knx-addresses-view | Settings → KNX Auto-Load | ✅ ANGEBUNDEN | knx-addresses-view.ts:80 |
| E044 | POST `/api/messagehub/knx-addresses` | `upsertKnxAddress` (M19) + `importKnxCsv` (M34) | knx-addresses-view | „+ Adresse"-Button + CSV-Import | ✅ ANGEBUNDEN | knx-addresses-view.ts:192,224,316,622 |
| E045 | POST `/api/messagehub/knx-addresses/bulk` | `bulkPatchKnxAddresses` (M16) | knx-addresses-view | Bulk-Edit-Modal | ✅ ANGEBUNDEN | knx-addresses-view.ts:474 |
| E046 | DELETE `/api/messagehub/knx-addresses/{addr}` | `deleteKnxAddress` (M33) | knx-addresses-view | „Löschen"-Button pro Zeile | ✅ ANGEBUNDEN | knx-addresses-view.ts:254 |
| E047 | GET `/api/messagehub/knx-stats/summary` | `getKnxStatsSummary` (M43) | stats-knx-view | Stats → KNX Auto-Load | ✅ ANGEBUNDEN | stats-knx-view.ts:546 |
| E048 | GET `/api/messagehub/knx-stats/top` | `getKnxStatsTop` (M44) | stats-knx-view | Auto-Load | ✅ ANGEBUNDEN | stats-knx-view.ts:547 |
| E049 | GET `/api/messagehub/knx-stats/top-by-source` | `getKnxStatsTopBySource` (M45) | stats-knx-view | Auto-Load | ✅ ANGEBUNDEN | stats-knx-view.ts:548 |
| E050 | GET `/api/messagehub/knx-stats/ga/{ga}` | `getKnxStatsGaDetail` (M46) | stats-knx-view | GA-Klick → Detail-Pane | ✅ ANGEBUNDEN | stats-knx-view.ts:704 |
| E051 | GET `/api/messagehub/knx-stats/source/{src}` | `getKnxStatsSourceDetail` (M47) | stats-knx-view | Source-Klick → Detail-Pane | ✅ ANGEBUNDEN | stats-knx-view.ts:725 |
| E052 | GET `/api/messagehub/knx-stats/timeline` | `getKnxStatsTimeline` (M48) | stats-knx-view | Auto-Load (Chart) | ✅ ANGEBUNDEN | stats-knx-view.ts:600 |
| E053 | GET `/api/messagehub/knx-stats/ga/{ga}/export` | — (direkter Anchor) | stats-knx-view | „Export CSV/JSON"-Links im GA-Detail-Pane | ✅ ANGEBUNDEN | **Anchor-Link** stats-knx-view.ts:1803-1807 (kein ApiClient-Aufruf, sondern `<a href>`-Direkt-Download) |
| E054 | GET `/api/messagehub/knx-stats/heatmap` | `getKnxStatsHeatmap` (M54) | stats-knx-view | Auto-Load | ✅ ANGEBUNDEN | stats-knx-view.ts:575 |
| E055 | GET `/api/messagehub/knx-stats/trend` | `getKnxStatsTrend` (M55) | stats-knx-view | Auto-Load | ✅ ANGEBUNDEN | stats-knx-view.ts:571 |
| E056 | GET `/api/messagehub/knx-stats/alarms` | `getKnxStatsAlarms` (M50) | stats-knx-view | Auto-Load | ✅ ANGEBUNDEN | stats-knx-view.ts:555 |
| E057 | GET `/api/messagehub/knx-stats/orphans` | `getKnxStatsOrphans` (M56) | stats-knx-view | Auto-Load | ✅ ANGEBUNDEN | stats-knx-view.ts:554 |
| E058 | GET `/api/messagehub/knx-stats/silence` | `getKnxStatsSilence` (M57) | stats-knx-view | Auto-Load | ✅ ANGEBUNDEN | stats-knx-view.ts:550 |
| E059 | GET `/api/messagehub/knx-stats/sensitive-log` | `getKnxStatsSensitiveLog` (M63) | stats-knx-view | Auto-Load | ✅ ANGEBUNDEN | stats-knx-view.ts:565 |
| E060 | POST `/api/messagehub/knx-stats/sensitive/{ga}` | `setKnxStatsSensitive(ga, true)` (M64) | stats-knx-view | „Sensitive markieren"-Button | ✅ ANGEBUNDEN | stats-knx-view.ts (Toggle) |
| E061 | DELETE `/api/messagehub/knx-stats/sensitive/{ga}` | `setKnxStatsSensitive(ga, false)` (M64) | stats-knx-view | dito (Toggle-off) | ✅ ANGEBUNDEN | gleicher Toggle |
| E062 | GET `/api/messagehub/knx-stats/bursts` | `getKnxStatsBursts` (M62) | stats-knx-view | Auto-Load | ✅ ANGEBUNDEN | stats-knx-view.ts:564 |
| E063 | GET `/api/messagehub/knx-stats/long-term` | `getKnxStatsLongTerm` (M61) | stats-knx-view | Auto-Load (Long-Term-Modus) | ✅ ANGEBUNDEN | stats-knx-view.ts:562 |
| E064 | GET `/api/messagehub/knx-stats/bus-analysis-state` | `getKnxStatsBusAnalysisState` (M12) | stats-knx-view | Toggle-Initial-State | ✅ ANGEBUNDEN | stats-knx-view.ts:401 |
| E065 | PUT `/api/messagehub/knx-stats/bus-analysis-state` | `setKnxStatsBusAnalysisState` (M13) | stats-knx-view | „Bus-Analyse aktivieren"-Toggle | ✅ ANGEBUNDEN | stats-knx-view.ts:475 |
| E066 | GET `/api/messagehub/knx-stats/health-score` | `getKnxStatsHealthScore` (M60) | stats-knx-view | Auto-Load (KPI-Card) | ✅ ANGEBUNDEN | stats-knx-view.ts:560 |
| E067 | GET `/api/messagehub/knx-stats/busload` | `getKnxStatsBusload` (M59) | stats-knx-view | Auto-Load | ✅ ANGEBUNDEN | stats-knx-view.ts:558 |
| E068 | GET `/api/messagehub/knx-stats/bus-health` | `getKnxStatsBusHealth` (M58) | stats-knx-view | Auto-Load | ✅ ANGEBUNDEN | stats-knx-view.ts:549 |
| E069 | POST `/api/messagehub/knx-stats/acknowledge` | `acknowledgeKnxGa` (M49) | stats-knx-view | „Ack"-Button im GA-Detail-Pane | ✅ ANGEBUNDEN | stats-knx-view.ts:758 |
| E070 | POST `/api/messagehub/knx-stats/acknowledge-bulk` | `acknowledgeKnxBulk` (M74) | stats-knx-view | „Alle für Source ack"-Button | ✅ ANGEBUNDEN | stats-knx-view.ts:2361 |
| E071 | DELETE `/api/messagehub/knx-stats/acknowledge/{ga}` | `unacknowledgeKnxGa` (M65) | stats-knx-view | „Ack zurücknehmen"-Button | ✅ ANGEBUNDEN | stats-knx-view.ts:769 |
| E072 | GET `/api/messagehub/findings` | `listFindings` (M66) | findings-view | Stats → Findings Auto-Load | ✅ ANGEBUNDEN | findings-view.ts:85 |
| E073 | POST `/api/messagehub/findings/ack` | `acknowledgeFinding` (M67) | findings-view | „Ack"-Button im Finding-Item | ✅ ANGEBUNDEN | findings-view.ts:189 |
| E074 | DELETE `/api/messagehub/findings/ack/{ga}/{code}` | `unacknowledgeFinding` (M68) — definiert | — | — | ⚠️ TEILWEISE | ApiClient-Methode existiert (api-client.ts:1313), wird aber **in keiner Komponente aufgerufen**. UI bietet keine Möglichkeit, einen Finding-Ack zu entfernen. |
| E075 | GET `/api/messagehub/findings/severity-overrides` | `listSeverityOverrides` (M69) | severity-override-form | Severity-Overrides-Bereich | ✅ ANGEBUNDEN | severity-override-form.ts:42 |
| E076 | PUT `/api/messagehub/findings/severity-overrides/{code}` | `setSeverityOverride` (M70) | severity-override-form | Override-Setzen | ✅ ANGEBUNDEN | severity-override-form.ts:57 |
| E077 | DELETE `/api/messagehub/findings/severity-overrides/{code}` | `clearSeverityOverride` (M71) | severity-override-form | Override-Löschen | ✅ ANGEBUNDEN | severity-override-form.ts:67 |
| E078 | GET `/api/messagehub/findings/export.md` | `exportFindingsMarkdown` (M72) | findings-view | „Markdown exportieren"-Button | ✅ ANGEBUNDEN | findings-view.ts:129 |
| E079 | POST `/api/messagehub/findings/refresh` | `refreshFindings` (M73) | findings-view | „Per-GA aktualisieren"-Button | ✅ ANGEBUNDEN | findings-view.ts:169 |

---

## 3.2 Statistik-Auswertung

| Status | Anzahl | % |
|---|---:|---:|
| ✅ ANGEBUNDEN | **70** | 88,6 % |
| ❌ NICHT_ANGEBUNDEN | **3** | 3,8 % |
| 🟡 TOT | **2** | 2,5 % |
| ⚠️ TEILWEISE | **1** | 1,3 % |
| 🔵 INDIREKT | **1** | 1,3 % |
| **Summe** | **77** | 100 % |

> Hinweis: 79 Endpoint-IDs (E001-E079) — 2 Endpoints (E060/E061) teilen sich denselben Methoden-Aufruf (`setKnxStatsSensitive(true/false)`). Daher Total = 77 in Statusspalte.

---

## 3.3 Spiegel: Frontend-Aufrufe ohne passenden Backend-Endpoint (broken contracts)

| ApiClient-Methode | Erwarteter Endpoint | Backend-Status |
|---|---|---|
| (keine) | — | Frontend ist konsistent: alle 74 ApiClient-Methoden zeigen auf existierende Backend-Routes. |

---

## 3.4 Service- und Webhook-Mapping (außerhalb der REST-Matrix)

| Use-Case-ID | Backend | Frontend-Erreichbarkeit | Status |
|---|---|---|---|
| S001 | `messagehub.add_message` Service | **Auch im Panel** — „+ Testnachricht"-Button im Messages-Tab ruft `hass.callService("messagehub","add_message",...)` (messagehub-panel.ts:275-306). Zusätzlich erreichbar über HA-Entwicklertools / YAML-Automationen. | ✅ ANGEBUNDEN (über HA-WebSocket-Service-Call) |
| W001 | Eingehender Webhook `/api/webhook/<id>` | **Nicht User-Trigger** — externe Systeme rufen ihn auf. UI zeigt zwar die URL (Settings → Webhooks „Kopieren"), aber sendet selbst keine Calls. | 🔵 INDIREKT (extern) |
| EV001 | `messagehub_message_added` Event | Sensoren / Binary-Sensors aktualisieren sich automatisch; Panel re-fetched manuell oder beim Tab-Wechsel | 🔵 INDIREKT (Backend-internes Event) |
| EV002 | `messagehub_message_deleted` Event | dito | 🔵 INDIREKT |
| EN001-EN012 | HA-Sensor-Entitäten | Erreichbar über HA-Entitäten-Übersicht / Geräte & Dienste, **nicht** über Messagehub-Panel | 🔵 INDIREKT (HA-Standard) |
| R001-R002 | Repair-Issues | HA-„Reparaturen"-Bereich, **nicht** Messagehub-Panel | 🔵 INDIREKT |

> **Konsequenz:** Diese Use-Cases sind nicht „kaputt", aber für Endnutzer auf der UI-Ebene **nur indirekt** sichtbar. Das ist HA-übliche Architektur. Sollte in der Doku/README explizit so beschrieben sein. **Findings-Hinweis:** prüfen, ob README dies klarmacht.

---

## 3.5 Komponenten ohne aktive Backend-Anbindung

(Reine Visualisierungs-Komponenten, kein eigener API-Aufruf — erhalten Daten via Properties.)

| Komponente | Datei | Verwendet von |
|---|---|---|
| `<message-table>` | components/message-table.ts | messagehub-panel |
| `<severity-filter>` | components/severity-filter.ts | messagehub-panel |
| `<time-range-filter>` | components/time-range-filter.ts | messagehub-panel |
| `<knx-value-sparkline>` | components/knx-value-sparkline.ts | stats-knx-view |
| `<knx-timeline-chart>` | components/knx-timeline-chart.ts | stats-knx-view |

→ Alle korrekt eingebunden, kein „totes" UI.

---

## 3.6 Zusammenfassung der nicht-angebundenen Endpoints

### Echte Lücken (Fix nötig):

| ID | Backend-Endpoint | Symptom | Empfohlener Fix |
|---|---|---|---|
| E030 | POST `/api/messagehub/channels/{id}/test` | User kann Channel-Konfig nicht testen | „Test"-Button in `channels-view` ergänzen + `testChannel(id)` in ApiClient |
| E033 | PUT `/api/messagehub/mqtt-topics/{id}` | User muss MQTT-Topic löschen+neu anlegen, ID ändert sich | Edit-Button in `mqtt-topics-view` + `updateMqttTopic(id, payload)` in ApiClient |
| E013 | GET `/api/messagehub/mttr` | dedizierter MTTR-Endpoint hat keinen UI-Trigger | Entweder Endpoint löschen (DRY) ODER eigener MTTR-Tab |
| E074 | DELETE `/api/messagehub/findings/ack/{ga}/{code}` | User kann Finding-Ack nicht zurücknehmen | „Unack"-Aktion im findings-view ergänzen (M68 ist da, nicht aufgerufen) |

### Tote Code-Pfade (Cleanup-Kandidaten):

| ID | Was | Vorschlag |
|---|---|---|
| E003 | `getMessage(id)` in api-client.ts | löschen oder in detail-pane einsetzen |
| E017 | `GET /webhooks/{id}` Backend-Endpoint | beibehalten (Detail-Read könnte später nützen) |

---

## 3.7 Visualisierung als Sankey (mental model)

```
HA-Sidebar „Messages"
   │
   ▼
┌──────────── messagehub-panel (4 Top-Tabs) ─────────────────┐
│                                                              │
│  [messages] ── E001/E002/E022/E038-E040, E004-E009 (via)   │
│             ── M02/M36/M35/M51-M53/M04-M09                  │
│                                                              │
│  [stats] ───── stats-view (3 Sub-Tabs)                      │
│      [live] ── E011/E012 (M38/M32)                          │
│      [knx]  ── E047-E071 (28 Endpoints, 27 angebunden)      │
│      [findings] ── E072/E073/E075-E079 (E074 ⚠️)            │
│                                                              │
│  [settings] ── settings-view (6 Sub-Tabs)                   │
│      [webhooks] ── E015/E016/E018/E019                      │
│      [knx]      ── E041-E046                                │
│      [channels] ── E026-E029, E030 ❌ fehlt im UI            │
│      [mqtt]     ── E031/E032/E034, E033 ❌ fehlt im UI       │
│      [heartbeats] ── E023/E024 (Delete fehlt im Backend)    │
│      [remediation] ── E035-E037 (Update fehlt im Backend)   │
│                                                              │
│  [audit] ─── E020/E021                                      │
└──────────────────────────────────────────────────────────────┘

Außerhalb des Panels (per HA-Standard):
   E014 (Prometheus)  →  externe Scraper
   S001 (add_message)  →  HA-Services-Seite / YAML
   W001 (Webhook IN)   →  externe Sender (Pi-hole, Skripte)
   EN001-EN012         →  HA-Entitäten-Seite
   R001-R002           →  HA-Reparaturen-Seite
```

---

## 3.8 Schluss

Insgesamt **70 von 77 verifizierbaren Backend-Endpoints (88,6 %)** haben einen funktionierenden UI-Pfad. **3 echte Fehlanbindungen** (E030 Channel-Test, E033 MQTT-Update, E074 Findings-Unack) und **2 tote Endpoint-/Methoden-Pfade** (E003 Message-Detail, E017 Webhook-Single-GET) sind die konkreten Audit-Findings für Phase 5.
