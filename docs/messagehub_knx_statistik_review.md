# Architektur- & Security-Review: KNX-Stats (Iter 18 / 19)

**Status:** Abgeschlossen, alle Findings behoben.
**Datum:** 2026-05-02
**Iterationen:** 1 — 17 (Implementation), 18 (Architektur), 19 (Security)

---

## 1. Architektur-Review

### 1.1 Modul-Schichtung

```
custom_components/messagehub/
├── const.py                                  # Wissensbasis + Defaults
├── listeners/knx.py                          # Hot-Path: Telegramm → DB
├── processing/
│   ├── knx_stats.py                          # Pure Functions:
│   │                                         #   classify, recommend, patterns
│   └── knx_stats_service.py                  # Orchestrierung Repo+Engine
├── storage/
│   ├── sql/0018_knx_stats.sql                # DB-Schema
│   └── knx_stats_repo.py                     # SQL-Aggregate
└── api/
    ├── _validation.py                        # HA-frei, unit-testbar
    ├── _helpers.py                           # HA-Stack-Helpers
    └── knx_stats.py                          # 9 HTTP-Views (Admin-only)

frontend/src/
├── api-client.ts                             # +9 Methoden + 8 DTOs
└── components/
    ├── stats-view.ts                         # Sub-Tab-Container
    ├── stats-live-view.ts                    # Refactor von altem stats-view
    ├── stats-knx-view.ts                     # KNX-Bus-Analyse-Tab
    └── knx-timeline-chart.ts                 # SVG-Sparkline
```

**Bewertung:** sauber geschichtet, keine zirkulaeren Abhaengigkeiten.
Pure-Function-Layer (knx_stats.py) ist HA-frei, async-Layer
(knx_stats_service.py) eine Schicht darueber, HTTP-Layer (api/) als
duenne Adapter on top.

### 1.2 Cognitive Complexity

`ruff` mit Default-Settings ist clean. Eine Funktion stoesst an die
Default-Schwelle (50 statements) aus PLR0915 — `async_register_knx_listener`
in `listeners/knx.py`. Wir haben in Iter 16 zwei Helpers extrahiert
(`_build_listener_state`, `_maybe_increment_shadow_counter`), womit die
Funktion wieder unter Schwelle ist. ✓

Andere Hotspots:

| Funktion | LOC | Bewertung |
|---|---|---|
| `compute_summary` | ~25 | Linear, klar |
| `compute_top` | ~40 | Eine Schleife, akzeptabel |
| `compute_ga_detail` | ~45 | Mehrere Eingaben, aber linearer Ablauf |
| `silence_detect` | ~25 | Linear |
| `evaluate_alarms` | ~70 | Drei Regeln, jede ~20 Zeilen — ok |
| `_detect_*`-Detektoren | je ~20-40 | Eine Hauptschleife, klar lesbar |

Keine echte Cognitive-Complexity-Verletzung.

### 1.3 DRY

**Behoben in Iter 18:**

- `_safe_ratio` (service) und `_compute_ratio` (knx_stats) waren
  identisch. Zusammengefasst zu `safe_ratio` (public) in
  `processing/knx_stats.py`, vom Service importiert.

**Akzeptiert (kein Fix):**

- `_insert_knx`-Helper in mehreren Test-Files: bewusst dupliziert,
  weil pro Test-File die Default-Werte (DPT, Source) variieren. Wenn
  > 5 Test-Files entstehen, wandert er nach `tests/conftest.py`.
- KPI-Card-Markup in `stats-live-view.ts` und `stats-knx-view.ts`:
  visuell sehr aehnlich, aber unterschiedliche Felder. Ein Lit-
  Component-Refactoring waere Overkill bei < 200 LOC.

### 1.4 Modularitaet

Module sind nach Verantwortlichkeit getrennt:

- **`processing/knx_stats.py`**: Wissens-/Algorithmen-Layer (kein IO).
  Ideal unit-testbar ohne DB.
- **`storage/knx_stats_repo.py`**: SQL-Aggregate. Eine Klasse mit
  klaren Cluster-Methoden (Aggregate, Bus-Health, Silence,
  Counter, Acknowledge).
- **`processing/knx_stats_service.py`**: Orchestrator. Liest aus
  Repo, ruft Pure-Functions aus knx_stats.py, gibt strukturierte
  DTOs (TopRow, GaDetail) zurueck.
- **`api/knx_stats.py`**: HTTP-Adapter. Validiert Inputs, ruft
  Service, serialisiert.

**Bewertung:** Klar geschichtet. Aktive Trennung von HA-freien und
HA-abhaengigen Modulen (api/_validation.py vs api/_helpers.py)
erlaubt Unit-Tests ohne HA-Stack.

### 1.5 Async-First

Alle DB-Operationen sind async (aiosqlite). Service-Methoden
durchgaengig async. Pure Functions in knx_stats.py sind sync —
korrekt, da kein IO.

`_maybe_increment_shadow_counter` ist async und wird im KNX-Listener-
Hot-Path nach jedem Insert awaited. Cost: ein UPSERT pro Telegramm,
opt-out via `hass.data[DOMAIN]['_knx_shadow_counters_enabled']`.

### 1.6 Performance

**Geprueft:**

- Aggregat-Queries auf `messages` mit `json_extract` werden vom
  partiellen Index `idx_messages_knx_bus_timestamp` (Migration 0018)
  beschleunigt — nur knx-bus-Rows im Index.
- `compute_summary` ruft `compute_top(limit=500)` fuer Severity-Counts.
  Das ist eine zusaetzliche Aggregat-Query, aber bei realistischen
  100 GAs vernachlaessigbar; der Top-Query wird sowieso vom
  Frontend nachgeladen.
- Frontend laedt summary/top/bus-health/silence/orphans/alarms
  parallel via `Promise.all` — 6 Endpoints in einer Render-Runde.

**Akzeptiert:**

- Bei sehr grossen Anlagen (>10k unterschiedliche GAs) wird
  `compute_top(limit=500)` teurer. Hard-Cap 500 schuetzt vor
  Pathologien. Ueber Konzept §10 dokumentiert.
- Schatten-Counter (Phase 2) bietet einen schnelleren Pfad fuer
  Long-Term-Aggregate, ist aber im Iter 16 nur als Schreib-Pfad
  aktiv — Lese-API kommt mit Phase-2-UI.

### 1.7 Naming + Konsistenz

- **Backend**: `compute_*` (Service), `_detect_*` (Pattern), `*_repo`
  (Storage), `_DEFAULT_*` (Konstanten), `KNX_*` (KNX-spezifische
  Konstanten in const.py).
- **Frontend**: `getKnxStats*` (API-Methoden), `KnxStats*Dto` (Types),
  `_render*` (private Render-Helpers in Components).

Konsistent durchgezogen.

---

## 2. Security-Review

### 2.1 Authentication / Authorization

**Alle KNX-Stats-API-Views erben von `RequireAdminView`:**

```python
class RequireAdminView(HomeAssistantView):
    requires_auth = True
    @staticmethod
    def _check_admin(request):
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            raise web.HTTPForbidden(reason="admin required")
```

Jede `get`/`post`/`delete`-Methode ruft `self._check_admin(request)`
als ersten Schritt. ✓

### 2.2 Input-Validierung

**Period-Validierung** (`api/_validation.py:parse_iso_period`):

- ISO-8601-Format via `datetime.fromisoformat` — `ValueError` wird zu
  `HTTPBadRequest`.
- `to > from` enforced.
- **DoS-Schutz**: `MAX_PERIOD_DAYS = 90` — laengere Zeitraeume werden
  abgelehnt.

**KNX-GA-Validierung** (`validate_knx_ga`):

- Regex `^\d{1,2}/\d{1,2}/\d{1,3}$` — exakt das ETS-Format.
- Sowohl Path-Param `{ga}` als auch Body-Feld `ga` werden validiert.

**Hard-Limits** (`api/knx_stats.py`):

| Parameter | Max | Begruendung |
|---|---|---|
| `top.limit` | 500 | Verhindert volle Tabellen-Dumps |
| `timeline.gas` | 20 | Verhindert IN-Liste-DoS |
| `timeline.bucket` | 60 min | Verhindert pathologische Bucketing |
| `silence.max_silence_min` | 43200 (30 d) | Sinnvoller Bereich |
| `acknowledge.expiry_days` | int (any) | Wird erst bei `> 0` aktiv |

### 2.3 SQL-Injection

**Alle SQL-Statements verwenden `?`-Parameterbindung:**

- INSERT/UPDATE/DELETE in `knx_stats_repo.py` — gebundene Parameter.
- `_TIMELINE_SQL` mit dynamischer `IN ({placeholders})`-Liste:
  Placeholders sind `?`-Tokens, die GAs werden als Liste-Args
  gebunden. **Kein String-Interp** der Werte selbst — die
  GA-Strings landen als Bound-Parameter.
- Validierung der GAs via `validate_knx_ga` als zusaetzlicher
  Schutz vor unerwarteten Werten.

### 2.4 Persistenz

**`knx_ga_acknowledgements`-Tabelle:**

- `note`-Feld ist `TEXT`, kann beliebigen User-Input enthalten.
  Wird nur als Display-Text und im Audit-Log gerendert — keine
  Eval/Exec-Pfade.
- `expiry_days` wird als `int` validiert; negative Werte werden zu
  „sticky" behandelt (`expires_at = NULL`).

**`knx_telegram_counters`:**

- Nur `ga` (validiert) und `hour_bucket` (vom Server berechnet) +
  Counter (server-managed). Keine User-Daten.

### 2.5 Audit-Logging

Alle administrativen Aktionen loggen via `audit()`:

- `knx_stats_acknowledge` — `target_id=ga`, `details={note, expiry_days}`
- `knx_stats_unacknowledge` — `target_id=ga`

Read-Endpoints (summary/top/silence/etc.) loggen nicht im Audit-Log,
weil sie nicht-mutativ sind. ✓

### 2.6 Eventbus-Trigger (QS-l Alarm-Regeln)

Beim Aufruf von `/api/messagehub/knx-stats/alarms` werden HA-Eventbus-
Events `messagehub_knx_alarm_triggered` mit dem Alarm-Payload
gefeuert, falls `triggered=True`.

**Abuse-Risiko:** Ein Admin-User koennte den Endpoint absichtlich
mehrfach aufrufen, um Eventspam zu erzeugen. Da Admin-only und
nur erfolgreiche Auswertung Events feuert, akzeptabel. Phase-2-
Vorschlag: Rate-Limit fuer den Endpoint.

### 2.7 Frontend

- Filter werden in `localStorage` gehalten — keine sensitiven Daten.
- Eingaben (Min-Rate, Note bei Acknowledge) werden via `JSON.stringify`
  serialisiert — keine Template-Injektion.
- HTML-Rendering ueber Lit-Templates — auto-escape fuer User-Daten
  (Label, Note).

**Geprueft:** `innerHTML`/`document.write` werden nirgends in den
neuen Components verwendet. ✓

### 2.8 Logging-Hygiene

- KNX-Listener loggt Telegramme auf `DEBUG`-Level (nicht INFO),
  ausser dem ersten Telegramm-Receive (Initial-Marker).
- Schatten-Counter-Failures werden nur auf `DEBUG` geloggt — keine
  Hot-Path-Stoerung, kein Log-Spam.

### 2.9 Fehlerszenarien

- DB-Connection-Verlust: alle Endpoints geben `503 not initialised`
  zurueck (kein Stack-Trace).
- Invalid `ga` als Path-Param: `400` mit klarer Fehlermeldung.
- Discovery-Fehler in Orphans-Endpoint: `discovery_status` im JSON,
  keine Exception nach aussen.

---

## 3. Zusammenfassung

### Findings

| # | Kategorie | Beschreibung | Severity | Status |
|---|---|---|---|---|
| 1 | DRY | `_safe_ratio` / `_compute_ratio` dupliziert | low | ✓ Behoben (Iter 18) |
| 2 | Performance | `compute_summary` ruft `compute_top` fuer Counts | low | Akzeptiert, dokumentiert |
| 3 | Phase 2 | Alarm-Schwellen nicht via UI konfigurierbar | enhancement | Geplant Phase 2 |
| 4 | Security | Alarm-Endpoint kann Eventspam ausloesen | low | Admin-only, akzeptiert |
| 5 | Security | Acknowledge-Note ohne Length-Limit (DB-Bomb) | medium | ✓ Behoben (Iter 19): Hard-Cap 1000 Zeichen via `validate_note` |

### Quality-Gates final

- **Backend:** 447 unit tests, ruff check + format clean
- **Frontend:** typecheck clean, 68 tests passing
- **Bundle:** 262 KB (gzip 52 KB), in `frontend_dist/` committed
- **Konzept-Doku:** `docs/messagehub_knx_statistik.md` (739 Zeilen),
  `docs/messagehub_knx_statistik_review.md` (dieses Dokument)
- **CHANGELOG.md:** 0.11.0-Block mit allen neuen Features
- **README.md:** KNX-Bus-Analyse-Sektion ergaenzt

### Phasen-Reife

- **Phase 1 (in Arbeit / 0.11.0):** alles abgedeckt — 4 QS-Features +
  Hauptkonzept + Schatten-Counter-Pflege.
- **Phase 2 (Backlog):**
  - Schatten-Counter-Lese-API + UI
  - Alarm-Schwellen ueber Config-Flow konfigurierbar
  - Rate-Limit fuer Alarm-Endpoint

### Empfehlung

Release 0.11.0 ist freigabereif, nachdem der User es in seiner HA-
Installation kurz validiert hat. Tag-Push ist im Sandbox blockiert —
manuelles Anlegen ueber GitHub-Web-UI noetig.

---

**Ende des Reviews.**
