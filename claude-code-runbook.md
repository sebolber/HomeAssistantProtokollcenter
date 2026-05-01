# Claude Code Runbook — Home Assistant Integration `messagehub`

**Mission:** Vollständige Implementierung einer HA Custom Integration zur zentralen Sammlung, Filterung, Analyse und Forwarding von Nachrichten/Fehlermeldungen aller Art. Strikt iterativ, TDD-getrieben, mit automatischer Fortsetzung.

**Adressat dieses Dokuments:** Claude Code (Sonnet 4.5+ / Opus 4.7) als ausführender Agent, läuft autonom durch alle Iterationen.

**Maintainer:** sebolber

---

## 0. Globale Arbeitsanweisung an Claude Code

Du bist **alleiniger Implementierer** dieses Projekts. Du arbeitest die Iterationen 1–48 **sequenziell und ohne Rückfragen** ab. Nach erfolgreichem Commit einer Iteration startest du die nächste sofort. Du stoppst nur unter den in §7 definierten Bedingungen.

### Verbindliche Grundregeln

1. **TDD ist Pflicht.** Jede Iteration: erst Test (rot), dann Implementierung (grün), dann Refactor. Kein Code ohne vorherigen Test.
2. **Zeitbudget pro Iteration: 60 Minuten.** Wenn absehbar überschritten → Iteration im aktuellen Stand committen mit Suffix `(WIP)`, in `ITERATIONS.md` als „split needed" markieren, dann nächste Iteration starten.
3. **Quality Gates aus §4 sind nicht verhandelbar.** Bei Verstoß → Iteration nicht committen, Fehler in `BLOCKERS.md` dokumentieren, dann nächste Iteration.
4. **Sprache:** Code-Identifiers Englisch, Kommentare Deutsch wo sinnvoll, User-facing Strings über Translations (DE primär, EN sekundär).
5. **Kein Scope-Creep.** Was nicht in der jeweiligen Iteration steht, wird nicht implementiert. Ideen → `BACKLOG.md`.
6. **Keine destruktiven Operationen ohne Backup.** Vor `git reset`, `rm -rf`, DB-Schema-Drops: Sicherung anlegen.

### Iterations-Schleife (Pseudocode)

```
für n in [1..48]:
    1. Iteration §6.n vollständig lesen
    2. Branch erstellen oder auf main bleiben (siehe §3)
    3. TDD-Zyklus: Tests → Code → Refactor
    4. Quality Gates aus §4 prüfen
    5. Bei Fail: BLOCKERS.md dokumentieren, abbrechen ODER weitermachen (siehe §7)
    6. Commit nach §3.4 Convention
    7. ITERATIONS.md updaten: Status, Dauer, Notes
    8. Direkt mit n+1 fortfahren, ohne Pause, ohne Rückfrage
nach Iteration 48:
    9. Final-Report nach FINAL-REPORT.md
    10. Stoppen
```

---

## 1. Projekt-Kontext

**Was wird gebaut:** HA Custom Integration `messagehub`. Sammelt Nachrichten (Severity, Quelle, Text, Timestamp, Metadata) aus mehreren Eingangskanälen (Webhook, MQTT, HA-Eventbus, Syslog), persistiert in eigener SQLite, bietet ein Lovelace-Sidebar-Panel mit Filterung, Live-Update, Detail-View und Settings, dazu Notification-Forwarding, Deduplizierung, Status-Lifecycle, Anomalie-Erkennung, Heartbeat-Tracking, FTS5-Suche und mehr.

**Vollständige fachliche Spec:** siehe `docs/messagehub_konzept.md` und `docs/messagehub_erweiterungen.md` im Repo (vom User bereitgestellt).

**Nicht-Ziele:**
- Multi-User-Berechtigungen jenseits des HA-Admin-Flags
- Cloud-Sync, externe APIs außer expliziten Notification-Channels
- Ersatz für Loki/Grafana — wir wollen ein gut bedienbares Frontend für ein paar 100 k Nachrichten, kein Log-Aggregator-Stack

---

## 2. Tech-Stack & Tooling (verbindlich)

### 2.1 Backend (Python in `custom_components/messagehub/`)

| Tool | Version | Zweck |
|---|---|---|
| Python | 3.12+ | passend zu HA 2026.x |
| Home Assistant | ≥ 2025.10 | Mindest-Compat, in `manifest.json` setzen |
| aiosqlite | ≥ 0.20 | Async SQLite |
| jsonpath-ng | ≥ 1.6 | Field-Mapping |
| voluptuous | bereits HA-Dep | Schema-Validation |
| pytest | ≥ 8.0 | Test-Runner |
| pytest-homeassistant-custom-component | aktuell | HA-Test-Fixtures |
| pytest-asyncio | ≥ 0.23 | Async-Tests |
| pytest-cov | ≥ 5.0 | Coverage |
| ruff | ≥ 0.6 | Lint + Format (ersetzt Black + isort + flake8) |
| mypy | ≥ 1.10 | Type-Check |

### 2.2 Frontend (TypeScript in `frontend/`)

| Tool | Version | Zweck |
|---|---|---|
| TypeScript | 5.4+ | Sprache |
| Lit | 3.x | Web Components (HA-konsistent) |
| Vite | 5.x | Bundler, dev-server |
| Vitest | 1.x | Unit-Tests |
| @web/test-runner | optional | Component-Tests im Browser |
| eslint + @typescript-eslint | aktuell | Lint |
| prettier | aktuell | Format |

### 2.3 Repo-Tooling

- **pre-commit** (ruff, mypy, eslint, prettier auf staged files)
- **conventional-commits** via commitlint
- **GitHub Actions:** Test-Matrix Python 3.12/3.13, Frontend-Build, HACS-Validation
- **HACS-Konformität:** `hacs.json` und Repo-Tags

### 2.4 Entwicklungs-Setup

- **HA Dev-Container** (devcontainer.json mit `ghcr.io/home-assistant/home-assistant:dev`)
- Custom Component wird per Volume in `/config/custom_components/messagehub` gemountet
- `pytest` läuft im selben Container

---

## 3. Repo-Struktur, Branch- & Commit-Strategie

### 3.1 Verzeichnisstruktur (Endzustand)

```
.
├── .claude/
│   ├── settings.json              # Hooks (siehe §8)
│   └── commands/                  # benutzerdef. Slash-Commands
├── .github/workflows/             # CI
├── .vscode/                       # Empfohlene Settings
├── custom_components/messagehub/
│   ├── __init__.py
│   ├── manifest.json
│   ├── const.py
│   ├── config_flow.py
│   ├── storage/
│   │   ├── __init__.py
│   │   ├── database.py            # aiosqlite Wrapper
│   │   ├── migrations.py
│   │   ├── models.py              # Dataclasses
│   │   └── repositories.py        # Query-Layer
│   ├── ingestion/
│   │   ├── __init__.py
│   │   ├── webhook.py
│   │   ├── mqtt.py
│   │   ├── eventbus.py
│   │   └── syslog.py
│   ├── processing/
│   │   ├── __init__.py
│   │   ├── deduplication.py
│   │   ├── lifecycle.py
│   │   ├── escalation.py
│   │   ├── heartbeat.py
│   │   └── anomaly.py
│   ├── notifications/
│   │   ├── __init__.py
│   │   ├── forwarder.py
│   │   ├── quiet_hours.py
│   │   └── channels/              # telegram, pushover, ntfy, signal
│   ├── api/
│   │   ├── __init__.py
│   │   ├── messages.py
│   │   ├── webhooks.py
│   │   ├── stats.py
│   │   └── audit.py
│   ├── sensor.py
│   ├── binary_sensor.py
│   ├── services.yaml
│   ├── translations/
│   │   ├── de.json
│   │   └── en.json
│   └── frontend_dist/             # Build-Output, in Git
├── frontend/
│   ├── src/
│   │   ├── messagehub-panel.ts
│   │   ├── components/
│   │   ├── views/
│   │   └── api-client.ts
│   ├── tests/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── eslint.config.js
├── tests/
│   ├── conftest.py
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/
│   ├── messagehub_konzept.md
│   ├── messagehub_erweiterungen.md
│   └── runbooks/                  # Beispiel-Runbooks für §6.43
├── scripts/
│   ├── dev-setup.sh
│   ├── run-iteration.sh           # siehe §8
│   └── auto-commit.sh
├── CLAUDE.md
├── .claudeignore
├── ITERATIONS.md                  # Status-Tracker, von Claude gepflegt
├── BLOCKERS.md                    # Probleme, von Claude gepflegt
├── BACKLOG.md                     # Out-of-scope-Ideen
├── FINAL-REPORT.md                # nach Iteration 48
├── README.md
├── hacs.json
├── pyproject.toml
├── .pre-commit-config.yaml
├── .gitignore
└── LICENSE
```

### 3.2 Branch-Strategie

**Vereinfacht:** alles auf `main`. Jede Iteration = ein oder mehrere Commits. Kein Branch-Wechsel, kein PR-Workflow — das ist ein Einzelentwickler-Repo, das Overhead minimiert.

Falls eine Iteration das Schema bricht oder destruktiv wirkt: vorher `git tag iter-N-pre` setzen, damit Rollback möglich.

### 3.3 Conventional Commits (verbindlich)

Format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`, `perf`.
**Scope:** primärer Modulname, z. B. `storage`, `webhook`, `panel`, `mqtt`, `dedup`, `lifecycle`, `notify`, `meta`.
**Subject:** Imperativ, klein, kein Punkt am Ende, ≤ 72 Zeichen.

**Beispiele:**
```
feat(storage): add aiosqlite repository with messages CRUD
test(webhook): cover JSONPath mapping edge cases
chore(meta): bootstrap pre-commit hooks
```

**Footer immer:**
```
Iteration: <N>
Duration: <minutes>m
Coverage: <percent>%
```

### 3.4 Commit-Granularität pro Iteration

- Mindestens **ein** Commit pro Iteration
- Bei größeren Iterationen (z. B. Frontend-Filter): logisch trennen in `test:` + `feat:` + `docs:` Commits
- Letzter Commit der Iteration enthält Footer mit Iterations-Metadaten

---

## 4. Quality Gates (alle müssen pro Iteration erfüllt sein)

| Gate | Tool | Schwellwert | Bei Fail |
|---|---|---|---|
| Backend-Tests grün | pytest | 100 % der neuen + 100 % der bestehenden | Abbruch, BLOCKERS.md |
| Backend-Coverage | pytest-cov | ≥ 80 % auf neuem Code, ≥ 75 % gesamt | Warnung, weitermachen |
| Backend-Lint | ruff check | 0 Errors, 0 neue Warnings | Abbruch |
| Backend-Format | ruff format | clean | Auto-Fix |
| Backend-Types | mypy --strict | 0 Errors auf `custom_components/messagehub/` | Abbruch |
| Frontend-Tests grün | vitest | 100 % | Abbruch |
| Frontend-Lint | eslint | 0 Errors | Abbruch |
| Frontend-Types | tsc --noEmit | 0 Errors | Abbruch |
| Frontend-Build | vite build | erfolgreich | Abbruch |
| HA-Smoke-Test | siehe §4.1 | je nach Iteration | Warnung, BLOCKERS.md |
| Pre-commit-Hooks | pre-commit run --all-files | grün | Auto-Fix oder Abbruch |
| Conventional Commit | commitlint | konform | Commit-Message korrigieren |

### 4.1 HA-Smoke-Test

Ab Iteration 5 (sobald die Integration ladbar ist) wird nach jedem Commit:

1. HA Dev-Container neu gestartet (`scripts/restart-ha.sh`)
2. Logs auf `ERROR` und `messagehub` geprüft
3. Bei Iterationen mit API: `curl` gegen lokalen Endpoint
4. Bei Iterationen mit Panel: Headless-Browser via Playwright (ab Iter. 16)

Ergebnis in `tests/smoke/iteration-N.log`.

---

## 5. CLAUDE.md & .claudeignore (initial in Iteration 1 anlegen)

### 5.1 CLAUDE.md (Inhalt zur Aufnahme in Iteration 1)

```markdown
# Repo-Kontext für Claude Code

## Projekt
Home Assistant Custom Integration `messagehub` — siehe `docs/messagehub_konzept.md`.

## Wichtigste Regeln
- TDD verbindlich, siehe `claude-code-runbook.md` §0
- Jede Iteration ≤ 60 min inkl. Tests
- Quality Gates §4 sind harte Bedingungen
- Commits nach Conventional-Commits-Convention §3.3
- Niemals `git reset --hard`, `rm -rf` ohne `iter-N-pre`-Tag

## Code-Stil Backend
- Type-Hints überall (mypy --strict)
- Async-First (`asyncio`, `aiosqlite`)
- Keine globalen Singletons; `hass.data[DOMAIN]` als Container
- Logging: `_LOGGER = logging.getLogger(__name__)`, niemals `print()`
- Strings für UI über `translations/`, nicht hartkodiert
- Konstanten in `const.py`, keine Magic Strings

## Code-Stil Frontend
- Lit + TypeScript strict mode
- Komponenten in eigener Datei pro Klasse
- HA-Theme-Variablen (`var(--primary-text-color)`) statt Farb-Literale
- Keine externen UI-Libs außer Lit selbst

## Test-Stil
- Arrange / Act / Assert klar getrennt
- Test-Namen: `test_<verb>_<condition>_<expected>`
- Async-Tests mit `@pytest.mark.asyncio`
- Fixtures in `tests/conftest.py` zentral

## Git
- Conventional Commits, Footer mit Iteration/Duration/Coverage
- Niemals `git push --force` auf main

## Reviews
- Wenn unklar, ob Scope erfüllt: in BLOCKERS.md eintragen, nicht raten
```

### 5.2 `.claudeignore` (Inhalt zur Aufnahme in Iteration 1)

```
# Build-Artefakte
custom_components/messagehub/frontend_dist/
frontend/dist/
frontend/node_modules/
**/__pycache__/
.pytest_cache/
.mypy_cache/
.ruff_cache/
htmlcov/
.coverage
*.pyc

# HA-Dev-Container State
.devcontainer/config/

# Smoke-Test-Logs
tests/smoke/

# OS / IDE
.DS_Store
.vscode/
.idea/

# Große Doc-Backups
docs/archive/
```

---

## 6. Iterationen 1 – 48

**Konvention pro Iteration:**

```
### Iteration N — <Titel>
**Phase:** <Phase>
**Ziel:** <ein Satz>
**Scope IN:** <Bullets>
**Scope OUT:** <Bullets>
**Tests-zuerst:** <konkrete Tests>
**DoD:**
  - [ ] alle Tests grün
  - [ ] Quality Gates §4 erfüllt
  - [ ] Commit-Footer mit Iter/Duration/Coverage
**Commit-Beispiel:** `<type>(<scope>): <subject>`
```

---

### PHASE A — Foundation & Storage (Iter. 1–7)

#### Iteration 1 — Repo-Bootstrap
**Ziel:** Repo-Struktur und Tooling steht, Integration lädt leer in HA.
**Scope IN:**
- `pyproject.toml` mit ruff/mypy/pytest-Konfig
- `.pre-commit-config.yaml`, installiert
- `manifest.json` mit Domain `messagehub`, leerem `requirements`
- `__init__.py` mit `async_setup_entry` (No-op)
- `const.py` mit `DOMAIN = "messagehub"`
- `CLAUDE.md`, `.claudeignore`, `.gitignore`
- `ITERATIONS.md` Skelett, `BLOCKERS.md`, `BACKLOG.md` leer
- `.github/workflows/ci.yml` mit Test-Job
**Scope OUT:** alles Inhaltliche
**Tests-zuerst:** `test_setup_entry_succeeds_with_empty_config`
**Commit:** `chore(meta): bootstrap repository, tooling, CI`

#### Iteration 2 — SQLite-Storage-Schicht (Schema + Connection)
**Scope IN:**
- `storage/database.py`: async Connection-Manager, DB-Pfad in `<config>/messagehub/messages.db`
- `storage/migrations.py`: Migration-Runner mit `schema_version`-Tabelle
- Migration `0001_initial.sql`: Tabellen `messages`, `webhook_configs`, `schema_version`
- Indizes laut Konzept §2
**Tests-zuerst:**
- `test_database_creates_file_on_first_open`
- `test_migrations_idempotent`
- `test_schema_version_after_initial_migration`
**Commit:** `feat(storage): add aiosqlite connection and migration runner`

#### Iteration 3 — Models & Validierung
**Scope IN:**
- `storage/models.py`: Dataclasses `Message`, `WebhookConfig`, Enum `Severity`
- Validatoren: Severity-Whitelist, Source-Format (`^[a-z0-9._-]{1,64}$`), Text-Limit (8 KB)
- Severity-Normalisierung: `ERROR`/`5`/`err` → `Severity.ERROR`
**Tests-zuerst:**
- `test_message_rejects_invalid_severity`
- `test_severity_normalisation_handles_synonyms`
- `test_source_validator_rejects_uppercase`
**Commit:** `feat(storage): add typed models and validators`

#### Iteration 4 — Message-Repository (CRUD)
**Scope IN:**
- `storage/repositories.py`: `MessageRepository` mit `insert`, `get_by_id`, `delete_by_id`, `list_recent(limit)`, `count_total`
- Async, parametrisiert, SQL-Injection-sicher
**Tests-zuerst:**
- `test_insert_message_returns_id`
- `test_list_recent_orders_by_timestamp_desc`
- `test_delete_by_id_returns_false_when_missing`
- `test_count_total_after_inserts`
**Commit:** `feat(storage): implement message repository with CRUD`

#### Iteration 5 — Service `add_message` + Eventbus
**Scope IN:**
- `services.yaml`: Service `add_message`
- Service-Handler in `__init__.py`: validiert, persistiert via Repository, feuert Event `messagehub_message_added`
- `binary_sensor.messagehub_has_unacknowledged_errors` (Skelett)
**Tests-zuerst:**
- `test_add_message_service_persists_and_fires_event`
- `test_add_message_service_rejects_invalid_severity`
**Commit:** `feat(messagehub): add core service and message_added event`

#### Iteration 6 — Sensoren (Counter)
**Scope IN:**
- `sensor.py`: `messagehub_total`, `messagehub_errors_24h`, `messagehub_warnings_24h`, `messagehub_last_message`
- Aktualisierung bei Eventbus-Event
**Tests-zuerst:**
- `test_total_sensor_increments_on_event`
- `test_errors_24h_excludes_older_messages`
- `test_last_message_attribute_contains_full_object`
**Commit:** `feat(messagehub): add counter sensors`

#### Iteration 7 — Config-Flow (Erstinstallation + Options)
**Scope IN:**
- `config_flow.py` UI-only (keine Pflichtfelder)
- Options-Flow: globale Limits, Logging-Level
**Tests-zuerst:**
- `test_user_step_creates_entry`
- `test_options_flow_persists_values`
- `test_single_instance_only`
**Commit:** `feat(messagehub): add config and options flow`

---

### PHASE B — Webhook-Eingang (Iter. 8–12)

#### Iteration 8 — Webhook-Handler-Skelett
**Scope IN:** Registrierung über `webhook`-Komponente, ein hartkodierter Webhook für Smoke-Test, JSON-Body-Parsing, 1:1-Mapping Felder `severity`/`source`/`text`.
**Tests:** `test_webhook_accepts_minimal_json`, `test_webhook_400_on_invalid_json`, `test_webhook_persists_message`.
**Commit:** `feat(webhook): add minimal JSON webhook handler`

#### Iteration 9 — Webhook-Konfiguration in DB (CRUD ohne UI)
**Scope IN:** `WebhookConfigRepository` mit `add`, `get`, `update`, `delete`, `list`. Jeder Webhook hat eigene `webhook_id` (Token-URL-sicher, 32 Zeichen). Registrierung dynamisch zur Laufzeit.
**Tests:** `test_webhook_config_crud`, `test_dynamic_registration_after_add`, `test_unregister_after_delete`.
**Commit:** `feat(webhook): persist webhook configs with dynamic registration`

#### Iteration 10 — JSONPath-Field-Mapping
**Scope IN:** `processing/field_mapping.py` mit `jsonpath-ng`, Fallback auf Defaults. Plain-Text-Bodies → `text` komplett, Defaults sonst.
**Tests:** `test_mapping_extracts_nested_field`, `test_missing_path_uses_default`, `test_plain_text_body_falls_back_correctly`.
**Commit:** `feat(webhook): support configurable JSONPath field mapping`

#### Iteration 11 — Rate-Limiting & Body-Limits
**Scope IN:** Token-Bucket pro `webhook_id` (Default 60 req/min, konfigurierbar). Body-Limit 64 KB. HTTP 429 bei Limit, HTTP 413 bei Body-Limit. Selbst-Diagnose-Eintrag (`source=messagehub.internal`) bei Validierungsfehlern.
**Tests:** `test_rate_limit_returns_429_after_threshold`, `test_body_too_large_returns_413`, `test_self_diagnosis_entry_on_400`.
**Commit:** `feat(webhook): enforce rate and body size limits`

#### Iteration 12 — Severity-Mapping-Tabelle
**Scope IN:** Pro Webhook konfigurierbare Severity-Übersetzungstabelle (`{"5": "error", "P1": "error"}`). Speicherung in `webhook_configs.field_map_json`.
**Tests:** `test_custom_severity_map_applied`, `test_unknown_severity_falls_back_to_info`.
**Commit:** `feat(webhook): add per-webhook severity translation`

---

### PHASE C — REST-API für Panel (Iter. 13–15)

#### Iteration 13 — Endpoints `list` und `get`
**Scope IN:** `HomeAssistantView`-Subklassen, Routes `/api/messagehub/messages`, `/api/messagehub/messages/{id}`. Default-Limit 100, Hard-Cap 1000.
**Tests:** `test_list_returns_default_100`, `test_list_respects_limit_param`, `test_get_by_id_404_when_missing`.
**Commit:** `feat(api): add list and get endpoints for messages`

#### Iteration 14 — Filter & Pagination
**Scope IN:** Query-Params `severity` (CSV), `source`, `search`, `from`, `to`, `offset`. Server-seitige Volltextsuche per `LIKE` (FTS5 kommt in Iter. 33).
**Tests:** Filter-Matrix mit 12 Kombinationen, Pagination-Konsistenz.
**Commit:** `feat(api): add filtering and pagination to message list`

#### Iteration 15 — Endpoints `delete`, `sources`, `stats`, `webhooks`
**Scope IN:** Restliche Endpoints aus Konzept §6, alle admin-only.
**Tests:** `test_delete_message`, `test_sources_returns_distinct`, `test_stats_returns_severity_counts`.
**Commit:** `feat(api): complete REST surface for panel`

---

### PHASE D — Frontend-Panel (Iter. 16–21)

#### Iteration 16 — Panel-Registrierung & Build-Pipeline
**Scope IN:** `frontend/` mit Vite + Lit + TS, Vitest setup. `panel_custom`-Registrierung in `__init__.py` (require_admin: true). Build-Output landet in `custom_components/messagehub/frontend_dist/` und wird committet.
**Tests:** `test_panel_registered_after_setup`, Frontend-Smoke `tests/it_can_render_empty_panel`.
**Commit:** `feat(panel): bootstrap Lit panel with build pipeline`

#### Iteration 17 — Tabellen-Komponente mit Default-Liste
**Scope IN:** `<message-table>` Lit-Component, lädt `/api/messagehub/messages?limit=100`, rendert Severity-Icon + Timestamp + Source + Text. Virtualisiertes Scrolling mit `lit-virtualizer`.
**Tests:** Vitest: rendert N Items, Tastatur-Navigation funktioniert.
**Commit:** `feat(panel): add message table with default list`

#### Iteration 18 — Severity-Filter (Multi-Select Chips)
**Scope IN:** `<severity-filter>` mit Toggle-Chips, persistiert in `localStorage` per Schlüssel `messagehub.filters.severity`.
**Tests:** Vitest: Chip-Toggle ändert Query, Persistenz nach Reload.
**Commit:** `feat(panel): implement severity filter chips`

#### Iteration 19 — Source-/Volltext-/Zeitraum-Filter
**Scope IN:** Source-Dropdown lädt `/api/messagehub/sources`. Volltext-Suche debounced 300 ms. Zeitraum-Presets (Letzte Stunde, 24h, 7 Tage, Custom).
**Tests:** Vitest: Debounce, Custom-Range-Validierung.
**Commit:** `feat(panel): add source, search and time range filters`

#### Iteration 20 — Detail-Pane + Lösch-Funktion
**Scope IN:** Slide-In-Pane bei Klick, Markdown-Rendering für `text`, JSON-Pretty-Print für `metadata`. Löschen mit Confirmation-Dialog.
**Tests:** Vitest: Pane öffnet/schließt, Delete ruft API.
**Commit:** `feat(panel): add detail pane with delete action`

#### Iteration 21 — WebSocket-Subscription für Live-Updates
**Scope IN:** Subscription auf `messagehub_message_added`. Neue Nachrichten oben einfügen, falls aktiver Filter passt, mit Highlight-Animation.
**Tests:** Vitest: Mock-Event triggert UI-Update, Filter-Konformität.
**Commit:** `feat(panel): live update via websocket subscription`

---

### PHASE E — Verwaltung & Lifecycle (Iter. 22–25)

#### Iteration 22 — Settings-Tab: Webhook-Liste (read-only)
**Scope IN:** Tab-Switching im Panel, `<webhook-list>` mit Daten aus `/api/messagehub/webhooks`, jeweils mit Copy-URL-Button.
**Tests:** Vitest: Tab-Switch, URL-Copy.
**Commit:** `feat(panel): add settings tab with webhook list`

#### Iteration 23 — Webhook Add/Edit/Delete UI
**Scope IN:** Inline-Form mit Mapping-Editor (JSON-Textarea + Validate-Button), Severity-Map-Editor (Key-Value-Liste).
**Tests:** Vitest: Validate-Button erkennt fehlerhaftes JSONPath. API-Tests: PUT/POST/DELETE.
**Commit:** `feat(panel): add webhook CRUD UI`

#### Iteration 24 — Retention-Job
**Scope IN:** `processing/retention.py`, täglich 03:30 via `async_track_time_change`. Pro Severity: max-Alter und max-Anzahl. `VACUUM` wöchentlich.
**Tests:** `test_retention_keeps_within_limits`, `test_vacuum_runs_weekly_only`.
**Commit:** `feat(messagehub): implement retention and vacuum jobs`

#### Iteration 25 — Translations DE/EN, README, hacs.json
**Scope IN:** Vollständige `de.json` und `en.json`, README mit Screenshots-Platzhaltern, `hacs.json`, Repo-Tags.
**Tests:** `test_all_translation_keys_present_in_de_and_en`.
**Commit:** `docs(meta): translations, README, HACS metadata`

---

### PHASE F — Erweiterungen: Lifecycle & Dedup (Iter. 26–29)

#### Iteration 26 — Deduplizierung: Fingerprint-Berechnung
**Scope IN:** `processing/deduplication.py`. Fingerprint = SHA-256 aus `source + severity + normalisierter_text` (Zahlen via Regex `\d+` → `N`, UUIDs → `UUID`, IPs → `IP`). Spalten `fingerprint`, `count`, `first_seen`, `last_seen` in `messages` (Migration 0002).
**Tests:** `test_fingerprint_stable_across_numeric_variants`, `test_fingerprint_distinct_for_different_sources`.
**Commit:** `feat(dedup): add fingerprint computation`

#### Iteration 27 — Aggregation auf Insert
**Scope IN:** Bei Insert: Fingerprint berechnen, falls aktiver (= nicht resolved) Eintrag mit gleichem Fingerprint in letzten N Minuten → Update statt Insert (`count += 1`, `last_seen` aktualisiert). N konfigurierbar (Default 10).
**Tests:** `test_aggregation_increments_existing`, `test_resolved_message_does_not_aggregate`, `test_window_expires`.
**Commit:** `feat(dedup): aggregate messages within configurable window`

#### Iteration 28 — Status-Lifecycle
**Scope IN:** Spalte `status` (`new`, `acknowledged`, `resolved`, `expired`). Migration 0003. Service `set_status`. Auto-Transition `new` → `expired` nach Retention-Alter.
**Tests:** `test_status_transitions`, `test_set_status_service`, `test_auto_expire_after_age`.
**Commit:** `feat(lifecycle): add message status lifecycle`

#### Iteration 29 — Acknowledge-UI im Panel
**Scope IN:** Ack-Button im Detail-Pane, Bulk-Ack im Listen-View, Filter „nur unbestätigte". Counter-Sensor `messagehub_unacknowledged_errors`.
**Tests:** Vitest: Ack-Flow, API-Test für Bulk-Ack.
**Commit:** `feat(lifecycle): add acknowledge UI and unack filter`

---

### PHASE G — Notifications (Iter. 30–32)

#### Iteration 30 — Notification-Forwarder-Framework + Telegram
**Scope IN:** `notifications/forwarder.py` mit Channel-Plugin-Pattern. Erste Implementierung: Telegram über `notify.telegram` Service. Konfiguration pro Channel in DB-Tabelle `notification_channels` (Migration 0004).
**Tests:** `test_forwarder_dispatches_to_enabled_channels`, `test_telegram_channel_payload_format`.
**Commit:** `feat(notify): add forwarder framework with Telegram channel`

#### Iteration 31 — Quiet Hours + Throttling
**Scope IN:** Pro Channel: Severity-Schwellwert, Quiet Hours (z. B. 22:00–07:00), Throttling (max. 1 pro Source pro 10 min). Bypass für `error` möglich, konfigurierbar.
**Tests:** `test_quiet_hours_blocks_info_but_passes_error_when_bypass`, `test_throttle_per_source`.
**Commit:** `feat(notify): add quiet hours and per-source throttling`

#### Iteration 32 — Severity-Eskalation per Pattern
**Scope IN:** `processing/escalation.py`. Regeln: `if N error from same source within T minutes → fire critical`. Konfigurierbar in DB (Migration 0005). Generiert Meta-Nachricht mit `source=messagehub.escalation`.
**Tests:** `test_escalation_fires_when_threshold_crossed`, `test_no_double_escalation_within_cooldown`.
**Commit:** `feat(escalation): add rule-based severity escalation`

---

### PHASE H — Intelligenz (Iter. 33–36)

#### Iteration 33 — SQLite FTS5 Volltextsuche
**Scope IN:** Migration 0006: FTS5-Schatten-Tabelle `messages_fts` mit Triggern (insert/update/delete). API-Search-Param nutzt FTS5 mit BM25-Ranking statt LIKE.
**Tests:** `test_fts_finds_substring`, `test_fts_ranking_orders_relevance`, `test_trigger_keeps_fts_in_sync`.
**Commit:** `perf(api): use SQLite FTS5 for full-text search`

#### Iteration 34 — Korrelations-IDs / Trace-Gruppen
**Scope IN:** Spalte `trace_id` in `messages` (Migration 0007). Webhook-Mapping unterstützt `trace_id`-Pfad. Auto-Generierung wenn fehlt: Hash aus `source + Zeitfenster`. Panel: Detail-Pane zeigt verknüpfte Nachrichten, Filter „nur diese Trace-Gruppe".
**Tests:** `test_trace_id_auto_generation_groups_burst`, Vitest: Trace-Filter.
**Commit:** `feat(messagehub): correlate messages via trace ID`

#### Iteration 35 — Heartbeat-Tracking
**Scope IN:** Tabelle `heartbeat_sources` (Migration 0008): `source`, `expected_interval_seconds`, `last_seen`, `silent_alert_active`. Periodischer Job (alle 60 s) prüft, ob `last_seen + 1.5 × expected_interval` überschritten → erzeugt Nachricht `severity=warning`, `source=messagehub.heartbeat`. Settings-Subview im Panel zur Verwaltung.
**Tests:** `test_silent_source_triggers_warning`, `test_heartbeat_resets_on_new_message`, `test_alert_clears_after_message_returns`.
**Commit:** `feat(heartbeat): detect silent sources and alert`

#### Iteration 36 — Anomalie-Erkennung (EWMA-Frequenz)
**Scope IN:** `processing/anomaly.py`. Pro Source rollender EWMA der Nachrichten-Rate (1 min Buckets). Bei aktueller Rate > 3σ über Mittel → Meta-Nachricht `source=messagehub.anomaly`. Persistierter EWMA-State in Tabelle `source_metrics` (Migration 0009).
**Tests:** `test_ewma_baseline_stable_over_time`, `test_burst_triggers_anomaly`, `test_state_persists_across_restarts`.
**Commit:** `feat(anomaly): add EWMA-based frequency anomaly detection`

---

### PHASE I — Mehr Eingangskanäle (Iter. 37–39)

#### Iteration 37 — MQTT-Adapter
**Scope IN:** `ingestion/mqtt.py`. Konfigurierbare Topic-zu-Source-Map in DB (Migration 0010). Wildcards `+/#` erlaubt. Nutzt vorhandenes MQTT-Setup über HA-Service.
**Tests:** `test_mqtt_topic_maps_to_source`, `test_wildcard_topic_resolution`.
**Commit:** `feat(mqtt): ingest messages from configurable topics`

#### Iteration 38 — HA-Eventbus-Listener
**Scope IN:** Listener für `system_log_event`, `state_changed` mit Filter auf `unavailable`/`unknown`, `logbook_entry`. Mapping auf Severity konfigurierbar.
**Tests:** `test_system_log_warning_creates_warning_message`, `test_unavailable_state_creates_error`, `test_filter_excludes_groups`.
**Commit:** `feat(ingestion): subscribe to HA event bus for system signals`

#### Iteration 39 — Syslog-UDP-Listener (optional, default off)
**Scope IN:** UDP-Listener auf konfigurierbarem Port (Default 5514, nicht 514 wegen Privilegien). RFC-3164-Parser für Severity & Hostname. Toggle in Options-Flow.
**Tests:** `test_syslog_parses_rfc3164`, `test_severity_mapping`, `test_disabled_by_default`.
**Commit:** `feat(ingestion): add optional syslog UDP listener`

---

### PHASE J — Analytics & Tagging (Iter. 40–42)

#### Iteration 40 — Health-Score pro Source
**Scope IN:** Berechnung 0–100 = `100 - (severity_weight × frequency × recency_decay)`. Materialisierte View bzw. periodische Aggregation. Sensor `sensor.messagehub_health_<source>` (dynamisch).
**Tests:** `test_health_decreases_with_recent_errors`, `test_health_recovers_over_time`.
**Commit:** `feat(analytics): compute per-source health score`

#### Iteration 41 — Statistik-Dashboard (Panel-View)
**Scope IN:** Neuer Tab „Stats" im Panel. Heatmap (Stunde × Wochentag), Top-10-Sources, Severity-Verteilung über 7/30 Tage. Daten aus `/api/messagehub/stats?range=...`. Nutzt eingebaute HA-Charts oder simple SVG.
**Tests:** API-Tests für Stats-Endpoint, Vitest für Komponenten.
**Commit:** `feat(panel): add statistics dashboard view`

#### Iteration 42 — Tags & Saved Filter Presets
**Scope IN:** Tabelle `message_tags` (n:m, Migration 0011). Tabelle `filter_presets` (per User, Migration 0012). UI: Tag-Editor im Detail-Pane, Preset-Speichern aus Filter-Bar.
**Tests:** `test_tag_assignment`, `test_preset_save_and_load`, Vitest für UI.
**Commit:** `feat(messagehub): add tagging and saved filter presets`

---

### PHASE K — Operations (Iter. 43–45)

#### Iteration 43 — Runbook-Verknüpfung
**Scope IN:** Tabelle `runbooks` (Migration 0013): Pattern (`source` + optional Fingerprint-Match) → Markdown-Inhalt. Im Detail-Pane eingebunden, `docs/runbooks/`-Ordner als Datei-Quelle alternativ unterstützt.
**Tests:** `test_runbook_matched_by_source`, `test_runbook_specific_fingerprint_overrides_generic`.
**Commit:** `feat(ops): add runbook linkage to messages`

#### Iteration 44 — Audit-Log
**Scope IN:** Tabelle `audit_log` (Migration 0014): wer, wann, was (delete, ack, webhook-create/update/delete, retention-change). API `/api/messagehub/audit` admin-only. UI als eigener Tab.
**Tests:** `test_delete_creates_audit_entry`, `test_audit_immutable_no_update_endpoint`.
**Commit:** `feat(audit): record administrative actions`

#### Iteration 45 — Export & Forensik-Bundle
**Scope IN:** Endpoint `/api/messagehub/export?format=jsonl|csv` mit aktivem Filter. Forensik-Bundle: ZIP mit DB-Dump (read-only Copy), aktueller Konfiguration, letzten 1000 Nachrichten als JSONL. Service `messagehub.create_forensic_bundle`.
**Tests:** `test_export_jsonl_streams_chunked`, `test_forensic_bundle_contains_all_artifacts`.
**Commit:** `feat(ops): add export and forensic bundle`

---

### PHASE L — Reports & Auto-Remediation (Iter. 46–48)

#### Iteration 46 — Wochenreport per Mail
**Scope IN:** Job sonntags 23:00. Generiert Markdown-Report (Counts pro Severity, Top-5-Sources, MTTR, Health-Trend). Versand über HA-`notify.email`-Service. Konfigurierbarer Empfänger.
**Tests:** `test_weekly_report_generation`, `test_email_dispatch_uses_notify_service`.
**Commit:** `feat(reports): add weekly summary email`

#### Iteration 47 — Auto-Remediation-Hooks
**Scope IN:** Tabelle `remediation_hooks` (Migration 0015): Pattern → HA-Automation/Skript-ID. Default-Modus: „Vorschlag" (Button im Detail-Pane). Auto-Execution explizit pro Hook freischaltbar mit `confirm_required: false`. Audit-Eintrag bei jeder Ausführung.
**Tests:** `test_suggestion_mode_does_not_execute`, `test_auto_mode_executes_and_logs`, `test_confirmation_required_blocks_until_user_action`.
**Commit:** `feat(remediation): add hook framework with suggestion and auto modes`

#### Iteration 48 — KNX-Telegramm-Anreicherung & Final Polish
**Scope IN:**
- KNX-Source-Detector: bei `source=knx-bus` Gruppenadresse aus `text` parsen (Regex `\d+/\d+/\d+`)
- Optionale Anreicherung aus ETS-Export (CSV) in `<config>/messagehub/knx_groupaddresses.csv`
- Lookup-Cache, Anreicherung in `metadata.knx_label`
- README finalisieren mit Screenshots, Architektur-Diagramm
- `FINAL-REPORT.md` generieren mit Coverage, LOC, Iterations-Statistik
**Tests:** `test_knx_address_extraction`, `test_label_lookup_from_ets_csv`.
**Commit:** `feat(knx): enrich KNX messages with group address labels` + `docs(meta): final report and screenshots`

---

## 7. Stop-Bedingungen

Claude Code stoppt **ausschließlich** in folgenden Fällen:

1. **Iteration 48 erfolgreich abgeschlossen** → `FINAL-REPORT.md` schreiben, `git tag v0.1.0`, beenden.
2. **Drei aufeinanderfolgende Iterationen mit Quality-Gate-Fail** → Stoppen, ausführlicher Eintrag in `BLOCKERS.md`, expliziter Hinweis im Chat.
3. **Datenverlust-Risiko erkannt** (z. B. Migration würde Daten droppen ohne Backup) → Sofort stoppen, manuelle Freigabe einfordern.
4. **Externe Dependency-Failure** (HA-Container startet nicht, GitHub-Actions-Auth defekt, npm-registry down) → Stoppen, Diagnose in `BLOCKERS.md`, manuell.
5. **Unerwartete Repo-Mutationen außerhalb der Iteration** (z. B. fremder Commit auf `main` während Lauf) → Stoppen.

In **allen anderen** Fällen wird weitergemacht — auch bei einzelnen fehlschlagenden Tests, die in `BLOCKERS.md` dokumentiert und in einer späteren Konsolidierungs-Iteration adressiert werden können.

---

## 8. Automation: Stop-Hook für autonome Fortsetzung

### 8.1 `.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/post-tool-check.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/stop-hook.sh"
          }
        ]
      }
    ]
  }
}
```

### 8.2 `scripts/stop-hook.sh`

```bash
#!/usr/bin/env bash
# Wird ausgeführt, wenn Claude Code eine Antwort beendet.
# Prüft, ob aktuelle Iteration sauber abgeschlossen ist und triggert die nächste.

set -euo pipefail

ITER_FILE="ITERATIONS.md"
CURRENT=$(grep -E "^- \[ \] Iteration [0-9]+" "$ITER_FILE" | head -1 | grep -oE "[0-9]+")
LAST_DONE=$(grep -E "^- \[x\] Iteration [0-9]+" "$ITER_FILE" | tail -1 | grep -oE "[0-9]+" || echo "0")

# 1. Letzte Iteration sauber abgeschlossen?
if ! git diff --quiet HEAD; then
  echo "stop-hook: working tree dirty, NICHT fortsetzen"
  exit 0
fi

# 2. Quality Gates prüfen (last commit)
if ! bash scripts/quality-gate.sh; then
  echo "stop-hook: quality gate failed, NICHT fortsetzen"
  exit 0
fi

# 3. Counter erhöhen, Hinweis ausgeben
NEXT=$((LAST_DONE + 1))
if [ "$NEXT" -gt 48 ]; then
  echo "stop-hook: alle Iterationen abgeschlossen"
  exit 0
fi

# 4. Trigger-Datei für nächste Iteration schreiben
echo "$NEXT" > .claude/next-iteration.txt
echo "stop-hook: bereit für Iteration $NEXT"

# 5. Re-Trigger Claude Code via CLI (falls headless)
# Diese Zeile aktivieren, wenn Du headless Claude Code via CLI nutzt:
# claude --resume --prompt "Bearbeite Iteration $NEXT laut runbook §6.$NEXT"
```

### 8.3 `scripts/quality-gate.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "→ ruff check"
ruff check custom_components/messagehub
echo "→ ruff format --check"
ruff format --check custom_components/messagehub
echo "→ mypy"
mypy custom_components/messagehub
echo "→ pytest"
pytest --cov=custom_components/messagehub --cov-fail-under=75
echo "→ frontend lint"
(cd frontend && npm run lint && npm run typecheck && npm test -- --run)
echo "✓ alle Quality Gates erfüllt"
```

### 8.4 `scripts/run-iteration.sh`

```bash
#!/usr/bin/env bash
# Manuell aufrufbar: ./scripts/run-iteration.sh 12
# Liest die Iteration aus dem Runbook und übergibt sie an Claude Code.
set -euo pipefail
N="${1:?Iteration-Nummer angeben}"
PROMPT="Lies claude-code-runbook.md §6.${N} und führe die Iteration vollständig aus, inkl. TDD, Quality Gates, Commit. Nach erfolgreichem Commit triggere Iteration $((N+1)) eigenständig laut §0."
exec claude --prompt "$PROMPT"
```

### 8.5 Auto-Continue innerhalb einer Session (ohne Hooks)

Falls keine Stop-Hooks zur Verfügung stehen, reicht in der Master-Prompt-Anweisung an Claude Code:

> Nach erfolgreichem Commit der Iteration N: Sage **nicht** „Soll ich fortfahren?", sondern beginne sofort mit Iteration N+1. Dieses Verhalten gilt bis Iteration 48 oder bis eine Stop-Bedingung aus §7 zutrifft.

---

## 9. Pflege-Dateien während des Laufs

### 9.1 `ITERATIONS.md` (von Claude pro Iteration aktualisiert)

```markdown
# Iterations Tracker

- [x] Iteration 1 — Repo-Bootstrap | 47 min | cov 100% | commit a1b2c3d
- [x] Iteration 2 — Storage Schicht | 53 min | cov 92% | commit e4f5g6h
- [ ] Iteration 3 — Models & Validierung
...
```

### 9.2 `BLOCKERS.md`

```markdown
# Blockers

## Iteration 11 — Rate-Limiting
- **Symptom:** `test_rate_limit_returns_429_after_threshold` flaky bei CI
- **Diagnose:** Token-Bucket nutzt `time.monotonic()`, Test-Mock greift nicht
- **Status:** offen, in Iteration 13 adressieren
- **Datum:** 2026-05-04
```

### 9.3 `BACKLOG.md`

Lose Ideen, die während der Iterationen aufkommen, aber nicht Scope sind. Wird nach Iteration 48 zu Roadmap v0.2.

### 9.4 `FINAL-REPORT.md` (nach Iteration 48)

```markdown
# Final Report — messagehub v0.1.0

## Statistiken
- Iterationen abgeschlossen: 48 / 48
- Gesamtdauer: <minutes>
- Commits: <count>
- LoC Backend / Frontend / Tests: x / y / z
- Coverage: <percent>%

## Bekannte Einschränkungen
...

## Roadmap v0.2 (aus BACKLOG.md)
...
```

---

## 10. Kommunikation mit dem Maintainer

Während des Laufs schreibst du **keine** Status-Reports in den Chat — alle Statusinfos gehen in `ITERATIONS.md` und `BLOCKERS.md`. Nur in folgenden Fällen meldest du dich aktiv:

1. Stop-Bedingung aus §7 erreicht
2. Frage zu Spec-Lücke, die nicht im Konzept oder Erweiterungs-Dokument klärbar ist (selten — bevorzugt in `BLOCKERS.md` dokumentieren und Default-Annahme treffen)
3. Vor destruktiven Operationen (Schema-Drop o. ä.)

---

## 11. Erfolgskriterium

Nach Iteration 48:

- ✅ Integration installiert sich aus dem Repo via HACS-Custom-Repository
- ✅ Webhooks empfangen Nachrichten, persistieren, taggen, deduplizieren
- ✅ Panel zeigt Default-View (100 letzte) mit voll funktionsfähigen Filtern
- ✅ Notifications gehen mit Quiet Hours / Throttling
- ✅ Heartbeat- und Anomalie-Erkennung erzeugen Meta-Nachrichten
- ✅ MQTT-, Eventbus- und Syslog-Eingänge laufen
- ✅ Wochenreport per Mail funktioniert
- ✅ Coverage ≥ 80 % gesamt
- ✅ Alle Quality Gates aus §4 grün auf `main`

**Tag:** `v0.1.0`. Damit ist die Aufgabe abgeschlossen.

---

**Ende des Runbooks.**
