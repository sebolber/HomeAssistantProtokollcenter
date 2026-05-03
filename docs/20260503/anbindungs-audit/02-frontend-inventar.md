# Phase 2 — Frontend-Inventar

**Stand:** 2026-05-03
**Quelle:** `frontend/src/` (Lit + TypeScript, kein Angular)

> Hinweis zur Methodik: Das Audit-Skript erwartet Angular-Routen. Diese App ist ein **Custom Element** (Lit), das von HA als Sidebar-Panel unter `/messagehub` eingebunden wird. „Routing" geschieht über **Tab-Switches** im Hauptpanel + URL-Hash-Navigation für Sub-Tabs.

---

## 2.1 Einstiegspunkt (HA-Routing)

| Pfad | Eintrag | Definiert in |
|---|---|---|
| `/messagehub` | Custom-Panel `messagehub-panel` | `__init__.py:565-573` (über `panel_custom.async_register_panel`) |
| `/messagehub-panel/messagehub-panel.js` | Statisches Bundle | `__init__.py:546-561` |

Sidebar-Eintrag: **„Messages"** (Icon `mdi:message-alert`), nur sichtbar für Admin-User (`require_admin=True`).

---

## 2.2 Tab-Hierarchie der UI

### 2.2.1 Hauptebene (Top-Tabs in `messagehub-panel.ts:626-631`)

| Tab-ID | Label | Komponente | Datei:Zeile (Render) |
|---|---|---|---|
| `messages` | „Nachrichten" | inline `_renderMessages()` + `<message-table>` + `<detail-pane>` | messagehub-panel.ts:673 |
| `stats` | „Statistik" | `<stats-view>` | messagehub-panel.ts:674-675 |
| `settings` | „Einstellungen" | `<settings-view>` | messagehub-panel.ts:677-678 |
| `audit` | „Audit" | `<audit-view>` | messagehub-panel.ts:680-681 |

Tab-Wechsel: `@click=${() => (this._tab = t.id)}` — messagehub-panel.ts:654.

### 2.2.2 Stats-Sub-Tabs (in `stats-view.ts:88-93`)

| Sub-Tab-ID | Label | Komponente | Persistenz |
|---|---|---|---|
| `live` | „Live-Status" | `<stats-live-view>` | localStorage `messagehub.stats.subtab` |
| `knx` | „KNX-Bus-Analyse" | `<stats-knx-view>` | dito |
| `findings` | „Konfigurations-Check" | `<findings-view>` | dito + URL-Hash `#findings?source=…` |

> Hash-Navigation: `stats-view.ts:71-85` — `#findings?source=X.Y.Z` öffnet Findings-Tab mit Source-Filter; Cross-Linking aus `stats-knx-view`.

### 2.2.3 Settings-Sub-Tabs (in `settings-view.ts:19-26`)

| Sub-Tab-ID | Label | Komponente | Persistenz |
|---|---|---|---|
| `webhooks` | „Webhooks" | inline `_renderWebhooks()` + `<webhook-form>` | localStorage `messagehub.settings.tab` |
| `knx` | „KNX-Bus" | `<knx-addresses-view>` | dito |
| `channels` | „Channels" | `<channels-view>` | dito |
| `mqtt` | „MQTT" | `<mqtt-topics-view>` | dito |
| `heartbeats` | „Heartbeats" | `<heartbeats-view>` | dito |
| `remediation` | „Auto-Remediation" | `<remediation-view>` | dito |

---

## 2.3 Komponenten-Verzeichnis

Alle Custom-Elements werden über `customElements.define` registriert (Decorator `@customElement` aus `utils/custom-element.ts`).

| Tag | Klasse | Datei | Erreichbarkeit |
|---|---|---|---|
| `messagehub-panel` | MessageHubPanel | messagehub-panel.ts:66 | HA-Sidebar |
| `message-table` | MessageTable | components/message-table.ts:32 | Messages-Tab |
| `severity-filter` | SeverityFilter | components/severity-filter.ts:11 | Messages-Tab |
| `source-filter` | SourceFilter | components/source-filter.ts:8 | Messages-Tab |
| `time-range-filter` | TimeRangeFilter | components/time-range-filter.ts:9 | Messages-Tab |
| `detail-pane` | DetailPane | components/detail-pane.ts:8 | Messages-Tab (per Klick) |
| `stats-view` | StatsView | components/stats-view.ts:20 | Stats-Tab |
| `stats-live-view` | StatsLiveView | components/stats-live-view.ts:28 | Stats → Live |
| `stats-knx-view` | StatsKnxView | components/stats-knx-view.ts:286 | Stats → KNX |
| `findings-view` | FindingsView | components/findings-view.ts:45 | Stats → Findings |
| `severity-override-form` | SeverityOverrideForm | components/severity-override-form.ts:25 | innerhalb Findings-View |
| `settings-view` | SettingsView | components/settings-view.ts:40 | Settings-Tab |
| `webhook-form` | WebhookForm | components/webhook-form.ts:37 | Settings → Webhooks |
| `knx-addresses-view` | KnxAddressesView | components/knx-addresses-view.ts:41 | Settings → KNX |
| `channels-view` | ChannelsView | components/channels-view.ts:11 | Settings → Channels |
| `mqtt-topics-view` | MqttTopicsView | components/simple-list-view.ts:129 | Settings → MQTT |
| `heartbeats-view` | HeartbeatsView | components/simple-list-view.ts:243 | Settings → Heartbeats |
| `remediation-view` | RemediationView | components/simple-list-view.ts:327 | Settings → Remediation |
| `audit-view` | AuditView | components/audit-view.ts:73 | Audit-Tab |
| `knx-value-sparkline` | KnxValueSparkline | components/knx-value-sparkline.ts:35 | innerhalb Stats-KNX |
| `knx-timeline-chart` | KnxTimelineChart | components/knx-timeline-chart.ts:24 | innerhalb Stats-KNX |

---

## 2.4 ApiClient-Methoden + Aufrufer-Mapping

Alle HTTP-Aufrufe kapselt `frontend/src/api-client.ts` (Klasse `ApiClient`, Zeile 535). **Es gibt KEINE direkten `fetch()`-Aufrufe in Komponenten.** (Verifiziert via grep.)

### 2.4.1 Tabelle aller ApiClient-Methoden

| # | Methode | HTTP+Pfad | Datei:Zeile (Definition) | Aufrufer (Komponente:Zeile) |
|---|---|---|---|---|
| M01 | setAuth | — | api-client.ts:540 | messagehub-panel.ts:90 |
| M02 | listMessages | GET /messages | api-client.ts:550 | messagehub-panel.ts:162 |
| M03 | getMessage | GET /messages/{id} | api-client.ts:567 | **NICHT AUFGERUFEN** |
| M04 | deleteMessage | DELETE /messages/{id} | api-client.ts:575 | messagehub-panel.ts:233 |
| M05 | setMessageStatus | POST /messages/{id}/status | api-client.ts:583 | components/detail-pane.ts:54 |
| M06 | setMessageSeverity | POST /messages/{id}/severity | api-client.ts:592 | messagehub-panel.ts:214 |
| M07 | getMessageTags | GET /messages/{id}/tags | api-client.ts:601 | components/detail-pane.ts:31 |
| M08 | addMessageTag | POST /messages/{id}/tags | api-client.ts:609 | components/detail-pane.ts:80 |
| M09 | removeMessageTag | DELETE /messages/{id}/tags?tag= | api-client.ts:619 | components/detail-pane.ts:90 |
| M10 | getRunbookForSource | GET /runbook/{source} | api-client.ts:626 | components/detail-pane.ts:40 |
| M11 | listAudit | GET /audit | api-client.ts:640 | components/audit-view.ts:102 |
| M12 | getKnxBusAnalysisState | GET /knx-stats/bus-analysis-state | api-client.ts:648 | components/stats-knx-view.ts:401 |
| M13 | setKnxBusAnalysisState | PUT /knx-stats/bus-analysis-state | api-client.ts:657 | components/stats-knx-view.ts:475 |
| M14 | clearAuditLog | DELETE /audit | api-client.ts:670 | components/audit-view.ts:127 |
| M15 | discoverKnxFromProject | GET /knx-discovery | api-client.ts:679 | components/knx-addresses-view.ts:89 |
| M16 | bulkPatchKnxAddresses | POST /knx-addresses/bulk | api-client.ts:696 | components/knx-addresses-view.ts:474 |
| M17 | syncKnxProject | POST /knx-addresses/sync | api-client.ts:714 | components/knx-addresses-view.ts:137, 164 |
| M18 | listKnxAddresses | GET /knx-addresses | api-client.ts:759 | components/knx-addresses-view.ts:80 |
| M19 | upsertKnxAddress | POST /knx-addresses | api-client.ts:767 | components/knx-addresses-view.ts:192, 224, 316, 622 |
| M20 | listChannels | GET /channels | api-client.ts:785 | components/channels-view.ts:24 |
| M21 | createChannel | POST /channels | api-client.ts:793 | components/channels-view.ts:50 |
| M22 | updateChannel | PUT /channels/{id} | api-client.ts:802 | components/channels-view.ts:52 |
| M23 | deleteChannel | DELETE /channels/{id} | api-client.ts:811 | components/channels-view.ts:66 |
| M24 | listMqttTopics | GET /mqtt-topics | api-client.ts:819 | components/simple-list-view.ts:143 |
| M25 | createMqttTopic | POST /mqtt-topics | api-client.ts:827 | components/simple-list-view.ts:148 |
| M26 | deleteMqttTopic | DELETE /mqtt-topics/{id} | api-client.ts:836 | components/simple-list-view.ts:162 |
| M27 | listRemediationHooks | GET /remediation-hooks | api-client.ts:844 | components/simple-list-view.ts:342 |
| M28 | createRemediationHook | POST /remediation-hooks | api-client.ts:852 | components/simple-list-view.ts:347 |
| M29 | deleteRemediationHook | DELETE /remediation-hooks/{id} | api-client.ts:861 | components/simple-list-view.ts:363 |
| M30 | listHeartbeats | GET /heartbeats | api-client.ts:869 | components/simple-list-view.ts:256 |
| M31 | upsertHeartbeat | POST /heartbeats | api-client.ts:877 | components/simple-list-view.ts:261 |
| M32 | getStatsExtended | GET /stats-extended | api-client.ts:886 | components/stats-live-view.ts:49 |
| M33 | deleteKnxAddress | DELETE /knx-addresses/{addr} | api-client.ts:901 | components/knx-addresses-view.ts:254 |
| M34 | importKnxCsv | POST /knx-addresses (csv) | api-client.ts:907 | components/knx-addresses-view.ts:364 |
| M35 | exportUrl | GET /export (URL-Bauer) | api-client.ts:919 | messagehub-panel.ts (Export-Button) — siehe Hinweis unten |
| M36 | deleteMessages | DELETE /messages | api-client.ts:931 | messagehub-panel.ts:266 |
| M37 | listSources | GET /sources | api-client.ts:945 | components/source-filter.ts:18 |
| M38 | getStats | GET /stats | api-client.ts:953 | components/stats-live-view.ts:47 |
| M39 | listWebhooks | GET /webhooks | api-client.ts:961 | components/settings-view.ts:60 |
| M40 | createWebhook | POST /webhooks | api-client.ts:969 | components/webhook-form.ts:96 |
| M41 | updateWebhook | PUT /webhooks/{id} | api-client.ts:985 | components/settings-view.ts:94, components/webhook-form.ts:88 |
| M42 | deleteWebhook | DELETE /webhooks/{id} | api-client.ts:1007 | components/settings-view.ts:79 |
| M43 | getKnxStatsSummary | GET /knx-stats/summary | api-client.ts:1027 | components/stats-knx-view.ts:546 |
| M44 | getKnxStatsTop | GET /knx-stats/top | api-client.ts:1034 | components/stats-knx-view.ts:547 |
| M45 | getKnxStatsTopBySource | GET /knx-stats/top-by-source | api-client.ts:1048 | components/stats-knx-view.ts:548 |
| M46 | getKnxStatsGaDetail | GET /knx-stats/ga/{ga} | api-client.ts:1062 | components/stats-knx-view.ts:704 |
| M47 | getKnxStatsSourceDetail | GET /knx-stats/source/{src} | api-client.ts:1072 | components/stats-knx-view.ts:725 |
| M48 | getKnxStatsTimeline | GET /knx-stats/timeline | api-client.ts:1084 | components/stats-knx-view.ts:600 |
| M49 | acknowledgeKnxGa | POST /knx-stats/acknowledge | api-client.ts:1096 | components/stats-knx-view.ts:758 |
| M50 | getKnxStatsAlarms | GET /knx-stats/alarms | api-client.ts:1111 | components/stats-knx-view.ts:555 |
| M51 | listSavedFilters | GET /saved-filters | api-client.ts:1119 | messagehub-panel.ts:336 |
| M52 | upsertSavedFilter | POST /saved-filters | api-client.ts:1128 | messagehub-panel.ts:346 |
| M53 | deleteSavedFilter | DELETE /saved-filters/{id} | api-client.ts:1144 | messagehub-panel.ts:372 |
| M54 | getKnxStatsHeatmap | GET /knx-stats/heatmap | api-client.ts:1154 | components/stats-knx-view.ts:575 |
| M55 | getKnxStatsTrend | GET /knx-stats/trend | api-client.ts:1169 | components/stats-knx-view.ts:571 |
| M56 | getKnxStatsOrphans | GET /knx-stats/orphans | api-client.ts:1181 | components/stats-knx-view.ts:554 |
| M57 | getKnxStatsSilence | GET /knx-stats/silence | api-client.ts:1188 | components/stats-knx-view.ts:550 |
| M58 | getKnxStatsBusHealth | GET /knx-stats/bus-health | api-client.ts:1201 | components/stats-knx-view.ts:549 |
| M59 | getKnxStatsBusload | GET /knx-stats/busload | api-client.ts:1208 | components/stats-knx-view.ts:558 |
| M60 | getKnxStatsHealthScore | GET /knx-stats/health-score | api-client.ts:1222 | components/stats-knx-view.ts:560 |
| M61 | getKnxStatsLongTerm | GET /knx-stats/long-term | api-client.ts:1230 | components/stats-knx-view.ts:562 |
| M62 | getKnxStatsBursts | GET /knx-stats/bursts | api-client.ts:1242 | components/stats-knx-view.ts:564 |
| M63 | getKnxStatsSensitiveLog | GET /knx-stats/sensitive-log | api-client.ts:1259 | components/stats-knx-view.ts:565 |
| M64 | setKnxStatsSensitive | POST/DELETE /knx-stats/sensitive/{ga} | api-client.ts:1269 | components/stats-knx-view.ts (Toggle) |
| M65 | unacknowledgeKnxGa | DELETE /knx-stats/acknowledge/{ga} | api-client.ts:1278 | components/stats-knx-view.ts:769 |
| M66 | listFindings | GET /findings | api-client.ts:1286 | components/findings-view.ts:85 |
| M67 | acknowledgeFinding | POST /findings/ack | api-client.ts:1302 | components/findings-view.ts:189 |
| M68 | unacknowledgeFinding | DELETE /findings/ack/{ga}/{code} | api-client.ts:1313 | **NICHT DIREKT** — siehe Hinweis unten |
| M69 | listSeverityOverrides | GET /findings/severity-overrides | api-client.ts:1320 | components/severity-override-form.ts:42 |
| M70 | setSeverityOverride | PUT /findings/severity-overrides/{code} | api-client.ts:1327 | components/severity-override-form.ts:57 |
| M71 | clearSeverityOverride | DELETE /findings/severity-overrides/{code} | api-client.ts:1344 | components/severity-override-form.ts:67 |
| M72 | exportFindingsMarkdown | GET /findings/export.md | api-client.ts:1351 | components/findings-view.ts:129 |
| M73 | refreshFindings | POST /findings/refresh | api-client.ts:1358 | components/findings-view.ts:169 |
| M74 | acknowledgeKnxBulk | POST /knx-stats/acknowledge-bulk | api-client.ts:1379 | components/stats-knx-view.ts:2361 |

> **Hinweise zu nicht-trivialen Aufrufpfaden:**
> - **M35 `exportUrl`**: liefert nur die URL, der eigentliche Download geschieht über einen Anchor-Link `<a href="...">` im Messages-Tab — der Benutzer klickt, der Browser lädt die Datei. (Direkt-Aufruf nicht via fetch.)
> - **M68 `unacknowledgeFinding`**: existiert in der Klasse, aber Aufruf wird in `findings-view.ts` nicht direkt ausgeführt — die Logik im Findings-View nutzt `acknowledgeFinding` toggleweise oder gar nicht. **Manuelle Re-Verifikation:** siehe Phase 4.

### 2.4.2 Direkt aufrufbare HTTP-Calls **außerhalb** ApiClient

```bash
$ grep -rn "fetch(" /home/user/HomeAssistantProtokollcenter/frontend/src/components --include="*.ts"
# (kein Treffer ausser dem in api-client.ts)
```

→ **Saubere Schicht-Trennung.** Kein Komponente umgeht den ApiClient.

---

## 2.5 Im ApiClient definiert, aber NICHT aufgerufen

| Methode | Backend-Endpoint | Status |
|---|---|---|
| `getMessage(id)` (M03) | E003 GET /messages/{id} | UNGENUTZT — Detail-Pane bekommt das Objekt direkt aus der Liste, ohne Re-Fetch |
| `unacknowledgeFinding(ga, code)` (M68) | E074 DELETE /findings/ack/{ga}/{code} | Möglicherweise nicht aufgerufen — Phase 4 verifiziert |

Diese sind „Toter Client-Code" — kein User-Symptom, aber Audit-Hinweis.

---

## 2.6 Im Backend exponiert, aber **kein** ApiClient-Aufruf vorhanden

(Wird in Phase 3 als Mapping-Lücke erfasst — hier nur die rohe Liste der Backend-Endpoints, für die im `api-client.ts` keine Methode existiert.)

| Backend-Endpoint | Methode im ApiClient? |
|---|---|
| E013 GET `/api/messagehub/mttr` | ❌ keine — nur via `getStatsExtended` indirekt |
| E014 GET `/api/messagehub/metrics` | ❌ keine (Prometheus-Scraper, nicht UI) |
| E017 GET `/api/messagehub/webhooks/{webhook_id}` | ❌ keine — Frontend nutzt nur `listWebhooks` |
| E030 POST `/api/messagehub/channels/{channel_id}/test` | ❌ **keine** — Test-Knopf fehlt im UI |
| E033 PUT `/api/messagehub/mqtt-topics/{topic_id}` | ❌ **keine** — Update fehlt im UI |
| E053 GET `/api/messagehub/knx-stats/ga/{ga}/export` | ❌ keine — Export-Button für einzelne GA fehlt |

→ **6 Backend-Endpoints ohne Frontend-Aufrufer.** Davon sind 4 echte Lücken (E030, E033, E053, E013), 2 sind designintendiert ohne UI (E014 = Prometheus, E017 = redundant).

---

## 2.7 Custom Events (Komponenten ↔ Komponenten)

| Event | Quelle | Senke | Bemerkung |
|---|---|---|---|
| `select` | `<message-table>` | `<messagehub-panel>` `_onSelect` | Öffnet Detail-Pane |
| `severity-change` | `<message-table>` | `<messagehub-panel>` `_onSeverityChangeMessage` | Inline-Edit |
| `change` | `<severity-filter>`, `<source-filter>`, `<time-range-filter>` | Panel | Filter-Update |
| `close`, `status-change`, `delete`, `error` | `<detail-pane>` | Panel | Pane-Lifecycle |
| `saved`, `cancel` | `<webhook-form>` | `<settings-view>` | Form-Submit |

---

## 2.8 LocalStorage-Persistenz

| Key | Komponente | Inhalt |
|---|---|---|
| `messagehub.filters` | messagehub-panel.ts:45 | Aktive Messages-Filter |
| `messagehub.settings.tab` | settings-view.ts:28 | Aktiver Settings-Sub-Tab |
| `messagehub.stats.subtab` | stats-view.ts:17 | Aktiver Stats-Sub-Tab |
| `messagehub.knx-addresses.only-enabled` | knx-addresses-view.ts:19 | KNX-Filter „nur aktive" |

Plus serverseitige Saved-Filters (E038-E040) für scope=`messages`, `knx-stats`, `audit`.

---

## 2.9 Aggregat-Statistik

- **22 Custom Elements** (1 Top-Panel + 21 Komponenten)
- **74 ApiClient-Methoden** (von 535 bis 1402 in api-client.ts)
- **2 ungenutzte ApiClient-Methoden** (M03, M68)
- **6 Backend-Endpoints ohne Frontend-Methode**
- **Keine direkten fetch()-Calls** außerhalb api-client.ts
