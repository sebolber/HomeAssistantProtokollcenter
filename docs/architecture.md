# Architecture-Stand v0.25.x (Iter A1–H2)

**Status:** Single-Source-of-Truth fuer den **aktuellen** Aufbau.
Konzeptpapiere in ``docs/messagehub_konzept.md`` und
``docs/messagehub_knx_konfigurationsfehler_recherche.md`` sind
historisch und nicht mehr aktiv.

---

## 1. Ueberblick

```
┌──────────────────────────────────────────────────────────────┐
│  Home Assistant Eventloop                                    │
│                                                              │
│   ┌────────────────┐     ┌────────────────┐                  │
│   │ KNX-Listener   │     │ Webhook-Handler│                  │
│   │ (xknx-Hook)    │     │ (HA-API)       │                  │
│   └────────┬───────┘     └────────┬───────┘                  │
│            │ enqueue                │                        │
│            ▼                        ▼                        │
│   ┌────────────────────┐   ┌────────────────────┐            │
│   │ KnxIngestWorker    │   │ MessageRepository  │            │
│   │ (Worker-Queue +    │   │ (insert_or_aggreg.)│            │
│   │  Batch-Flush)      │   │                    │            │
│   └─────────┬──────────┘   └────────┬───────────┘            │
│             │ executemany           │ insert + UPSERT        │
│             ▼                       ▼                        │
│       ┌──────────────────────────────────────┐               │
│       │   SQLite WAL                         │               │
│       │   - knx_raw_telegrams (48h)          │               │
│       │   - knx_telegram_counters (365d)     │               │
│       │   - messages (severity-spez.)        │               │
│       │   - knx_findings, _acks, _overrides  │               │
│       └──────────────────────────────────────┘               │
│             ▲                       ▲                        │
│             │                       │                        │
│   ┌─────────┴──────┐   ┌────────────┴────────┐               │
│   │ Findings-Runner│   │ Stats-Service       │               │
│   │ (per-GA + bus) │   │ (Aggregate fuer UI) │               │
│   └─────────┬──────┘   └────────┬────────────┘               │
│             │                   │                            │
│             ▼                   ▼                            │
│       ┌─────────────────────────────┐                        │
│       │    REST-API (HTTP-Views)    │                        │
│       └─────────────────────────────┘                        │
│             ▲                                                │
└─────────────┼────────────────────────────────────────────────┘
              │
              ▼
       Browser / Lit-Panel (Sub-Tabs: Live | KNX | Findings)
```

## 2. Datenmodell — Speicher-Verantwortung

| Tabelle | Retention | Verantwortung | Schreiber | Leser |
|---|---|---|---|---|
| ``messages`` | severity-spezifisch (7-365 d) | User-Logbuch (whitelisted GAs + Webhook + MQTT + ...) | `MessageRepository.insert_or_aggregate` | Messages-Tab (REST), Sensoren |
| ``knx_raw_telegrams`` | 48 h (Hard-Cap 5 Mio Rows) | Hot-Window fuer Detektoren + Anti-Pattern + Stats | `KnxStatsRepository.insert_raw_batch` (via `KnxIngestWorker`) | findings_runner, knx_stats_service |
| ``knx_telegram_counters`` | 365 Tage | Long-Term-Aggregat (Stunden-Bucket pro GA) | `KnxStatsRepository.increment_counter_batch` | Trend-Vergleich, Long-Term-Sicht |
| ``knx_group_addresses`` | persistent | KNX-Whitelist + log_enabled + DPT (Soll + Ist) | `KnxAddressRepository`, ETS-Sync | Listener, alle Detektoren |
| ``knx_findings`` | persistent | Append-only-Log mit Dedup ueber `(code, ga, source, evidence_hash, schema_version)` | `FindingsRepository.record` (via Runner) | API, UI |
| ``knx_finding_acknowledgements`` | bis Ablauf | User-Acks pro `(ga, finding_code)` | `FindingsRepository.acknowledge` | API |
| ``knx_finding_severity_overrides`` | persistent | Default-Severity-Overrides pro Code | `FindingsRepository.set_severity_override` | resolve_severity |
| ``knx_devices`` | persistent | User-Override fuer Hersteller/Modell pro Source | `KnxDeviceRepository` | knx_recommend_service |
| ``knx_recommendation_cache`` | 30 Tage TTL | LLM-Antwort-Cache (Iter L4) | `RecommendationCacheRepository.set` | Recommendation-Service |
| ``audit_log`` | persistent | Aenderungen an Acks, Settings, Severity-Overrides | div. Audit-Helpers | API |

**Single-Source-of-Truth-Regeln (Iter A2):**

- Bus-weite Anti-Pattern-Erkennung liest ausschliesslich aus
  ``knx_raw_telegrams`` (48h-Hot-Window).
- Trend / Long-Term liest aus ``knx_telegram_counters``
  (365 d, Stunden-Bucket).
- ``messages`` ist die User-sichtbare Logbuch-Tabelle; KNX-Eintraege
  hier sind Whitelist-getrieben (`log_enabled=1`) und werden mit
  ``insert_or_aggregate`` deduppliert.

## 3. Hot-Path: KNX-Listener

```
xknx-Hook (sync) ─► hass.async_create_task(_handle_telegram)
                    │
                    ▼
                 _ingest()  ◄── (knx_event-Bus-Fallback)
                    │
                    ├─► worker.enqueue(td)        # synchron, nicht-blockierend
                    │       │
                    │       ▼
                    │   asyncio-Queue (max 5000)
                    │       │   (DoS-Schutz: aelteste droppen)
                    │       ▼
                    │   Worker-Loop
                    │   - flush_interval 0.25 s ODER
                    │   - max_batch_size 100
                    │       │
                    │       ▼
                    │   insert_raw_batch + increment_counter_batch
                    │   (executemany, ein Commit)
                    │
                    ├─► cache.get(ga)             # Whitelist-Lookup (LRU)
                    │
                    └─► (wenn whitelisted)
                        repository.insert_or_aggregate
                        + fire_message_added
```

**Properties (Iter A1):**
- Pro Telegramm hoechstens 1 sync `enqueue` + 1 async `cache.get`.
- DB-Schreib-Operationen laufen **batched** im Worker — bei voller TP1-
  Last (~48 Tel/s) ergeben sich nur ~2 fsyncs/s.
- Crash im Worker bricht den Hot-Path nicht (Resilienz-Pattern).
- WAL-Checkpoint-Job alle 6 h (Iter A2) verhindert WAL-Wachstum.

## 4. Findings-Pipeline

### Detektor-Inventar

**Per-GA (on-demand via API ``POST /findings/refresh``):**
- DPT_MISMATCH (severity ``warning``, Iter B2)
- VALUE_OUT_OF_RANGE (severity ``error``)
- MULTI_RESPONDER, READ_NO_RESPONSE, TOGGLE_LOOP
- REPEAT_APPROXIMATION, SEND_TO_NOWHERE
- PATTERN_* (Lift aus Anti-Pattern-Detector)

**Bus-weit (periodisch alle 15 Min):**
- HEALTH_REPEAT_RATE / _BUSLOAD / _SILENCE / _ALARMS
  (Repeat-KPI als Approximation markiert, Iter B3)
- RECONNECT_STORM (per Source)
- MULTI_TIME_MASTER (auf Clock-DPTs)
- SEND_CYCLE_DRIFT (24h vs. 7d Baseline)
- ORPHAN_GA, STALE_GA (auf Whitelist)

**Spezial-Marker (Iter A3):**
- ANALYSIS_DISABLED — wenn Bus-Analyse-Toggle aus, statt aller anderen.

### Dedup-Vertrag (Iter B1)

Pro Code definiert ``KNX_FINDING_IDENTITY_FIELDS`` ein Set von
Identitaets-Evidence-Schluesseln. Nur diese gehen in den
SHA-256-Hash; variable Werte (burst_count, ratio, ...) bleiben in der
Evidence, fliessen aber NICHT in den Dedup-Schluessel ein. UNIQUE-Index
``uniq_knx_findings_dedup_v2`` enthaelt zusaetzlich ``COALESCE(source, '')``.

Beispiel:
```
RECONNECT_STORM (ga=null, source="1.1.5"):
  identity_fields = ()                       ← leer; (code, source) reicht
  evidence:
    silence_until      ← variabel
    burst_count        ← variabel (nur als Beobachtung)
    factor             ← variabel
  → Hash konstant ueber alle Detector-Runs;
  → occurrence_count zaehlt korrekt hoch.
  → evidence_json wird beim UPSERT mit dem AKTUELLEN Stand
    ueberschrieben (User sieht den letzten Wert).
```

### Severity-Aufloesung (Iter B4)

API liefert pro Item die Severity, die durch ``resolve_severity`` zur
**Laufzeit** ermittelt wird (User-Override > Default in const.py >
Detector-Output). Alte DB-Rows mit veralteter Severity werden ohne
Migration korrekt dargestellt.

## 5. Recommendation-Engine

```
GET /api/messagehub/knx-stats/source/{ia}/recommendation
   │
   ▼
KnxRecommendService.compute_device_recommendation
   ├─► Layer 1: knx_dpt_recommendations
   ├─► Layer 2: knx_devices (User-Override) + ETS-Discovery + Modell-Tabelle
   ├─► Layer 3: Live-Anomalie (Buslast-Override + Findings-Boost)
   └─► Layer 4: LLM-Fallback (opt-in)
       │
       └─► RecommendationCacheRepository
           Cache-Key = sha256(provider, model, dpt, manufacturer,
                              device_model, prompt_version, api_key_fingerprint)
                                                              │
                                                              └── Iter C2
```

## 6. Frontend-Layer

```
messagehub-panel
├── auth-race-Schutz (Iter D3): wartet auf hass.auth
├── live-update-buffer (Iter D6): rAF-Throttling
├── live-subscribe Wrapper (Iter D5): Reconnect-faehig
├── persisted-state (Iter E3): versionierte LS-Persistenz
└── Sub-Views:
    ├── messages (Tabelle + Filter + Bulk-Delete)
    ├── stats-view
    │   ├── stats-live-view (Live-Status)
    │   ├── stats-knx-view (KNX-Bus-Analyse)
    │   │   ├── _load() Race-Token (Iter D4)
    │   │   ├── 14 Cards (Top-Sender, Heatmap, Trend, ...)
    │   │   └── mh-drawer (Iter D2): GA-Detail + Source-Detail
    │   └── findings-view
    │       ├── mh-drawer (Iter D2)
    │       ├── _refreshAll mit Concurrency-Cap (Iter D7)
    │       └── i18n via findings-i18n.generated (Iter E1)
    ├── settings-view
    └── audit-view
```

**i18n-SoT (Iter E1):**
``custom_components/messagehub/translations/*.json`` ist die
einzige Wahrheit. Pre-Build-Hook ``npm run prebuild`` ruft
``scripts/generate-findings-i18n.mjs`` und schreibt
``frontend/src/utils/findings-i18n.generated.ts`` mit allen 6 Sprachen.

**hass.locale (Iter E2):**
``_lang()`` priorisiert ``hass.locale.language`` als HA-kanonische
Quelle, dann document.lang, dann navigator.language.

## 7. Deployment / Build

- Bundle ist im Commit (HACS hat keinen Build-Step).
- Cache-Buster aus Bundle-Inhalts-Hash (Iter F3).
- Generator + Pre-Build Hook stellen i18n-Konsistenz sicher.

## 8. Konzeptionelle Aufgaben — offen

- **B5 / Lift-Adapter konsolidieren** — Anti-Pattern-Detektoren direkt
  auf neuen Vertrag heben, statt durch ``lift_pattern_findings`` zu
  schicken.
- **C1 / Recommendation Closed-Loop** — Status-Tracking
  (pending/applied/dismissed/expired) pro Recommendation-Hash.
- **D1 / stats-knx-view aufteilen** — 5300+ Zeilen in eigenstaendige
  Card-Sub-Komponenten zerlegen.
- **F1 / ETS-Sync mit Audit + Undo** — User-Config-Reset bei `update`-
  Bucket protokollieren + reversibel machen.
- **D9 / Virtualisierung** — Lit-Virtualizer fuer message-table bei
  > 1000 Items.
- **G1 / Schema-Driven-Form-Generator** — Forms zentralisieren.

Diese Punkte sind im Backlog separat dokumentiert; die hier
beschriebenen Pfade sind bewusst stabil gewaehlt und decken den
aktuellen Stand v0.25.x.
