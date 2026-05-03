# Phase 1 — Backend-Inventar

**Stand:** 2026-05-03
**Branch:** `claude/audit-frontend-integration-38eoO`
**Quelle:** `custom_components/messagehub/` (Home Assistant Custom Integration, Python)

> Hinweis zur Methodik: Das ursprüngliche Audit-Skript spricht von „REST-Controllern" im Java/Spring-Sinn. Diese Anwendung verwendet stattdessen Home-Assistant-`HomeAssistantView`-Klassen (aiohttp-basiert), HA-Services, HA-Webhooks und HA-Eventbus. Die Tabellen sind entsprechend angepasst.

---

## 1.1 Übersicht: Was zählt als „UseCase"?

| Kategorie | Anzahl | Beschreibung |
|---|---:|---|
| REST-Endpoints (HomeAssistantView-Klassen) | **57 URLs / 71 HTTP-Methoden** | Aufrufbar via `/api/messagehub/...` |
| HA-Services (`hass.services.async_register`) | **1** | `messagehub.add_message` |
| HA-Webhook-Handler (dynamisch) | **N** | `/api/webhook/<webhook_id>` — n abhängig von DB-Configs |
| HA-Bus-Events (`hass.bus.async_fire`) | **2** | `messagehub_message_added`, `messagehub_message_deleted` |
| Sensor-Entitäten | **11** | Counter, Last-Message, Health-Score |
| Binary-Sensor-Entitäten | **1** | Has unacknowledged errors |
| Repair-Issues | **2** | `knx_unavailable`, `mqtt_unavailable` |
| Periodische Jobs | **7** | Heartbeat, Anomaly, KNX-Cleanup, Bus-Findings, Retention, Weekly-Report, Pattern-Mining |
| Eventbus-Listener | **5** | system_log, state_changed, knx_event, dispatch, remediation |
| Dynamische MQTT-Subscriptions | **N** | aus DB-Configs |
| Optionaler Syslog-UDP-Listener | **1** | wenn aktiviert |
| Notification-Channel-Typen | **5** | telegram, pushover, ntfy, signal, notify |

---

## 1.2 REST-Endpoints (HomeAssistantView)

Alle Endpoints werden registriert in `custom_components/messagehub/api/messages.py:1359-1426` über `async_register_views(hass)`. Auth: alle Views erweitern `RequireAdminView` (HA-Admin-Token).

| ID | HTTP | Pfad | View-Klasse | Datei:Zeile | Kurz-Zweck |
|---|---|---|---|---|---|
| E001 | GET | `/api/messagehub/messages` | MessagesListView | api/messages.py:88 | Liste mit Filter & Pagination |
| E002 | DELETE | `/api/messagehub/messages` | MessagesListView | api/messages.py:88 | Bulk-Delete (gefiltert) |
| E003 | GET | `/api/messagehub/messages/{message_id}` | MessageDetailView | api/messages.py:170 | Einzelne Nachricht |
| E004 | DELETE | `/api/messagehub/messages/{message_id}` | MessageDetailView | api/messages.py:170 | Einzelne Nachricht löschen |
| E005 | POST | `/api/messagehub/messages/{message_id}/status` | MessageStatusView | api/messages.py:356 | Status setzen (new/ack/resolved) |
| E006 | POST | `/api/messagehub/messages/{message_id}/severity` | MessageSeverityView | api/messages.py:391 | Severity inline ändern |
| E007 | GET | `/api/messagehub/messages/{message_id}/tags` | MessageTagsView | api/messages.py:426 | Tags lesen |
| E008 | POST | `/api/messagehub/messages/{message_id}/tags` | MessageTagsView | api/messages.py:426 | Tag hinzufügen |
| E009 | DELETE | `/api/messagehub/messages/{message_id}/tags` | MessageTagsView | api/messages.py:426 | Tag entfernen (per query `?tag=`) |
| E010 | GET | `/api/messagehub/sources` | SourcesView | api/messages.py:208 | Distinct-Source-Liste |
| E011 | GET | `/api/messagehub/stats` | StatsView | api/messages.py:222 | Counter pro Severity, 24h |
| E012 | GET | `/api/messagehub/stats-extended` | StatsExtendedView | api/messages.py:1141 | Heatmap, Top-Sources, MTTR, Time-Series |
| E013 | GET | `/api/messagehub/mttr` | MttrView | api/messages.py:1164 | MTTR pro Source (Mean-Time-To-Resolution) |
| E014 | GET | `/api/messagehub/metrics` | MetricsView | api/messages.py:1283 | Prometheus-Text-Format |
| E015 | GET | `/api/messagehub/webhooks` | WebhooksView | api/messages.py:240 | Webhook-Configs lesen |
| E016 | POST | `/api/messagehub/webhooks` | WebhooksView | api/messages.py:240 | Webhook anlegen |
| E017 | GET | `/api/messagehub/webhooks/{webhook_id}` | WebhookDetailView | api/messages.py:286 | Einzelner Webhook |
| E018 | PUT | `/api/messagehub/webhooks/{webhook_id}` | WebhookDetailView | api/messages.py:286 | Webhook ändern |
| E019 | DELETE | `/api/messagehub/webhooks/{webhook_id}` | WebhookDetailView | api/messages.py:286 | Webhook löschen |
| E020 | GET | `/api/messagehub/audit` | AuditLogView | api/messages.py:505 | Audit-Log lesen |
| E021 | DELETE | `/api/messagehub/audit` | AuditLogView | api/messages.py:505 | Audit-Log komplett leeren |
| E022 | GET | `/api/messagehub/export` | ExportView | api/messages.py:550 | Streaming-Export (jsonl/csv) |
| E023 | GET | `/api/messagehub/heartbeats` | HeartbeatsView | api/messages.py:630 | Heartbeat-Sources lesen |
| E024 | POST | `/api/messagehub/heartbeats` | HeartbeatsView | api/messages.py:630 | Heartbeat anlegen/upsert |
| E025 | GET | `/api/messagehub/runbook/{source}` | RunbookForView | api/messages.py:478 | Runbook für Source |
| E026 | GET | `/api/messagehub/channels` | ChannelsView | api/messages.py:681 | Notification-Channels lesen |
| E027 | POST | `/api/messagehub/channels` | ChannelsView | api/messages.py:681 | Channel anlegen |
| E028 | PUT | `/api/messagehub/channels/{channel_id}` | ChannelDetailView | api/messages.py:824 | Channel ändern |
| E029 | DELETE | `/api/messagehub/channels/{channel_id}` | ChannelDetailView | api/messages.py:824 | Channel löschen |
| E030 | POST | `/api/messagehub/channels/{channel_id}/test` | ChannelTestView | api/messages.py:758 | Test-Nachricht über Channel (rate-limited) |
| E031 | GET | `/api/messagehub/mqtt-topics` | MqttTopicsView | api/messages.py:904 | MQTT-Topic-Subscriptions lesen |
| E032 | POST | `/api/messagehub/mqtt-topics` | MqttTopicsView | api/messages.py:904 | MQTT-Topic anlegen |
| E033 | PUT | `/api/messagehub/mqtt-topics/{topic_id}` | MqttTopicDetailView | api/messages.py:971 | MQTT-Topic ändern (Iter 83 / CR-4) |
| E034 | DELETE | `/api/messagehub/mqtt-topics/{topic_id}` | MqttTopicDetailView | api/messages.py:971 | MQTT-Topic löschen |
| E035 | GET | `/api/messagehub/remediation-hooks` | RemediationHooksView | api/messages.py:1047 | Auto-Remediation-Hooks lesen |
| E036 | POST | `/api/messagehub/remediation-hooks` | RemediationHooksView | api/messages.py:1047 | Hook anlegen |
| E037 | DELETE | `/api/messagehub/remediation-hooks/{hook_id}` | RemediationHookDetailView | api/messages.py:1113 | Hook löschen |
| E038 | GET | `/api/messagehub/saved-filters` | SavedFiltersView | api/messages.py:1190 | Saved-Filters lesen (scope) |
| E039 | POST | `/api/messagehub/saved-filters` | SavedFiltersView | api/messages.py:1190 | Saved-Filter upsert |
| E040 | DELETE | `/api/messagehub/saved-filters/{filter_id}` | SavedFilterDetailView | api/messages.py:1251 | Saved-Filter löschen |
| E041 | GET | `/api/messagehub/knx-discovery` | KnxProjectDiscoveryView | api/knx.py:49 | KNX-Projekt-GAs (Auto-Vervollständigung) |
| E042 | POST | `/api/messagehub/knx-addresses/sync` | KnxProjectSyncView | api/knx.py:73 | ETS-Sync mit Plan/Apply |
| E043 | GET | `/api/messagehub/knx-addresses` | KnxAddressesView | api/knx.py:163 | KNX-Gruppenadressen lesen |
| E044 | POST | `/api/messagehub/knx-addresses` | KnxAddressesView | api/knx.py:163 | GA upsert oder CSV-Import |
| E045 | POST | `/api/messagehub/knx-addresses/bulk` | KnxAddressBulkView | api/knx.py:239 | Bulk-Patch (max 500) |
| E046 | DELETE | `/api/messagehub/knx-addresses/{address}` | KnxAddressDetailView | api/knx.py:334 | Einzel-GA löschen |
| E047 | GET | `/api/messagehub/knx-stats/summary` | KnxStatsSummaryView | api/knx_stats.py:125 | KNX-Bus Summary KPIs |
| E048 | GET | `/api/messagehub/knx-stats/top` | KnxStatsTopView | api/knx_stats.py:140 | Top-GAs nach Telegrammrate |
| E049 | GET | `/api/messagehub/knx-stats/top-by-source` | KnxStatsTopBySourceView | api/knx_stats.py:181 | Top-Source-Geräte |
| E050 | GET | `/api/messagehub/knx-stats/ga/{ga}` | KnxStatsGaDetailView | api/knx_stats.py:220 | GA-Detail mit Findings/Sibling |
| E051 | GET | `/api/messagehub/knx-stats/source/{dev_source}` | KnxStatsSourceDetailView | api/knx_stats.py:256 | Source-Detail (Iter D) |
| E052 | GET | `/api/messagehub/knx-stats/timeline` | KnxStatsTimelineView | api/knx_stats.py:316 | Telegramm-Timeline für GAs |
| E053 | GET | `/api/messagehub/knx-stats/ga/{ga}/export` | KnxStatsGaExportView | api/knx_stats.py:350 | Export einer GA als CSV/JSON |
| E054 | GET | `/api/messagehub/knx-stats/heatmap` | KnxStatsHeatmapView | api/knx_stats.py:424 | GA-Heatmap (Iter 91) |
| E055 | GET | `/api/messagehub/knx-stats/trend` | KnxStatsTrendView | api/knx_stats.py:458 | Periode vs. Vorperiode |
| E056 | GET | `/api/messagehub/knx-stats/alarms` | KnxStatsAlarmsView | api/knx_stats.py:487 | KNX-Bus-Alarme |
| E057 | GET | `/api/messagehub/knx-stats/orphans` | KnxStatsOrphansView | api/knx_stats.py:588 | Orphan-Adressen (Discovery vs. Log) |
| E058 | GET | `/api/messagehub/knx-stats/silence` | KnxStatsSilenceView | api/knx_stats.py:616 | Stille Sources |
| E059 | GET | `/api/messagehub/knx-stats/sensitive-log` | KnxStatsSensitiveLogView | api/knx_stats.py:662 | Sensitive Telegramme |
| E060 | POST | `/api/messagehub/knx-stats/sensitive/{ga}` | KnxStatsSensitiveSetView | api/knx_stats.py:681 | Sensitive markieren |
| E061 | DELETE | `/api/messagehub/knx-stats/sensitive/{ga}` | KnxStatsSensitiveSetView | api/knx_stats.py:681 | Sensitive entfernen |
| E062 | GET | `/api/messagehub/knx-stats/bursts` | KnxStatsBurstsView | api/knx_stats.py:718 | Burst-Events |
| E063 | GET | `/api/messagehub/knx-stats/long-term` | KnxStatsLongTermView | api/knx_stats.py:759 | Long-Term-Aggregate |
| E064 | GET | `/api/messagehub/knx-stats/bus-analysis-state` | KnxStatsBusAnalysisStateView | api/knx_stats.py:810 | Bus-Analyse aktiv? |
| E065 | PUT | `/api/messagehub/knx-stats/bus-analysis-state` | KnxStatsBusAnalysisStateView | api/knx_stats.py:810 | Bus-Analyse an/aus |
| E066 | GET | `/api/messagehub/knx-stats/health-score` | KnxStatsHealthScoreView | api/knx_stats.py:860 | KNX-Health-Score |
| E067 | GET | `/api/messagehub/knx-stats/busload` | KnxStatsBusloadView | api/knx_stats.py:897 | Busload-Series |
| E068 | GET | `/api/messagehub/knx-stats/bus-health` | KnxStatsBusHealthView | api/knx_stats.py:928 | Wiederholungs-Statistik |
| E069 | POST | `/api/messagehub/knx-stats/acknowledge` | KnxStatsAcknowledgeView | api/knx_stats.py:955 | GA acknowledge |
| E070 | POST | `/api/messagehub/knx-stats/acknowledge-bulk` | KnxStatsAcknowledgeBulkView | api/knx_stats.py:993 | Bulk-Acknowledge nach Source |
| E071 | DELETE | `/api/messagehub/knx-stats/acknowledge/{ga}` | KnxStatsAcknowledgeDetailView | api/knx_stats.py:1054 | Acknowledge entfernen |
| E072 | GET | `/api/messagehub/findings` | FindingsListView | api/findings.py:62 | KNX-Konfig-Findings lesen |
| E073 | POST | `/api/messagehub/findings/ack` | FindingsAckView | api/findings.py:104 | Finding ack |
| E074 | DELETE | `/api/messagehub/findings/ack/{ga}/{code}` | FindingsAckDetailView | api/findings.py:139 | Finding-Ack entfernen |
| E075 | GET | `/api/messagehub/findings/severity-overrides` | FindingsSeverityOverridesView | api/findings.py:159 | Severity-Overrides lesen |
| E076 | PUT | `/api/messagehub/findings/severity-overrides/{code}` | FindingsSeverityOverrideDetailView | api/findings.py:173 | Override setzen |
| E077 | DELETE | `/api/messagehub/findings/severity-overrides/{code}` | FindingsSeverityOverrideDetailView | api/findings.py:173 | Override entfernen |
| E078 | GET | `/api/messagehub/findings/export.md` | FindingsMarkdownExportView | api/findings.py:218 | Findings als Markdown |
| E079 | POST | `/api/messagehub/findings/refresh` | FindingsRefreshView | api/findings.py:235 | Per-GA-Detector-Runner triggern |

> **Statische Pfade (nicht in obiger Tabelle):**
> - Sidebar-Panel-Bundle: `GET /messagehub-panel/messagehub-panel.js?v=<mtime>` → registriert in `__init__.py:546-561` über `register_static_path` bzw. `async_register_static_paths`
> - Webhook-Empfang (HA-natives `webhook`-System): `POST /api/webhook/<webhook_id>` → Handler in `__init__.py:74-95` via `ha_webhook.async_register`, Implementation in `ingestion/webhook.py:async_handle_webhook`

---

## 1.3 HA-Services

| ID | Domain.Service | Felder | Datei:Zeile | Kurz-Zweck |
|---|---|---|---|---|
| S001 | `messagehub.add_message` | severity, source, text, metadata? | `__init__.py:631-644` (Registrierung), `services.yaml:1-38` (Schema), `__init__.py:647-678` (Handler) | Manuell Nachricht via HA-Service einfügen — feuert `messagehub_message_added` |

---

## 1.4 HA-Webhooks

| ID | URL-Pattern | Handler | Datei:Zeile | Kurz-Zweck |
|---|---|---|---|---|
| W001 | `POST /api/webhook/<webhook_id>` | `async_handle_webhook` | `__init__.py:74-95` (Registrierung), `ingestion/webhook.py:1-225` (Handler) | Externe Quellen (Pi-hole, Skripte, IoT) → Message; JSONPath-Mapping; GeoIP-Anreicherung; Body-Limit 64 KB; Rate-Limit 60 req/min |

---

## 1.5 Domain-Events (HA-Eventbus)

| ID | Event-Name | Konstante | Gefeuert in | Konsumiert von |
|---|---|---|---|---|
| EV001 | `messagehub_message_added` | `EVENT_MESSAGE_ADDED` (const.py:62) | `helpers.py:20`, `__init__.py:668`, `ingestion/webhook.py:126` | Dispatch-Listener (`__init__.py:266`), Remediation-Listener (`__init__.py:330`), Sensoren (`sensor.py:98-101`), Binary-Sensor (`binary_sensor.py:55-56`) |
| EV002 | `messagehub_message_deleted` | `EVENT_MESSAGE_DELETED` (const.py:63) | `api/messages.py:112` (bulk), `api/messages.py:203` (single) | Sensoren, Binary-Sensor (Refresh-Coalescing) |

---

## 1.6 HA-Entitäten (außerhalb des Panels)

| ID | Plattform | Entity-ID-Suffix | Klasse | Datei:Zeile | Zweck |
|---|---|---|---|---|---|
| EN001 | sensor | `_total` | TotalMessagesSensor | sensor.py | Gesamtzahl Nachrichten |
| EN002 | sensor | `_errors_24h` | ErrorsLast24hSensor | sensor.py | Fehler letzte 24 h |
| EN003 | sensor | `_warnings_24h` | WarningsLast24hSensor | sensor.py | Warnungen letzte 24 h |
| EN004 | sensor | `_last_message` | LastMessageSensor | sensor.py | Text der neuesten Nachricht (gekürzt + Attribute) |
| EN005 | sensor | `_source_health` | SourceHealthSensor | sensor.py | Worst-Source-Health (0-100 %) |
| EN006 | sensor | `_errors_total` | ErrorsTotalSensor | sensor.py | Errors all-time |
| EN007 | sensor | `_warnings_total` | WarningsTotalSensor | sensor.py | Warnings all-time |
| EN008 | sensor | `_info_total` | InfoTotalSensor | sensor.py | Info all-time |
| EN009 | sensor | `_debug_total` | DebugTotalSensor | sensor.py | Debug all-time |
| EN010 | sensor | `_messages_1h` | MessagesLast1hSensor | sensor.py | Letzte Stunde |
| EN011 | sensor | `_messages_7d` | MessagesLast7dSensor | sensor.py | Letzte 7 Tage |
| EN012 | binary_sensor | `_has_unacknowledged_errors` | HasUnacknowledgedErrorsBinarySensor | binary_sensor.py | device_class=problem |

| ID | Repair-Issue | Schweregrad | Datei | Beschreibung |
|---|---|---|---|---|
| R001 | `knx_unavailable` | warning | repair.py | KNX-GAs konfiguriert, KNX-Integration aber down |
| R002 | `mqtt_unavailable` | warning | repair.py | MQTT-Topics konfiguriert, MQTT-Integration aber down |

---

## 1.7 Periodische Jobs / Listeners

| ID | Job | Trigger | Datei:Zeile | Zweck |
|---|---|---|---|---|
| J001 | Heartbeat-Tick | alle 60 s | `jobs/periodic.py` | „Stille Source"-Erkennung |
| J002 | Anomaly-Tick | alle 60 s | `jobs/periodic.py` | EWMA + 3σ Burst-Detection |
| J003 | KNX-Stats-Cleanup | alle 6 h | `jobs/periodic.py` | DB-Pruning |
| J004 | Bus-Wide-Findings | alle 15 min (default) | `jobs/periodic.py` | KNX-Detector-Runner |
| J005 | Retention-Cleanup | tgl. 03:30 | `__init__.py:486` | Severity-spezifisch + sonntags VACUUM |
| J006 | Weekly-Report | So. 23:00 | `__init__.py:369` | Markdown via `notify`-Service |
| J007 | Pattern-Mining | tgl. 04:15 | `__init__.py:414` | Erzeugt `messagehub.pattern`-Messages |
| L001 | system_log_event Listener | HA-Bus | `__init__.py:237` | Ingestion: HA-Logs → Messages |
| L002 | state_changed Listener | HA-Bus | `__init__.py:238` | Ingestion: unavailable-Entitäten |
| L003 | knx_event Listener | HA-Bus | `listeners/knx.py:297` | Fallback (wenn xknx-Hook nicht da) |
| L004 | Dispatch-Listener | EV001 | `__init__.py:266` | Notification-Channels feuern |
| L005 | Remediation-Listener | EV001 | `__init__.py:330` | Auto-Hooks ausführen / Vorschläge loggen |
| L006 | MQTT-Subscriptions | dynamisch | `listeners/mqtt.py:19-74` | Pro DB-Topic eine Sub. |
| L007 | Syslog-UDP | optional | `listeners/syslog.py:25-69` | RFC-3164 → Messages |

---

## 1.8 Notification-Channel-Typen

Implementiert in `notifications/dispatch.py:71-75`, native HTTP-Adapter in `notifications/native_adapters.py`.

| ID | Channel-Typ | Handler | Datei | Bemerkung |
|---|---|---|---|---|
| C001 | telegram | `telegram_send` | native_adapters.py:32 | Direkt HTTP an Telegram-API |
| C002 | pushover | `pushover_send` | native_adapters.py:56 | Direkt HTTP an Pushover-API |
| C003 | ntfy | `ntfy_send` | native_adapters.py:87 | Direkt HTTP an ntfy-Server |
| C004 | signal | `_ha_notify_handler` | dispatch.py:20-46 | Über HA-`notify.<service>` |
| C005 | notify | `_ha_notify_handler` | dispatch.py:20-46 | Generischer Fallback |

Channel-Konfiguration via Endpoints E026-E030.

---

## 1.9 WebSocket-API

**Status:** Keine `@websocket_api.websocket_command`-Dekoratoren oder `async_register_command`-Aufrufe gefunden, obwohl `manifest.json:7` die `websocket_api`-Dependency deklariert. **Tote Dependency** — sollte als Finding gemeldet werden (nicht kritisch, kein User-Symptom, aber Lint).

---

## 1.10 Storage-Schicht (nicht direkt UseCase, aber relevant)

Repositories in `storage/`:
- `MessageRepository` — Messages-CRUD
- `WebhookConfigRepository` — Webhook-Configs
- `FindingsRepository` — KNX-Findings
- `KnxStatsRepository` — KNX-Telegramme + Aggregates
- `SavedFiltersRepository` — gespeicherte Filter
- `SettingsRepository` — Key-Value-Settings
- `MqttTopicRepository` (in `ingestion/mqtt_repo.py`)
- `RemediationHookRepository` (in `processing/remediation_repo.py`)
- `KnxAddressRepository` (in `processing/knx_repo.py`)
- `ChannelRepository` (in `notifications/repository.py`)
- `HeartbeatRepository` (in `processing/heartbeat.py`)
- `AuditRepository` (in `api/audit.py`)
- `RunbookRepository` (in `processing/runbooks.py`)

---

## 1.11 Aggregat-Statistik

- **57 unique URLs** mit insgesamt **71 HTTP-Methoden**.
- 49× GET / 18× POST / 4× PUT / 14× DELETE.
- **57 View-Klassen** registriert in `async_register_views`.
- **0 WebSocket-Commands** trotz Dependency.
- **1 Service**, **2 Events**, **12 HA-Entitäten**, **2 Repair-Issues**, **7 periodische Jobs**, **5 Channel-Typen**.
