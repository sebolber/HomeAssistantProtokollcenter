# Plan: KNX-Sende-Modus-Empfehlungs-Engine (L1–L4 + Release)

**Status:** Entwurf, zur iterativen Abarbeitung in messagehub.
**Ziel-Release:** v0.25.0
**Vorbedingung:** v0.24.0 ist released (Phase 8 abgeschlossen).

---

## 0. Mission

Pro KNX-Geraet (`dev_source`, IA wie `1.1.220`) eine **datengetriebene
Empfehlung** geben:

1. **Aktueller Sende-Modus**: zyklisch / bei Aenderung / hybrid / stumm.
2. **Empfohlener Sende-Modus** + ggf. **Zyklusdauer** + **Hysterese**.
3. **Begruendung** (welcher Layer hat die Empfehlung gegeben + warum).
4. **Konfidenz** (wie tragfaehig die Datenbasis ist).

Empfehlung lebt **im Source-Detail-Pane** (Iter D.2 / J), als
zusaetzliche Sub-Card unter den existierenden KPIs/GAs/Findings.

**End-to-End-Garantie:** der User hat nach Abschluss von **L1 (5
Iter, ~5 h)** einen voll nutzbaren MVP — Empfehlung pro Geraet auf
DPT-Basis, ohne dass weitere Layer eingespielt werden muessen.

---

## 1. Datenbasis (alles bereits im Repo persistiert)

| Quelle | Spalte/Methode | Wofuer |
|---|---|---|
| `knx_group_addresses` (ETS-Sync, Iter 16+27) | `address`, `label`, `dpt`, `dpt_inferred*` | DPT pro GA → DPT-Mapping (Layer 1) |
| `knx_raw_telegrams` (48 h) | `timestamp`, `destination`, `source`, `repeated`, `value` | Inter-Telegramm-Zeitstempel + Wertverlauf → Sende-Modus klassifizieren |
| `knx_telegram_counters` (365 d, Iter K) | `(ga, hour_bucket, count)` | Long-Term-Stabilitaet, Tag/Nacht-Muster |
| `KnxStatsService.compute_source_detail` (Iter B + K) | GAs des Geraets, Counts, last_seen, repeat_ratio | Geraetebasis-DTO als Input |
| `processing/knx_stats.py:recommended_rate_for(dpt)` (Iter 1) | DPT → Soll-Rate | Layer-1-Embryo, wird erweitert |
| `const.py:KNX_MANUFACTURER_HINTS` | 9 Hersteller mit Tipps + Doc-URLs | Layer-2-Embryo |
| `findings_runner` mit `SEND_CYCLE_DRIFT` (Iter 21) | bus-weite Detektoren | Layer-3-Override |

**Was fehlt** — wird in den Iter ergaenzt:

- **Tabelle `knx_devices`** (`dev_source PK`, `manufacturer`, `model`,
  `last_seen`) — Layer 2 braucht ein Geraete-Profil pro Source.
- **DPT-Recommendation-Tabelle** mit Sende-Modus-Vorgabe (nicht nur
  Rate) — Erweiterung von `KNX_RECOMMENDED_RATES_PER_MIN`.
- **Modell-Recommendation-Tabelle** als Override pro
  (manufacturer, model_pattern).
- **Cache-Tabelle `knx_recommendation_cache`** fuer KI-Antworten
  (Layer 4).
- **Service `compute_device_recommendation`** + DTO + View + Frontend-
  Card.

---

## 2. Architektur-Entscheidungen (begruendet)

### 2.1 Geraete- vs. GA-zentriert
**Entscheidung:** Beides. Geraete-Empfehlung **aggregiert** GA-Empfehlungen,
weil ein Geraet (z. B. Wetterstation) mehrere DPTs bedient (Temp 9.001 +
Lux 9.004 + Wind 9.005). Headline-Modus pro Geraet **plus** Detail-Tabelle
pro GA. Begruendung: ohne Detail-Pegel verliert der User die Schaerfe;
ohne Headline ist die Card unleserlich.

### 2.2 Klassifikations-Heuristik (Sende-Modus)
**Entscheidung:** deterministisch in Python, Schwellwerte als named
constants. Inputs: Zeitstempel-Liste pro GA. Outputs:
`Literal["cyclic","on_change","hybrid","silent","insufficient"]` + Konfidenz.

Schwellen (entscheidbar, dokumentiert):
- **Silent**: 0 Telegramme.
- **Insufficient**: < 10 Telegramme im Periode → Konfidenz `low`,
  Modus `insufficient`.
- **Cyclic**: σ(intervals) / median(intervals) < 0.3 → klar periodisch.
  Median = aktueller Zyklus (in Sekunden).
- **On-change**: P95(interval) > 10 × median(interval) **und** je
  Telegramm korrespondiert eine Wertaenderung in `value_history`
  → klar event-getrieben.
- **Hybrid**: kein eindeutiges Profil, aber > 1 Telegramm — fallback,
  Konfidenz `medium`.

**Tradeoff:** Heuristik ist nie 100 %, aber transparent + reproduzierbar.
KI-Klassifikation waere flexibler, ist aber teuer + intransparent (kein
Reasoning). Layer 4 bleibt fuer **Empfehlungs-Quelle**, nicht fuer
**Modus-Erkennung**.

### 2.3 Empfehlungs-Quelle: Layer-Pipeline
**Entscheidung:** kuratierte Daten zuerst, KI als Opt-in-Fallback.
Reihenfolge fest, Reasoning-Liste enthaelt jeden angewandten Layer.

| Layer | Quelle | Override-Verhalten |
|---|---|---|
| **1 — DPT-Standard** | `knx_dpt_recommendations.py` (Python-Modul mit Typed-Dict pro DPT) | Default fuer alle GAs; nie ueberschrieben |
| **2 — Modell** | `knx_device_model_recommendations.py` (Tupel `(manufacturer, model_glob) → mode_overrides`) | Ueberschreibt Layer-1-Modus, falls Match in `knx_devices` |
| **3 — Live-Anomalie** | runtime: Buslast > 30 %, aktive `SEND_CYCLE_DRIFT`/`REPEAT_APPROXIMATION` | Modifiziert Cycle-Empfehlung (z. B. + 50 %); fuegt Reasoning hinzu, ueberschreibt aber nicht den Modus |
| **4 — KI** | optional, opt-in, gecacht | Fallback NUR wenn DPT unbekannt **und** Modell unbekannt; neue Empfehlung wird in Cache geschrieben |

**Tradeoff:** Layer 4 ist optional, weil HA oft offline laeuft +
deterministisch sein soll. Layer 1 als Python-Modul (statt YAML/JSON):
mypy-strict-konform, kein Parser-Overhead, Tests trivial.

### 2.4 Wo lebt das DTO?
**Entscheidung:** neuer Service `processing/knx_recommend_service.py`,
neuer Endpoint `GET /api/messagehub/knx-stats/source/{dev_source}/recommendation`
(separater Endpoint, kein Embedding ins bestehende `compute_source_detail`).

Begruendung:
- Recommendation-Compute ist teurer als Source-Detail (mehr Queries,
  mehr Aggregation) → eigener Endpoint kann eigenes Caching haben.
- Source-Detail-Performance bleibt unveraendert.
- Frontend kann Card lazy laden (nur wenn der User das Pane oeffnet).

### 2.5 Frontend
**Entscheidung:** neue Sub-Card `recommendation-card` im Source-Detail-Pane.
Default: **collapsed**, Headline sichtbar, Detail-Tabelle aufklappbar.
API-Aufruf erfolgt **lazy**, sobald die Card sichtbar ist (nicht parallel
zum Source-Detail-Initial-Load) — vermeidet Latency-Hit beim Drawer-Open.

### 2.6 Sicherheit
- Endpoint: `RequireAdminView` mit `_check_admin(request)`.
- Path-Param: `validate_knx_individual_address(dev_source)`.
- Audit-Log: NUR bei Layer-4-Aufruf (KI hat externe Folgen — Token-
  Cost, Datentransfer); Read-only-Compute ohne Audit-Log.
- Rate-Limit: TokenBucketLimiter (cap 10, refill 10/min) pro `dev_source`
  → schuetzt vor Drawer-Open-Loop.
- Layer 4: API-Key ueber `secrets.yaml` (HA-Standard), niemals im Log.

### 2.7 Performance
- `compute_device_recommendation` ist O(GAs × log(telegrams)) durch
  bestehende Indizes (`idx_knx_raw_source_ts`, idx_knx_counters_bucket`).
- In-Memory-Cache pro `(dev_source, period_hash)`, TTL 5 min — Drawer-
  Refresh ohne erneuten Compute.
- Layer 4 (KI): zusaetzlicher SQLite-Cache `knx_recommendation_cache`
  (key = sha256(dpt + manufacturer + model + version), TTL 30 d).
- Bundle-Wachstum: < 8 kB nach gzip (Card + DTO-Types).

### 2.8 End-to-End-Test-Strategie
**Constraint** (CLAUDE.md): kein Docker-Daemon in Sandbox →
**kein Playwright**. Lokales E2E-Surrogat:

| Test-Schicht | Tool | Was testet das |
|---|---|---|
| Backend-Service | pytest mit echter SQLite (`tmp_path`) | Service-Pfad mit Repo-Calls, alle 4 Layer |
| Backend-View | pytest mit AST + Repo-Mock | View-Auth, Path-Param-Validierung, Caching |
| API-Client | vitest + fetch-Mock | URL-Encoding, Headers, Response-Parsing |
| Frontend-Card | vitest + jsdom + ApiClient-Stub | DOM-Render, Reasoning-Render, Lazy-Load |
| Build-Smoke | `npm run build` | TypeScript-Strict + Vite-Bundle |
| Round-Trip | pytest serializiert DTO ↔ vitest deserializiert (gleiches Schema) | Schema-Konsistenz Backend↔Frontend |

**Was bleibt manuell:** echte HA-Instanz, visueller UI-Check,
Lit-Reactive-Pattern unter realen DOM-Conditions.
Wird im Plan pro Iter explizit als "Manueller Test-Check" dokumentiert.

---

## 3. Iter-Plan

Pro Iter: TDD-Pattern (Test rot → Code → Tests gruen → Quality-Gates →
Commit). Quality-Gates wie in `CLAUDE.md`: pytest, vitest, typecheck,
build, Bundle im Commit. Conventional-Commit-Footer
`Iteration: L<phase>.<step>`.

### Phase L1 — DPT-Standard + Sende-Modus-Klassifikation (MVP)

> **Outcome nach L1:** User oeffnet Source-Detail eines Geraets, sieht
> die Recommendation-Card mit Sende-Modus-Klassifikation + DPT-basierter
> Empfehlung + Reasoning-Liste. Funktional vollstaendig **ohne** Layer 2-4.

#### Iter L1.0 — DPT-Recommendation-Tabelle
**Scope (~45 min):**
- Neues Modul `processing/knx_dpt_recommendations.py`.
- Dataclass `DptRecommendation(mode, cycle_minutes_min, cycle_minutes_max, hysteresis_unit, hysteresis_value, max_rate_per_min, source)`.
  - `mode`: `Literal["on_change", "cyclic", "hybrid"]` (= Layer-1-Empfehlung; "silent" gibt's auf DPT-Ebene nicht).
  - `source`: `Literal["dpt_standard"]` — fuer Reasoning.
- Tabelle `KNX_DPT_RECOMMENDATIONS: dict[str, DptRecommendation]` mit
  ~30 DPTs (alle bestehenden + DPT-Familien wie `1.x`, `9.x`).
- Lookup-Funktion `recommend_for_dpt(dpt) -> DptRecommendation | None`
  mit Main-Type-Fallback (`9.x` falls `9.001` nicht da).

**Tests (rot zuerst):**
- `tests/unit/test_knx_dpt_recommendations.py`:
  - `test_known_dpt_returns_recommendation` (5 DPTs).
  - `test_unknown_dpt_returns_none`.
  - `test_main_type_fallback` (`9.123` → `9.x`-Default).
  - `test_recommendation_immutable` (frozen dataclass).
- Keine I/O, pure-data — schnell.

**Quality-Gates:**
- pytest tests/unit/ -q (alle gruen).
- ruff + mypy --strict clean.
- Frontend nicht beruehrt.

**Commit:** `feat(knx-recommend): DPT-Recommendation-Tabelle (Layer 1 / L1.0)`

**Aufwand:** 45 min. **Risiko:** niedrig.

---

#### Iter L1.1 — Sende-Modus-Klassifikation
**Scope (~60 min):**
- Repo-Methode `inter_telegram_intervals_for_ga(ga, from_iso, to_iso) -> list[float]`
  (Sekunden zwischen aufeinanderfolgenden Telegrammen).
  - Hard-Cap auf 10 000 Telegramme pro GA (DoS-Schutz).
  - Index: `idx_knx_raw_destination_ts` — **pruefen** ob Index bereits da
    ist; sonst Migration anlegen.
- Service `processing/knx_recommend_service.py`:
  - `classify_send_mode(intervals: list[float], value_changes: int) -> SendModeObservation`.
  - `SendModeObservation(mode, confidence, median_interval_s, std_interval_s, sample_count)`.

**Tests (rot zuerst):**
- `tests/unit/test_knx_send_mode_classification.py`:
  - `test_zero_telegrams_returns_silent`.
  - `test_few_telegrams_returns_insufficient`.
  - `test_regular_intervals_returns_cyclic` (synthetisch: σ klein).
  - `test_irregular_with_value_changes_returns_on_change`.
  - `test_mixed_returns_hybrid`.
  - `test_median_interval_correct_for_cyclic`.

**Quality-Gates:** wie L1.0 + pytest 1086+ gruen.

**Commit:** `feat(knx-recommend): Sende-Modus-Klassifikation (L1.1)`

**Aufwand:** 60 min. **Risiko:** niedrig (pure Heuristik, keine I/O
ausser Repo-Methode).

---

#### Iter L1.2 — DeviceRecommendationService
**Scope (~60 min):**
- Service `compute_device_recommendation(dev_source, from_iso, to_iso) -> DeviceRecommendation`.
- DTO:
  ```python
  @dataclass(frozen=True, slots=True)
  class GaRecommendation:
      ga: str
      label: str | None
      dpt: str | None
      observed: SendModeObservation       # aktueller Modus
      recommended_mode: str               # "on_change" | "cyclic" | "hybrid"
      recommended_cycle_minutes: tuple[int, int] | None  # (min, max) oder None
      recommended_hysteresis: str | None  # z. B. ">= 0.5 K" oder None
      severity: str                       # "ok" | "warn" | "deviation"
      reasoning: list[str]                # je Layer ein Eintrag

  @dataclass(frozen=True, slots=True)
  class DeviceRecommendation:
      dev_source: str
      headline_mode: str                  # Mehrheits-Modus der GAs
      headline_recommendation: str        # menschen-lesbarer Satz
      ga_recommendations: list[GaRecommendation]
      confidence: str                     # "high" | "medium" | "low"
      generated_at: str                   # ISO-Zeit
  ```
- Composition: pro GA Klassifikation + DPT-Lookup + Severity-Vergleich
  (observed.mode vs. recommended_mode → "ok"/"deviation").

**Tests (rot zuerst):**
- `tests/unit/test_knx_recommend_service.py`:
  - `test_unknown_source_returns_none`.
  - `test_single_ga_temperature_cyclic` (DPT 9.001, 1 Tel/min): observed=cyclic, recommended=on_change → severity="deviation".
  - `test_multi_ga_aggregation_headline` (Wetterstation: 3 DPTs).
  - `test_low_telegram_count_low_confidence`.
  - `test_reasoning_contains_dpt_layer`.

**Quality-Gates:** wie L1.0–L1.1.

**Commit:** `feat(knx-recommend): DeviceRecommendationService (L1.2)`

**Aufwand:** 60 min. **Risiko:** mittel (Composition mit mehreren
Sub-Pieces, Aggregations-Logik).

---

#### Iter L1.3 — API-Endpoint + Caching
**Scope (~45 min):**
- Neue View `KnxStatsSourceRecommendationView` in `api/knx_stats.py`.
  - URL: `/api/messagehub/knx-stats/source/{dev_source}/recommendation`.
  - `RequireAdminView` + `_check_admin` + `validate_knx_individual_address`.
  - `parse_iso_period` mit `default_days=7`, `max_days=30`.
  - Rate-Limit: `TokenBucketLimiter(capacity=10, refill_per_minute=10)` pro `dev_source`.
- In-Memory-Cache (`hass.data[DOMAIN]["knx_reco_cache"]`):
  - Key: `(dev_source, period_hash)`.
  - TTL: 5 min.
  - Cleanup: bei jedem Hit pruefen, ob > 100 Eintrage → aelteste verwerfen.
- DTO-Serialisierung: `device_recommendation_to_dict(reco)`.

**Tests (rot zuerst):**
- `tests/unit/test_knx_recommendation_view.py`:
  - AST-Test: View hat `_check_admin`, `validate_knx_individual_address`,
    `parse_iso_period`, rate-limiter-Aufruf.
  - View ist registriert in `async_register_views`.
- `tests/unit/test_knx_recommend_cache.py`:
  - `test_cache_hit_returns_same_object`.
  - `test_cache_miss_after_ttl`.
  - `test_cache_eviction_at_size_limit`.

**Quality-Gates:** wie L1.0–L1.2.

**Commit:** `feat(knx-recommend): API-Endpoint + In-Memory-Cache (L1.3)`

**Aufwand:** 45 min. **Risiko:** niedrig (etablierter View-Pattern).

---

#### Iter L1.4 — Frontend: Recommendation-Card
**Scope (~60 min):**
- `frontend/src/api-client.ts`:
  - Neue Methode `getKnxStatsSourceRecommendation(devSource, filters) → DeviceRecommendationDto`.
  - DTO-Typen 1:1 zum Backend.
- `frontend/src/components/stats-knx-view.ts`:
  - Neue Sub-Card `_renderRecommendationCard(reco)`.
  - Eingabe in `_renderSourceDetailBody`, **collapsed** by default.
  - Lazy-Load: `_loadRecommendation(devSource)` triggert beim ersten
    Aufklappen, nicht beim Drawer-Open.
  - State: `_recommendation: DeviceRecommendationDto | null`,
    `_recommendationLoading: boolean`, `_recommendationError: string | null`.
  - Render-Pfade: loading-Skeleton, Error-Box, Headline-Block,
    GA-Detail-Tabelle (immer aufklappbar), Reasoning-Liste.

**Tests (rot zuerst):**
- `frontend/tests/source-detail-recommendation.test.ts`:
  - `test_card_renders_collapsed_initially`.
  - `test_clicking_expands_and_loads_recommendation`.
  - `test_headline_shows_mode_and_recommendation`.
  - `test_ga_table_shows_per_ga_severity`.
  - `test_reasoning_list_renders`.
  - `test_error_state_renders_inline`.

**Quality-Gates:**
- vitest 280+ gruen.
- typecheck clean.
- `npm run build` clean, Bundle in `frontend_dist/`.
- pytest unbeeinflusst.

**Commit:** `feat(stats-knx): Recommendation-Card im Source-Detail-Pane (L1.4)`

**Aufwand:** 60 min. **Risiko:** mittel (neues UI-Element + Lazy-Pattern).

---

#### Iter L1.5 — End-to-End-Verifikation L1
**Scope (~30 min):**
- Backend↔Frontend-Schema-Konsistenz-Test
  (`tests/unit/test_recommendation_dto_contract.py`):
  - `test_python_dto_matches_typescript_interface` (parse Tabelle aus
    `frontend/src/api-client.ts` per regex, vergleiche Feld-Namen).
- Smoke-Build:
  - `npm run build` -> Bundle aktualisiert.
  - Manuelles Visual-Check (User-Aktion, nicht in CI).
- HACS-Bundle-Pruefung: Bundle-Groesse darf nicht > 500 kB sein
  (Pre-Release-Hygiene).

**Manueller Test-Check:**
> Im HA-Dev-Container Source-Detail eines beliebigen 1.1.x-Geraets
> oeffnen → Recommendation-Card sichtbar (collapsed) → Aufklappen
> triggert API-Call → Headline + DPT-basierte Empfehlung + Reasoning
> erscheinen. Errors werden inline gerendert (kein Crash).

**Quality-Gates:** alle gruen, Bundle committed.

**Commit:** `test(knx-recommend): End-to-End L1 + DTO-Schema-Contract (L1.5)`

**Aufwand:** 30 min. **Risiko:** niedrig.

> ✅ **Phase L1 abgeschlossen — User-MVP funktional.**
> Sinnvolle Stop-Punkt fuer ein Pre-Release v0.25.0-rc.1, falls
> gewuenscht.

---

### Phase L2 — Modell-spezifische Overrides

> **Outcome nach L2:** Geraet `1.1.220` mit `manufacturer=hörmann`,
> `model=garage-control` bekommt eine model-spezifische Empfehlung,
> die die DPT-Default-Empfehlung ueberschreibt.

#### Iter L2.0 — Schema `knx_devices`
**Scope (~45 min):**
- Migration `0029_knx_devices.sql`:
  ```sql
  CREATE TABLE IF NOT EXISTS knx_devices (
      dev_source   TEXT PRIMARY KEY CHECK (length(dev_source) BETWEEN 5 AND 11),
      manufacturer TEXT,
      model        TEXT,
      last_seen    TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL
  );
  ```
- `KnxDeviceRepository` mit `get`, `upsert`, `list`-Methoden.
- KEINE automatische ETS-Sync-Erweiterung in dieser Iter (Future Work).

**Tests:**
- `tests/unit/test_knx_devices_repo.py` — CRUD + idempotent-Migration.

**Commit:** `feat(knx-devices): Schema + Repository (L2.0)`

**Aufwand:** 45 min. **Risiko:** niedrig (etabliertes Migration-Pattern).

---

#### Iter L2.1 — Modell-Recommendation-Tabelle
**Scope (~45 min):**
- Modul `processing/knx_device_model_recommendations.py`:
  ```python
  @dataclass(frozen=True, slots=True)
  class ModelRecommendation:
      manufacturer: str       # canonical lowercase
      model_glob: str         # fnmatch pattern
      dpt_overrides: dict[str, DptRecommendation]
      reasoning: str          # human-readable Begruendung
      doc_url: str | None     # optional link
  ```
- ~10 bekannte Modelle (mit den Daten aus `KNX_MANUFACTURER_HINTS` als
  Startpunkt: Hoermann Tor, MDT-DALI, Hager-Schaltaktor, Gira-
  Wetterstation, ABB-Heizung, Theben-Praesenzmelder, Busch-Jaeger-
  Thermostate, Zennio-Multi-Sensor, Elsner-Wetterstation).
- Lookup `find_model_recommendation(manufacturer, model)` mit fnmatch.

**Tests:**
- 5 Modelle assert + Glob-Matching + Unknown-Fallback.

**Commit:** `feat(knx-recommend): Modell-Recommendation-Tabelle (L2.1)`

**Aufwand:** 45 min. **Risiko:** niedrig.

---

#### Iter L2.2 — Service-Pipeline-Erweiterung
**Scope (~45 min):**
- `compute_device_recommendation` ruft `KnxDeviceRepository.get(dev_source)`,
  dann `find_model_recommendation` → wenn gefunden, ueberschreibt
  pro DPT die Layer-1-Empfehlung; Reasoning-Eintrag mit
  `source="device_model"` + Doc-URL.

**Tests:**
- `test_model_overrides_dpt_recommendation`.
- `test_model_unknown_falls_back_to_dpt`.
- `test_reasoning_lists_both_layers_in_order`.

**Commit:** `feat(knx-recommend): Layer-2-Override-Pipeline (L2.2)`

**Aufwand:** 45 min. **Risiko:** mittel.

---

#### Iter L2.3 — Pflege-API + Auto-Inferenz aus Hints
**Scope (~60 min):**
- View `KnxDeviceDetailView`:
  - `PUT /api/messagehub/knx-devices/{dev_source}` mit
    `{manufacturer, model}`-Body, `RequireAdminView`, Audit-Log
    `knx_device_set`.
  - `GET /api/messagehub/knx-devices/{dev_source}` (Read-only).
- Auto-Inferenz: bei `compute_device_recommendation`, falls
  `knx_devices`-Eintrag fehlt, suche in den GA-Labels nach
  `KNX_MANUFACTURER_HINTS`-Schluesselwoertern (z. B. "Tor", "ABB",
  "Gira") und schlage einen Hersteller vor (mit confidence < 0.8).
  → Wird im Reasoning markiert als
  `"manufacturer guessed from labels (confidence 0.6)"`.

**Tests:**
- View-AST-Tests + Repo-CRUD + Inferenz-Heuristik (3 Cases).

**Commit:** `feat(knx-devices): Pflege-API + Label-Inferenz (L2.3)`

**Aufwand:** 60 min. **Risiko:** mittel (Inferenz-Heuristik darf nicht
zu aggressiv raten).

---

#### Iter L2.4 — Frontend-Geraete-Editor + E2E
**Scope (~45 min):**
- Im Source-Detail-Pane: Edit-Button bei "Geraet" → Inline-Edit fuer
  `manufacturer` + `model`, ruft `PUT /knx-devices/{dev_source}`.
- Recommendation-Card zeigt nach Save den neuen Reasoning-Eintrag.
- E2E-Test (vitest): Edit → API-Call → Reload → Headline geaendert.

**Manueller Test-Check:**
> Geraet `1.1.220` editieren mit `manufacturer=hoermann, model=garage-control`
> → Recommendation-Card laedt neu → Empfehlung "on_change mit
> deaktivierten Klima-GAs" + Reasoning enthaelt Doc-URL.

**Commit:** `feat(stats-knx): Geraete-Editor + Layer-2-Round-Trip (L2.4)`

**Aufwand:** 45 min. **Risiko:** mittel.

> ✅ **Phase L2 abgeschlossen.**

---

### Phase L3 — Live-Anomalie-Override

> **Outcome nach L3:** Wenn die Anlage gerade unter Last steht oder
> existierende Findings auf das Geraet zeigen, passt sich die
> Empfehlung an: "Bus aktuell ueberlastet — empfehle laengeren Zyklus."

#### Iter L3.0 — Buslast-Override
**Scope (~30 min):**
- Service: `compute_device_recommendation` liest `busload_pct`
  via `compute_busload(period)` (existiert).
- Wenn `current_pct > 30`: alle GA-Empfehlungen mit `cyclic`-Modus
  bekommen `cycle_minutes_min` × 1.5. Reasoning-Eintrag
  `"bus load X.Y% — cycle extended"`.

**Tests:**
- `test_high_busload_extends_cycle_recommendation`.
- `test_low_busload_keeps_default`.

**Commit:** `feat(knx-recommend): Layer-3-Buslast-Override (L3.0)`

**Aufwand:** 30 min. **Risiko:** niedrig.

---

#### Iter L3.1 — Findings-Override
**Scope (~45 min):**
- `findings_repo.list_findings(source=dev_source, code in ["SEND_CYCLE_DRIFT",
  "REPEAT_APPROXIMATION", "TOGGLE_LOOP", "MULTI_RESPONDER"])`.
- Pro aktivem Finding: Reasoning-Eintrag + GA-Severity-Boost
  ("warn" → "deviation").

**Tests:**
- `test_active_finding_promotes_severity`.
- `test_acknowledged_finding_does_not_override`.
- `test_multiple_findings_listed_in_reasoning`.

**Commit:** `feat(knx-recommend): Layer-3-Findings-Override (L3.1)`

**Aufwand:** 45 min. **Risiko:** mittel.

---

#### Iter L3.2 — End-to-End L3
**Scope (~15 min):**
- Smoke: synthetisches Mock-Setup mit Buslast=35 % und SEND_CYCLE_DRIFT-
  Finding → DeviceRecommendation enthaelt beide Reasoning-Eintraege.
- vitest-Update: Reasoning-Liste rendert lange Listen sauber
  (max-height + scrollable).

**Commit:** `test(knx-recommend): E2E Layer-3 (L3.2)`

**Aufwand:** 15 min. **Risiko:** niedrig.

> ✅ **Phase L3 abgeschlossen.**

---

### Phase L4 — KI-Fallback (Schnittstelle, opt-in, NICHT live by default)

> **Outcome nach L4:** Architektur fuer KI-Empfehlungen ist da. Cache
> verhindert, dass jeder Drawer-Open einen LLM-Call macht. Live-LLM-
> Provider ist installiert, aber **per Default deaktiviert** —
> User-Opt-in via Settings.

#### Iter L4.0 — Provider-Schnittstelle + Cache-Tabelle
**Scope (~60 min):**
- Migration `0030_knx_recommendation_cache.sql`:
  ```sql
  CREATE TABLE IF NOT EXISTS knx_recommendation_cache (
      cache_key  TEXT PRIMARY KEY,        -- sha256(dpt + manufacturer + model + version)
      response   TEXT NOT NULL,           -- JSON-Serialisierung der DptRecommendation
      provider   TEXT NOT NULL,           -- "anthropic" | ...
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_knx_reco_cache_expires
      ON knx_recommendation_cache (expires_at);
  ```
- Repo `KnxRecommendationCacheRepository` mit `get`, `set`, `cleanup_expired`.
- Abstrakte Klasse `RecommendationProvider`:
  ```python
  class RecommendationProvider(Protocol):
      async def fetch(
          self,
          dpt: str | None,
          manufacturer: str | None,
          model: str | None,
          context: dict[str, Any],
      ) -> DptRecommendation | None: ...
  ```

**Tests:**
- Repo-CRUD + Cache-Hit/Miss + Expiry-Cleanup (4 Cases).

**Commit:** `feat(knx-recommend): Layer-4-Schnittstelle + Cache (L4.0)`

**Aufwand:** 60 min. **Risiko:** mittel.

---

#### Iter L4.1 — Stub-Provider + Settings-Toggle
**Scope (~45 min):**
- `StubRecommendationProvider` (immer `None` zurueck) als Default.
- Settings-Toggle: `knx_recommendation_ai_enabled` in `messagehub_settings`,
  default `false`.
- Frontend-Switch in Settings-Tab "KNX → KI-Empfehlungen aktivieren".
- View liest Toggle, falls aus: ueberspringt Layer 4.

**Tests:**
- `test_layer4_skipped_when_toggle_off` (default).
- `test_layer4_invoked_when_toggle_on_and_dpt_unknown`.
- View-AST-Test: Settings-Toggle ist gelesen.

**Commit:** `feat(knx-recommend): Layer-4 Stub + User-Opt-in (L4.1)`

**Aufwand:** 45 min. **Risiko:** mittel.

---

#### Iter L4.2 — Anthropic-Provider (Live-LLM, optional)
**Scope (~90 min):**
- `AnthropicRecommendationProvider` mit Claude-API-Aufruf.
- API-Key aus `secrets.yaml` (HA-Standard) — User legt manuell an:
  ```yaml
  messagehub_anthropic_api_key: !secret messagehub_anthropic_api_key
  ```
- Prompt: strukturiert, JSON-Mode, gibt `DptRecommendation`-Schema
  zurueck. **Prompt-Injection-Schutz**: User-Eingaben (manufacturer,
  model) werden NICHT direkt im Prompt verwendet, sondern als
  enumerierte Liste mit Whitelisting (nur a-zA-Z0-9-_ erlaubt).
- Rate-Limit: TokenBucketLimiter (cap 5, refill 1/min) global —
  schuetzt vor LLM-Cost-Runaway.
- Audit-Log: jeder erfolgreiche Aufruf mit `action="knx_recommend_ai"`,
  `details={"dpt": ..., "tokens_in": N, "tokens_out": M}`.
- Cache-TTL: 30 d (LLM-Antworten sind stabil).
- Error-Handling: jeder LLM-Fehler → `None` + Reasoning-Eintrag
  `"AI provider error: {category}"` (kategorisiert, keine Stack-Trace
  ans Frontend).

**Tests:**
- `test_provider_uses_anthropic_sdk_with_correct_model`.
- `test_provider_caches_response`.
- `test_provider_rate_limit_blocks_after_capacity`.
- `test_provider_handles_api_error_gracefully`.
- `test_audit_log_written_on_success`.
- `test_prompt_injection_blocked` (manufacturer mit `;`-Char →
  HTTPBadRequest).

**Quality-Gates** + Doku:
- `requirements`: `anthropic>=0.39,<1.0` neu in `manifest.json` →
  Dependency-Review-Schritt fuer User.
- README-Section: "Optional: KI-Empfehlungen aktivieren".

**Commit:** `feat(knx-recommend): Anthropic-Provider als Layer-4-Live (L4.2)`

**Aufwand:** 90 min. **Risiko:** **hoch** — externe API, neue
Dependency, Prompt-Injection-Surface, Cost-Surface. Eigene
Iter, sorgfaeltig.

---

#### Iter L4.3 — End-to-End L4
**Scope (~30 min):**
- Mock-Provider-Test: Toggle on + DPT unbekannt → Provider wird mit
  korrektem Kontext aufgerufen, Cache wird geschrieben, zweiter Aufruf
  trifft Cache.
- Frontend-Test: Reasoning-Liste rendert AI-Eintrag mit gesondertem
  Marker (z. B. "🤖 AI-Vorschlag — manuell pruefen").

**Manueller Test-Check:**
> 1. Settings → KI-Empfehlungen aktivieren (Toggle on).
> 2. Source-Detail eines Geraets mit unbekanntem DPT (z. B. exotischer
>    Hersteller) oeffnen.
> 3. Recommendation-Card → Reasoning enthaelt "AI-Vorschlag (Anthropic
>    Claude X.Y)" plus Doc-Hint.
> 4. Zweiter Drawer-Open: Cache-Hit, kein neuer LLM-Call (Logs
>    pruefen).

**Commit:** `test(knx-recommend): E2E Layer-4 mit Mock-Provider (L4.3)`

**Aufwand:** 30 min. **Risiko:** niedrig.

> ✅ **Phase L4 abgeschlossen.**

---

### Phase L5 — Doku + Release v0.25.0

#### Iter L5.0 — Doku
**Scope (~30 min):**
- Neue Doku `docs/messagehub_knx_recommendations.md` (User-Sicht):
  - Wie funktioniert die Recommendation-Card.
  - Wie pflege ich `knx_devices` (manufacturer/model).
  - Wann macht es Sinn, KI zu aktivieren — und welche Risiken.
- Update `docs/messagehub_konzept.md`: neuer Abschnitt
  "Recommendation-Engine".
- Update `README.md`: neue Feature-Zeile.

**Commit:** `docs(knx-recommend): User-Doku + Konzept-Erweiterung (L5.0)`

**Aufwand:** 30 min.

---

#### Iter L5.1 — Release v0.25.0
**Scope (~15 min):**
- `manifest.json`: 0.24.0 → 0.25.0.
- `CHANGELOG.md`: `[Unreleased]` → `[0.25.0] - <Datum>`.
- Tag `v0.25.0`, Push (User-Aktion: Maintainer-Token).

**Commit:** `chore(release): v0.25.0`

**Aufwand:** 15 min.

---

## 4. Aufwand + Reihenfolge (Empfehlung)

| Phase | Iter | Aufwand | Empfehlung |
|---|---|---|---|
| **L1** | 6 | ~5 h | **Pflicht — MVP nutzbar** |
| L2 | 5 | ~3.5 h | hoher User-Wert (Modell-Schaerfe) |
| L3 | 3 | ~1.5 h | nice-to-have (Live-Schaerfe) |
| L4 | 4 | ~3.5 h | nur wenn Bedarf (KI-Cost / Datenschutz) |
| L5 | 2 | ~45 min | Release |

**Empfehlung:** L1 + L2 + L3 + L5 = ~10.5 h fuer eine vollstaendige
deterministische Loesung als v0.25.0. L4 als optionaler Folge-Release
v0.26.0, wenn der User mit der deterministischen Variante an Grenzen
stoesst.

**Stop-Punkte (sicher zum Pausieren):**
- Nach L1.5 — MVP nutzbar.
- Nach L2.4 — Modell-Overrides.
- Nach L3.2 — Live-Schaerfe.
- Nach L4.3 — voller Stack.

Jede Iter ist ein eigener Commit, jeder Stop-Punkt ist ein potenzielles
Release.

---

## 5. Sicherheits-Pyramide (verbindlich)

Pro Iter zu pruefen:

1. **Auth**: jede neue View erweitert `RequireAdminView`, ruft
   `_check_admin(request)`.
2. **Input-Validation**: jeder Path-/Query-Parameter validiert
   (`validate_knx_individual_address`, `parse_iso_period`,
   `parse_int_param`, `validate_note`).
3. **Audit-Log**: alle CUD-Aktionen + alle Layer-4-Aufrufe via
   `_audit(hass, request, action=...)`.
4. **Rate-Limit**: Endpoints mit externer Anbindung (LLM, externe Provider)
   bekommen TokenBucketLimiter.
5. **Secrets**: API-Keys ueber `secrets.yaml`, niemals geloggt,
   niemals im Code-Review-Diff sichtbar.
6. **Prompt-Injection-Schutz**: User-Eingaben werden vor LLM-Aufrufen
   sanitiziert (Whitelist, niemals raw concat).
7. **Bundle-Hygiene**: keine neuen Frontend-Deps ohne Abklaerung,
   Bundle-Groesse < 500 kB.

---

## 6. Performance-Budget (verbindlich)

| Endpoint | Ziel | Pruefung |
|---|---|---|
| `GET /knx-stats/source/{dev_source}/recommendation` | < 200 ms p95 ohne Cache, < 5 ms mit Cache | pytest-Performance-Test (smoke), Iter L1.5 |
| Layer-4-LLM-Aufruf | < 5 s p95, < 1× / Drawer-Open dank Cache | Manueller Test, Iter L4.3 |
| Bundle-Wachstum total | < 8 kB gzip pro Phase | `npm run build` Output, Iter L1.5/L2.4/L3.2/L4.3 |
| pytest gesamt | weiter < 30 s | jede Iter |
| vitest gesamt | weiter < 25 s | jede Iter |

---

## 7. Out-of-scope / Future Work

- **ETS-Sync-Erweiterung** fuer automatische `manufacturer` + `model`-
  Population aus ETS-Topologie-Export (Iter ETS-Sync-2).
- **Bulk-Recommendation-Export** (CSV mit allen Geraeten + Empfehlungen
  fuer ETS-Reverse-Engineering).
- **Auto-Apply-via-MQTT-Bridge** (Empfehlungen automatisch im Geraet
  setzen) — sicherheitskritisch, eigenes Feature-Konzept.
- **Trend-Anzeige fuer Empfehlungs-Aenderungen ueber Zeit** ("Empfehlung
  hat sich von X auf Y geaendert weil Buslast gesunken").

---

## 8. Naechster Schritt

Wenn der Plan abgenommen ist: **Iter L1.0 starten** (DPT-Recommendation-
Tabelle, ~45 min, niedriges Risiko, klares TDD-Pattern). Bei Abweichung
vom Plan: dieses Dokument vor Iter-Start updaten.
