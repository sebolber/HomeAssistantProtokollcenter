# Backlog `messagehub`

**Stand:** 2026-05-02 (nach Iter 69 — K2 Prometheus released; Code-
Review hat 37 Findings ergeben).

Sammelt alle nicht erledigten Themen aus den Quell-Dokumenten,
plus Code-Review-Findings vom 2026-05-02.

---

## 0. Manuell (kein Code)

| # | Was | Status |
|---|---|---|
| M2b | `manifest.json:version` auf `0.14.0` bumpen + Tag setzen | offen |
| M3 | PR an `home-assistant/brands` mit `assets/brands/messagehub/` | offen |
| M4 | Repository-Topics + Description auf GitHub-Repo | offen |
| M5 | Verifizieren: N4-Sync-Vorschau-Dialog | offen |
| M6 | Verifizieren: N2-Default beim Anlegen einer GA → severity=`warning` | offen |

## 1. Code-Review-Findings (HIGH-Severity zuerst)

### High

| # | Was | Datei | Aufwand |
|---|---|---|---|
| CR-1 | `api/messages.py` dupliziert die kompletten Helpers aus `api/_helpers.py` (`_ERR_*`, `_msg_to_dict`, `_get_repos`, `_RequireAdminView`). Refactor zur Auflösung der Duplikation. | `api/messages.py:56-220` | 1 Iter |
| CR-8 | N+1-Query in `compute_ga_detail._fetch_ga_meta`: ruft `top_by_ga(limit=500)` neu auf, nur um eine GA zu finden. Dedizierte Repo-Methode `ga_meta(ga, from, to)` einführen. | `processing/knx_stats_service.py:289-293,761-767` | 0.5 Iter |
| CR-32 | Keine Tests für `KnxStatsGaExportView` (Iter 68 — frischer Code). Hard-Cap, CSV-Quoting, JSON-Encoding ungeprüft. | `tests/unit/test_knx_stats_export*.py` (neu) | 0.5 Iter |
| CR-33 | Keine Tests für `compute_trend` (Iter 67 — frischer Code). Edge-Cases ungeprüft. | `tests/unit/test_knx_stats_trend.py` (neu) | 0.5 Iter |
| CR-37 | Per-View-Auth-Tests fehlen. `_check_admin` wird nirgends explizit gegen `is_admin=False` / `user=None` getestet. | `tests/unit/test_api_auth.py` (neu) | 0.5 Iter |

### Medium

| # | Was | Datei | Aufwand |
|---|---|---|---|
| CR-2 | 22 inline `noqa: PLC0415` Imports in `api/messages.py` — Lazy-Imports machen Code unleserlich | `api/messages.py:169,361,...` | 0.5 Iter |
| CR-4 | `MqttTopicDetailView` ohne `put`-Handler — Frontend muss DELETE+POST simulieren | `api/messages.py:1006-1031` | 0.5 Iter |
| CR-5 | `stats-knx-view.ts` ist 3131 Zeilen mit 25 `_render*`-Methoden — Aufteilung in Sub-Components | `frontend/src/components/stats-knx-view.ts` | 2 Iter |
| CR-9 | Per-GA-Loop in `ack_set_bulk` mit 100 fsync-Calls bei 100 GAs — `executemany` oder Multi-Row-INSERT | `storage/knx_stats_repo.py:866-885` | 0.5 Iter |
| CR-10 | Counter-Increment-N+1 im KNX-Hot-Path: 2 SQL-Calls pro Telegramm = 400/s bei Sturm | `listeners/knx.py:181-190` + `storage/knx_stats_repo.py:725-740` | 1 Iter |
| CR-11 | Kein Cache für `discover_knx_devices` — pro Stats-Request frisch geparst (3000+ GAs) | `processing/knx_discovery.py:220-236` | 0.5 Iter |
| CR-12 | `compute_top` lädt Bulk-Samples für ALLE 200 Top-GAs, sollte nur GAs ohne DPT betreffen | `processing/knx_stats_service.py:242-254` | 0.25 Iter |
| CR-16 | FTS5-MATCH-Injection: User-search-Param ungewrappt → DoS + Info-Leak via 500-Response | `storage/repositories.py:386-389` | 0.5 Iter |
| CR-17 | Alarm-Eventbus-Spam: dedup-Key fehlt zwischen Rate-Limit + Eventbus-Fire | `api/knx_stats.py:445-448` | 0.5 Iter |
| CR-18 | `ExportView` ohne Streaming — bei 100k Messages mehrere hundert MB im Memory | `api/messages.py:664-702` | 0.5 Iter |
| CR-19 | KNX-GA-Export hat keine `is_sensitive`-Prüfung — Admin kann sensitive GAs leise dumpen | `api/knx_stats.py:269-352` | 0.25 Iter |
| CR-21 | Channels-PUT/POST validieren `config` nicht — SSRF-Risiko via `webhook`-URLs | `api/messages.py:783-803,884-906` | 0.5 Iter |
| CR-23 | `compute_top` ist 67 Zeilen lang, Cognitive-Complexity ~17 (Limit 15) | `processing/knx_stats_service.py:220-287` | 0.25 Iter |
| CR-24 | `format_value` mit 8 Returns + Cognitive-Complexity hoch — Strategy-Pattern statt If-Else | `processing/knx_dpt.py:142-208` | 0.25 Iter |
| CR-27 | Mehrfach-Dispatch `_RequireAdminView` vs. `RequireAdminView` — beide existieren | `api/messages.py:186-193` + `api/_helpers.py:154-163` | nach CR-1 obsolet |
| CR-30 | Audit-Log-Fail wird nur als WARN geloggt, API-Call gilt erfolgreich | `api/_helpers.py:150-151` | 0.25 Iter |
| CR-34 | KNX-Listener-Hot-Path-Crash-Handling untested (`_record_bus_activity`-RuntimeError) | `tests/unit/test_knx_listener_*.py` | 0.25 Iter |
| CR-35 | `test_concurrency.py` testet nicht echte Concurrency — Stress-Test mit 1000 parallelen Inserts fehlt | `tests/unit/test_concurrency.py` | 0.5 Iter |
| CR-36 | Frontend `_load`-Race-Condition: zwei rapid Period-Wechsel → State-Inkonsistenz, kein AbortController | `frontend/src/components/stats-knx-view.ts:367-470` | 0.5 Iter |

### Low

| # | Was | Datei |
|---|---|---|
| CR-3 | Magic Numbers in `stats-knx-view.ts` (Trend-Schwellen 25/100/300, Bucket-Mapping pro Periode, Stille-Schwellen) | `:1799-1806,472-503,506-519` |
| CR-6 | `KnxStatsBusAnalysisStateView.get` ohne 503-Pfad bei DB-Init-Fail | `api/knx_stats.py:693-697` |
| CR-7 | Two-Source-of-Truth für „Bus-Analyse aktiv"-Flag (`HASS_KEY_KNX_BUS_ANALYSIS` + `_knx_shadow_counters_enabled`-Fallback) | `listeners/knx.py:170-176` |
| CR-13 | Kein Index auf `knx_ga_acknowledgements.expires_at` | `storage/sql/0018_knx_stats.sql:4-10` |
| CR-14 | `_top` wird bei jedem Sort kopiert, nicht memoized | `frontend/src/components/stats-knx-view.ts:1167-1169` |
| CR-15 | `_renderHaKnxLinks` baut `URLSearchParams` jeden Render | `frontend/src/components/stats-knx-view.ts:1409-1417` |
| CR-20 | `ChannelTestView` umgeht Throttle/Quiet-Hours komplett — Spam-Risiko | `api/messages.py:837-851` |
| CR-22 | Webhook `local_only=False`-Default sollte deutlicher dokumentiert werden | `__init__.py:87-94` |
| CR-25 | Inkonsistentes Naming `_get_repos` vs. `get_repos` | `api/messages.py:96` + `api/_helpers.py:70` |
| CR-26 | Dead `_ = dpt`-Assignment in `detect_patterns` | `processing/knx_stats.py:474` |
| CR-28 | Falsche Doku in `api/_helpers.py:11` („Auslagerung erlaubt..." aber unvollständig) | `api/_helpers.py:11` |
| CR-29 | Lokaler datetime-Import mit Alias `_dt` in `silence_detect` | `storage/knx_stats_repo.py:377-378` |
| CR-31 | Rate-Limit-Test ohne HTTP-Roundtrip — Drift-Risiko | `tests/unit/test_alarms_rate_limit.py:18-26` |

## 2. Erledigt seit Iter 58

| Iter | Inhalt |
|---|---|
| 59 | Bugs B1+B2+B3+B4 |
| 60 | UX-Quick-Wins Visual U1-U12 |
| 61 | UX-Quick-Wins Frontend-Logik U3+U9+U15 |
| 62 | WR-T DPT-Auto-Erkennung |
| 63 | U13 Anti-Pattern-Badge |
| 64 | WR-P HA-KNX-Direktlinks |
| 65 | P2-3 Rate-Limit /alarms |
| 66 | WR-V Multi-byte-ASCII-Decoder |
| 67 | WR-I Trend-Vergleich |
| 68 | WR-F GA-Werteverlauf-Export |
| 69 | K2 Prometheus /metrics |

## 3. Offen — Features

| # | Was | Aufwand |
|---|---|---|
| P2-1 | Schatten-Counter-Lese-API + UI | 2 Iter |
| P2-2 | Alarm-Schwellen via Config-Flow konfigurierbar | 1–2 Iter |
| WR-G | GA-Heatmap (Zeit × Geräte) | 2–3 Iter |
| K1 | Saved Filters serverseitig | 2 Iter |

## 4. Offene Konzept-Fragen (Entscheidung User)

| # | Frage |
|---|---|
| Q1 | Filter-Konfig: LocalStorage oder serverseitig? |
| Q2 | Default-Zeitraum 24h oder 7d? |
| Q3 | Acknowledge-Auto-Ablauf-Default sticky-Konfig nur per API ausreichend? |

## 5. Blocked

| # | Was | Grund |
|---|---|---|
| BL-D | ACK/NAK-Statistik | xknx liefert nur Group-Layer |
| BL-E | Telegram-Tracer | xknx-Limit |
| BL-M | InfluxDB-Bridge | User-Priorität niedrig |

---

## Empfohlene Umsetzungs-Reihenfolge (nach Iter 69)

Kriterium: **HIGH-Code-Review-Findings zuerst** (Test-Lücken in
frischem Code, klare Performance-Hot-Spots, Auth-Tests). Dann
MEDIUM-Findings priorisiert nach Security/Performance. Dann Features.
LOW-Findings als Sammel-Iter ans Ende.

| Reihenfolge | Iter | Inhalt | Aufwand |
|---|---|---|---|
| 1 | 70 | **CR-32 + CR-33**: Tests für `KnxStatsGaExportView` (Iter 68) und `compute_trend` (Iter 67) | 1 Iter |
| 2 | 71 | **CR-37**: Auth-Tests (Per-View `_check_admin`-Bypass + None-User-Pfade) | 0.5 Iter |
| 3 | 72 | **CR-1 + CR-25 + CR-27 + CR-28**: Helper-Duplikat-Refactor `api/messages.py` → `_helpers.py` | 1 Iter |
| 4 | 73 | **CR-8**: N+1-Query in `compute_ga_detail` mit dedizierter Repo-Methode | 0.5 Iter |
| 5 | 74 | **CR-16**: FTS5-MATCH-Injection (search-Param wrapping/escape) | 0.5 Iter |
| 6 | 75 | **CR-19 + CR-21**: Sensitive-GA-Export-Audit-Verschärfung + Channels-Config-Validation (SSRF) | 0.5 Iter |
| 7 | 76 | **CR-17**: Alarm-Eventbus-Dedup-Key gegen Spam | 0.5 Iter |
| 8 | 77 | **CR-12 + CR-23 + CR-24**: Performance-Refactor `compute_top` (filter-first) + cognitive-complexity-Splits | 0.5 Iter |
| 9 | 78 | **CR-9 + CR-10**: Bulk-INSERT für ack_set_bulk + KNX-Counter-Increment-Batching | 1 Iter |
| 10 | 79 | **CR-11 + CR-13**: Cache `discover_knx_devices` + Index auf `expires_at` | 0.5 Iter |
| 11 | 80 | **CR-18**: Streaming-Export in `ExportView` | 0.5 Iter |
| 12 | 81 | **CR-30**: Audit-Log-Fail-Handling (Repair-Issue/Error-Logging) | 0.25 Iter |
| 13 | 82 | **CR-31 + CR-34 + CR-35 + CR-36**: Test-Härtung — HTTP-Roundtrip + Concurrency + Frontend-Race | 1 Iter |
| 14 | 83 | **K2** released → **P2-2** Alarm-Schwellen via Config-Flow | 1–2 Iter |
| 15 | 84 | **P2-1** Schatten-Counter-Lese-API + UI | 2 Iter |
| 16 | 85 | **WR-G** GA-Heatmap | 2–3 Iter |
| 17 | 86 | **K1** Saved Filters serverseitig | 2 Iter |
| 18 | 87 | LOW-Sammel-Iter (CR-3, CR-5, CR-6, CR-7, CR-14, CR-15, CR-20, CR-22, CR-26, CR-29) | 1 Iter |
| 19 | parallel | M2b (Tag), M3 (Brand-PR), M4 (Repo-Topics), M5/M6 (Verify) | manuell |

**Begründung:**
- Tests für frischen Code (Iter 67-68) und Auth-Tests **zuerst** —
  Sustainability-Risiko durch ungeprüfte Code-Pfade.
- Helper-Duplikat-Refactor (CR-1) **früh**, weil viele andere
  Findings (CR-2, 25, 27, 28) davon abhängen.
- Performance-Hot-Spots (CR-8, 9, 10, 11, 12) gebündelt vor neuen
  Features — Bottlenecks beheben, bevor neue Features sie verschärfen.
- Security-Findings (CR-16, 17, 19, 21) priorisiert nach
  Exploit-Wahrscheinlichkeit.
- Features (P2-1, P2-2, WR-G, K1) erst **nach** Härtung.
- LOW-Findings als Sammel-Iter ans Ende — gemeinsam ein Iter.

---

**Hinweis zur Pflege:** Nach Abschluss eines Items hier streichen.
