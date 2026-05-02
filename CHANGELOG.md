# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.
Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionen folgen [Semantic Versioning](https://semver.org/lang/de/).

## [0.8.0] – 2026-05-02

Lovelace-Release. Sechs zusätzliche Sensoren machen die Integration in
HA-Dashboards direkt nutzbar — alle Severity-Counts (all-time und
1 h / 7 d) als eigene Entitäten, plus fertige Lovelace-Karten zum
Copy-Paste.

### Hinzugefügt

- **6 neue Sensoren** für Lovelace-Dashboards:
  - `sensor.messagehub_errors_total`, `_warnings_total`, `_info_total`,
    `_debug_total` — Severity-Counts über den gesamten Zeitraum
    (state-class `total`, damit HA sie in der Statistik-DB ablegt)
  - `sensor.messagehub_messages_last_1h`, `_messages_last_7d` —
    severity-übergreifende Time-Window-Counts
- **`docs/dashboard.md`** mit fertigen Lovelace-YAML-Karten:
  KPI-Reihe (Glance), Severity-Verteilung (Horizontal-Stack),
  Health-Gauge, Conditional-Error-Banner, History-Graph,
  Mini-Graph-Card-Beispiel.
- 5 neue Backend-Tests für die neuen Repo-Methoden und Sensor-Logik.

### Geändert

- **`README.md`** Sensor-Sektion in drei Tabellen aufgeteilt
  (All-time / Time-Windows / Status), Verweis auf `docs/dashboard.md`.

### Backend

- **`MessageRepository.count_by_severity(severity)`** — all-time-Count
  pro Severity (für die neuen Sensoren).
- **`MessageRepository.count_since(since_iso)`** — severity-übergreifender
  Count ab Cutoff.

## [0.7.1] – 2026-05-02

Patch-Release. Eine reine CI-Konfigurations-Aenderung, kein Code- oder
Feature-Update — die Integration verhaelt sich identisch zu 0.7.0.

### Geändert

- **`.github/workflows/sonar.yml`** ergaenzt — laeuft bei Push/PR auf
  main mit `SonarSource/sonarqube-scan-action@v4`. Sobald er einmal mit
  `SONAR_TOKEN` durchgelaufen ist, schaltet SonarCloud "Automatic
  Analysis" automatisch ab und liest stattdessen die `sonar-project.properties`
  aus dem Repo-Root. Damit greifen endlich die `frontend_dist`-Excludes,
  `sonar.python.version=3.12,3.13` und die Test-Pragmas — die bisher
  ~100 Bundle-Findings und die Python-Version-Warning verschwinden beim
  naechsten Scan.

## [0.7.0] – 2026-05-02

UX-/Branding-Release. Sub-Tabs in den Einstellungen lösen das
„KNX-Liste-blockiert-alles"-Scroll-Problem, das App-Icon gibt der
Integration eine erkennbare visuelle Identität, das Repo wurde von
historischen Iterations-Artefakten befreit.

### Hinzugefügt

- **Sub-Tabs in den Einstellungen**: Webhooks, KNX-Bus, Channels, MQTT,
  Heartbeats und Auto-Remediation liegen jetzt in eigenen Tabs statt
  alle untereinander.
  - Hintergrund: bei 3000+ KNX-Adressen war das endlose Scrollen
    zwischen den Sektionen unbrauchbar.
  - Tab-Auswahl wird in `localStorage` persistiert
    (`messagehub.settings.tab`).
  - Nur der aktive Tab ist im DOM — wenn du auf Webhooks bist, wird die
    `knx-addresses-view` mit ihren 3000 Einträgen gar nicht erst gerendert.
  - Mobile-Layout responsive (horizontale Scroll-Bar in der Tab-Leiste).
- **App-Icon** (`assets/icon.svg` + PNGs in 256/512/1024 px, plus
  `custom_components/messagehub/icon.png` für HACS): Inbox-Symbol mit
  drei Severity-Dots (rot/gelb/grün) auf HA-Blau-Tile. Erscheint in
  der HACS-UI, im Panel-Header (als Inline-SVG mit `--mh-accent`) und
  im GitHub-README.
- 6 neue jsdom-Tests für die Tab-Logik (Render-Order, Default,
  Click-Switch, localStorage-Persist, kaputter Wert).

### Entfernt

- **8 Iterations-Artefakte aus dem Repo-Root** gelöscht — sie stammten
  aus der initialen v0.1-Implementierungsphase und waren durch
  CHANGELOG / CLAUDE.md / README längst abgedeckt:
  `BACKLOG.md`, `BLOCKERS.md`, `CODE-REVIEW.md`, `FINAL-REPORT.md`,
  `ITERATION-AUDIT.md`, `ITERATIONS.md`, `STARTHERE.md`,
  `claude-code-runbook.md`.

### Geändert

- **`CLAUDE.md`** mit konkreten Inline-Quality-Gates statt Verweis auf
  den gelöschten Runbook: TDD-Pflicht, Cognitive-Complexity-Limit ≤ 15,
  Build-/Release-Workflow, Frontend-Position-Fixed-Pattern.
- **`DEVELOPMENT.md`** Setup-Anleitung von der initialen
  Iter-1-Mission auf den aktuellen User-Workflow umgestellt.
- **README** „Konfiguration"-Sektion ergänzt um Hinweis, dass die
  Konfigs in Sub-Tabs liegen und die Tab-Auswahl persistiert wird.
- **Panel-Header** zeigt das App-Icon jetzt als Inline-SVG (statt
  📨-Emoji). HA-Theme-Variable `--mh-accent` als Tile-Hintergrund
  passt sich Light/Dark automatisch an.

### Tests

- **+6 neue Frontend-Tests** in `tests/settings-tabs.test.ts`.
- **Stand:** 46 Frontend-Tests grün (9 Test-Dateien), 242 Backend-Tests
  grün.

### Doku

- **`README.md`**: Konfigurations-Hinweis auf Sub-Tabs, Icon-Vorschau
  rechts oben, Verweis auf gelöschten Runbook entfernt.
- **`info.md`** (HACS-Beschreibung) mit Icon-Vorschau ergänzt.

## [0.6.0] – 2026-05-02

Quality-/Architektur-Release. Kein neues UI-Feature — dafür breite
Code-Hygiene-Iteration: Sonar-Sweep, Cognitive-Complexity-Refactors
und ein neuer REST-Endpoint für gezielte MTTR-Abfragen.

### Hinzugefügt

- **App-Icon** (`assets/icon.svg` + PNGs in 256/512/1024 px, plus
  `custom_components/messagehub/icon.png` für HACS): Inbox-Symbol mit
  drei Severity-Dots (rot/gelb/grün) auf HA-Blau-Tile. Erscheint in
  der HACS-UI, im Panel-Header (als Inline-SVG mit `--mh-accent`) und
  im GitHub-README.
- **REST-Endpoint** `GET /api/messagehub/mttr?days=N` (default 30, max 365)
  liefert Mean-Time-To-Resolution pro Source als eigener Endpoint.
  Frontends/Skripte können MTTR jetzt abfragen, ohne den ganzen
  `stats-extended`-Block zu laden.
- **HACS-Polish**: `info.md` (HACS-Beschreibung) und
  `strings.json`-Translations für den Config-Flow.
- **`processing/knx_discovery.py`**: KNX-Discovery-Logik aus dem
  HTTP-Layer in den Business-Logic-Layer extrahiert. Pure Funktionen
  ohne aiohttp-Abhängigkeit, damit unit-testbar.

### Geändert (Refactor)

- **api/knx.py** schrumpft von 292 LOC auf 130 LOC — alle Discovery-
  Helfer in `processing/knx_discovery.py` ausgelagert.
- **api/_helpers.py**: gemeinsame View-Basis (`RequireAdminView`,
  Error-Konstanten, Audit-Helper) für alle API-Module.
- **`__init__.py`** drei high-Cognitive-Complexity-Funktionen zerlegt:
  - `_async_register_remediation_listener` (22 → unter 15) durch
    `_RemediationHookCache` und `_execute_remediation_hook`.
  - `_async_register_knx_listener` (19 → unter 15) durch
    `_log_knx_event` und `_build_knx_message`.
  - `_async_register_periodic_jobs` (24 → unter 15) durch vier
    benannte Helfer (`_run_heartbeat_tick`, `_handle_silent_heartbeat`,
    `_run_anomaly_tick`, `_handle_anomaly_row`).
- **`KnxAddress.to_dict()`** ist jetzt single source of truth für
  JSON-Serialisierung — kein duplizierter Code mehr in den Views.
- **`processing/knx_dpt.py`**: Magic-Numbers durch benannte Konstanten
  ersetzt (DPT-IDs, Boolean-Bitmask, Datum-Offsets).
- **`api/_parse_int_param`**: gemeinsamer Helfer für Query-Parameter-
  Parsing mit Range-Validierung und Logging bei Silent-Fallback.
- **Bash-Skripte** unter `scripts/`: 35× `[ ... ]` → `[[ ... ]]` (Sonar
  S6294); compound `[ A ] && [ B ]` zu `[[ A && B ]]` zusammengezogen.

### Behoben

- **Frontend-Bug** in `messagehub-panel.ts:_bulkDelete`: redundante
  Ternary `scope === "all" ? this._total : this._total` (beide Zweige
  gaben dasselbe). Confirm-Label spricht jetzt korrekt von „bis zu N"
  bei gefiltertem Scope.
- **TypeScript-Build-Bug** in `tests/knx-filter.test.ts`: `Promise<boolean>`
  vs. `Promise<void>`-Mismatch durch korrektes async/await behoben.
- **`String.replace(/regex/g, ...)`** an 6 Stellen auf `replaceAll(...)`
  umgestellt (`webhook-form.ts`, `detail-pane.ts`).
- **`Array(24).fill(0)`** in `stats-view.ts` durch
  `Array.from({length:24}, () => 0)` ersetzt (Sonar S6479).
- **3 echte async-ohne-await-Findings**:
  - `_fire_added_async`-Wrapper entfernt (war redundant um sync
    `_fire_added`).
  - `_async_register_services` zu `_register_services` umbenannt
    (sync), `await` beim Aufrufer entfernt.
  - HA-Plattform-Hooks (`async_setup_entry` in `binary_sensor.py` und
    `sensor.py`) mit `// NOSONAR` markiert — Signatur durch HA-API
    erzwungen, kein await möglich.
- **`telegram_handler`** (Channel-Forwarder-Polymorphismus mit
  pushover/ntfy/notify) ebenfalls mit `// NOSONAR` annotiert.
- **`Math.random()` im Test-Message-Picker** mit `// NOSONAR S2245` und
  Begründung markiert (nicht-kryptographisch, nur Demo-Variation).
- **`api/messages.py`**: 6 Error-String-Konstanten am Modul-Anfang
  ersetzen ~70 duplizierte Literale (`"not initialised"` 30×, `"not
  found"` 14×, `"invalid id"` 9× etc. — Sonar S1192).
- **`mypy --strict`** wieder grün: `KnxAddress.to_dict()`-Typ und mehrere
  `no-any-return`-Issues korrigiert.

### Sicherheit

- **Sonar-Pragmas** für legitime Use-Cases dokumentiert: hardcoded IPs
  in Tests (S1313 — Tests prüfen IP-Erkennung), `Math.random` in
  UI-Demo (S2245 — keine Krypto), HA-Plattform-Hooks (HA-API erzwingt
  async-Signatur).
- **`sonar-project.properties`** erweitert um pytest-asyncio-False-
  Positives (S7488 / S6822 für `tests/**/*.py`).

### Tests

- **+25 neue Unit-Tests** in `tests/unit/test_knx_discovery.py` für die
  acht extrahierten Helfer (find_knx_state, find_project,
  find_raw_groups, extract_items_from_groups, extract_group_address_entry,
  extract_dpt, ga_sort_key, discover_knx_project mit allen 4
  Fallback-Stati).
- **+1 neuer Frontend-Regression-Test** für den „nur aktive"-Filter in
  der KNX-Adressliste.
- **+aiohttp-Mock-Suite** für `notifications/native_adapters.py` —
  Telegram, Pushover, ntfy ohne echte Netz-Calls testbar.
- **Stand:** 242 Backend-Tests grün, 80 Frontend-Tests grün.

### Doku

- **README** um „SonarCloud-Setup" für Maintainer ergänzt — erklärt,
  warum Properties evtl. nicht greifen (Automatic vs. CI-based Analysis)
  und wie man umstellt.
- **`docs/configuration.md`** REST-API-Tabelle um den neuen `mttr`-
  Endpoint ergänzt.
- **Release-Workflow** mit `softprops/action-gh-release@v2`-Job zum
  automatischen Anlegen des GitHub-Release aus dem CHANGELOG-Block
  beim nächsten v*-Tag.

## [0.5.0] – 2026-05-01

Großes UI-Redesign-Release. Das Panel zieht jetzt durchgängig
HA-Theme-Variablen, hat ein zentrales Design-Token-System und mehrere
neue Inline-Edit-Funktionen.

### Hinzugefügt

- **Design-Token-Foundation** (`src/styles/tokens.ts`): Spacing-/Radius-/Schatten-/
  Typo-Skala plus wiederverwendbare `mh-btn`, `mh-input`, `mh-card`, `mh-pill`-
  Klassen über HA-Theme-Variablen. Light- und Dark-Mode out-of-the-box.
- **Severity inline ändern in der Nachrichten-Liste**: Klick auf die Severity-Pille
  öffnet ein Inline-Popover mit den 4 Optionen (Error/Warn/Info/Debug). Optimistic
  Update mit Rollback bei API-Fehler. Backend-Endpoint
  `POST /api/messagehub/messages/{id}/severity` plus Audit-Eintrag
  `severity_change`.
- **Severity inline ändern in der KNX-Adressliste**: Gleiches Pattern, 5 Optionen
  inkl. `auto`. Defaultet `severity_on_true`/`severity_on_false` auf `warning`/`info`,
  wenn beim Wechsel auf `auto` noch leer.
- **Sichtbarer „✎ Bearbeiten"-Button** auf jeder Webhook-Card statt nur im
  Overflow-Menü versteckt.
- **mtime-Cache-Buster** (`?v=<mtime>`) auf der Panel-`module_url`. Browser
  laden nach jedem Frontend-Rebuild automatisch das neue Bundle, ohne dass
  Nutzer den Cache manuell leeren müssen.
- **Sonar-Konfiguration** (`sonar-project.properties`): schließt `frontend_dist/`
  und Build-Artefakte aus dem Scan, ignoriert `S1313` (hardcoded IP) gezielt
  in Tests.

### Geändert

- **Top-Header umgebaut**: knall-blauer HA-Header → ruhige neutrale Bar mit
  segmentierten Tabs in der Mitte. „Alle löschen" raus aus der Top-Nav, jetzt
  in einem Overflow-Menü unten.
- **Message-Table modernisiert**: Severity als farbige Pille mit Icon + Label
  statt nacktem Glyph; relative Zeit („vor 3 Min") mit absoluter Zeit als
  Tooltip; Source als Mono-Pille.
- **Stats-Dashboard**: Vier leere Bar-Zeilen ersetzt durch Stacked-Bar mit
  Grid-Legende; Heatmap mit `color-mix`-Skalierung und Hover-Scale; Top-Sources
  jetzt als Bar-Chart mit Rang.
- **Audit-Log**: Action-Pills semantisch farbig (create grün / update blau /
  delete rot / status orange); JSON-Details als expandierbare Section statt
  inline; Volltextsuche.
- **KNX-Tabelle**: OFF/ON-Button → echter UI-Switch; Edit/Löschen → Icon-Buttons
  mit Severity-Soft-Hover; sticky Header.
- **Webhook-Cards**: Status-Pille → Status-Dot mit Soft-Glow; URL als
  gestrichelter Container mit dediziertem Copy-Button; JSONPath-Mapping in
  `<details>`-Toggle.

### Behoben

- **Severity-Inline-Popover**: Race-Condition zwischen `document.click` und
  `stopPropagation` bei composed Click-Events behoben durch Backdrop-Overlay.
  Popover ist jetzt `position: fixed` mit zur Click-Zeit berechneten
  Koordinaten und Auto-Flip nach oben — wird vom Scroll-Container nicht mehr
  abgeschnitten.
- **Umlaute** überall in nutzersichtbaren Strings (Toasts, Confirms, Buttons,
  Empty-States), nicht mehr `ae`/`oe`/`ue`-Substitute.
- **3 echte Sonar-Findings** (async-Funktionen ohne await):
  `_fire_added_async`-Wrapper entfernt (war redundant), `_async_register_services`
  zu `_register_services` umbenannt, `binary_sensor.async_setup_entry` mit
  `# NOSONAR` annotiert (HA-Plattform-Hook, Signatur durch Framework erzwungen).
- **API-Error-Strings konsolidiert** in `api/messages.py`: 6 Konstanten am
  Modul-Anfang ersetzen ~70 duplizierte Literale wie `"not initialised"`
  (30×), `"not found"` (14×), `"invalid id"` (9×).

### Tests

- 36 Frontend-Tests grün (vorher 4): Design-Tokens, Time-Util, Severity-Filter,
  Audit-Categorize, Message-Table-Severity-Inline, KNX-Severity-Inline.
- 214 Backend-Tests grün, davon 3 neue für `set_severity()` und 3 neue für den
  Cache-Buster.

### Sicherheit

- `Math.random()` im Test-Message-Picker mit Pragma + Begründung markiert:
  nicht-kryptographische Auswahl unter 4 Demo-Texten, kein Token, kein Auth.

## [0.4.x] – vorherige Iterationen

- KNX-DPT-Formatter (Date/Time/DateTime — DPT 10.x, 11.x, 19.x)
- KNX-Discovery aus dem HA-KNX-Projekt + Bulk-Import
- Test-Channel, MTTR/Time-Series, i18n, Audit-Log
- Robusterer Projekt-Lookup, sprechendere UI-Hinweise

## [0.3.0] – Frühere Releases

- FTS5-Volltextsuche, Korrelations-IDs, Health-Score, Tags
- Wochenreport per E-Mail, Auto-Remediation-Hooks
- Heartbeat-Tracking, Anomalie-Erkennung (EWMA)
- MQTT-, Eventbus- und Syslog-Eingänge

## [0.2.0]

- Notifications (Telegram/Pushover/ntfy) mit Quiet Hours und Throttling
- Status-Lifecycle new → acknowledged → resolved
- Deduplizierung mit Fingerprint-Aggregator

## [0.1.0]

- Webhooks mit JSONPath-Field-Mapping
- REST-API für Listen/Filter/Pagination/Stats
- Sidebar-Panel mit Severity/Source/Volltext-Filter und Live-Updates
- Counter-Sensoren, Service `messagehub.add_message`
- Retention pro Severity, täglicher Cleanup, wöchentliches VACUUM
