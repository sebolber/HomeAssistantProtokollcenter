# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.
Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionen folgen [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Hinzugefügt (Iter 63 — U13 Anti-Pattern-Badge in Top-Sender)
- **Anti-Pattern-Badge in Top-Sender-Tabelle** als gelbe „⚠ auffällig"-
  Pille neben der Severity-Pille, wenn für eine GA Konstant-Wert-Spam
  erkannt wurde (>= 5 identische Samples). Tooltip „Anti-Pattern
  erkannt — Detail-Pane zeigt mehr (z. B. Konstant-Wert-Spam, Read-
  Burst, Heartbeat)". Volle Findings-Liste bleibt im Detail-Pane via
  `detect_patterns`.
- **Pure Helper `has_anti_pattern_in_samples`** (Modul-export) mit 9
  Tests — Lightweight-Check ohne ts/typ, weil das Bulk-Sample-Lookup
  aus Iter 62 nur Werte liefert. Konstante `_LIGHTWEIGHT_CONSTANT_MIN
  = 5` (kleiner als `_CONSTANT_VALUE_MIN_SAMPLES = 10` im vollen
  Detector, weil hier nur 30 Samples vorliegen).
- **Service-Integration**: `compute_top` ruft den Lightweight-Check für
  alle Top-GAs auf und befüllt `TopRow.has_findings`. Nutzt dasselbe
  Bulk-Sample-Lookup wie WR-T DPT-Inferenz — kein zusätzlicher Query.
  1 neuer Backend-Test.

### Hinzugefügt (Iter 62 — WR-T DPT-Auto-Erkennung)
- **DPT-Auto-Erkennung im Top-Sender** für GAs ohne ETS-DPT. Heuristik
  konservativ: `1.001` (Schalten) bei reinen 0/1-Werten, `5.001`
  (8-bit unsigned) bei Integer 0–255 ohne reinen 0/1-Anteil, `9.x`
  (2-byte Float, generisch) bei nicht-integer Floats. Unentscheidbare
  Mischungen bleiben `null`. Pure Helper `infer_dpt_from_samples` mit
  13 Tests, plus Integration in `compute_top` mit Bulk-Lookup
  `bulk_values_for_dpt_infer` (max 200 GAs, 30 Werte pro GA — verhindert
  N+1).
- **TopRow + DTO** bekommen `dpt_inferred: bool`. Frontend rendert
  inferierte DPTs italic + dotted underline + „?"-Suffix mit Tooltip
  „DPT geraten aus Werten (im ETS-Projekt nicht gepflegt)".
- **`recommended_rate_for("9.x")` mappt auf 9.001-Soll** (2,0 Tel/Min) —
  alle 9.x-Subtypen liegen im selben Bereich, daher unkritisch.

### Hinzugefügt / Geändert (Iter 61 — UX-Quick-Wins Frontend-Logik)
- **U3 Verwaiste-GAs-Card mit Suche + Pagination** — vorher hartes Cap
  auf 15 Einträge mit „und N weitere" (bei 3000+ GAs unhandlich). Jetzt
  pro Sektion (Missing-in-Log / Extra-in-Log) ein Such-Input
  (case-insensitive auf address/label/dpt) plus „Mehr laden" (+50)
  und „Alle X zeigen" (Escape-Hatch). Filter-Änderung resettet die
  Page-Größe auf 50.
- **U9 Severity-Filter-Pills** mit klarer Aktiv/Inaktiv-Differenzierung —
  vorher unterschieden sich Active und Inactive nur durch Hintergrund-
  farbe; bei farbigen Severity-Dots wirkten alle Chips „aktiv". Jetzt:
  inactive = Outline-Style mit gestrichelter Border + opacity 0.6 +
  gedämpfter Dot; active = Filled-Style mit Hintergrund + farbiger
  Border + voller Dot + semibold. 1 neuer Frontend-Test.
- **U15 GroupValueRead-Telegramme ausblenden** — Toggle in der Filter-
  Bar des Nachrichten-Tabs (Default off). Adressiert HA-KNX-Polling-Spam,
  ohne dass der User die Loggen-Konfig pro GA ändern muss. Backend-
  Filter `hide_knx_read=1` im List-Endpoint und im
  `MessageRepository.list_filtered`/`count_filtered` (`text NOT LIKE
  '%(GroupValueRead)%'`). Pure Helper `isKnxReadMessage` (export) für
  den Live-Update-Pfad. State persistiert im LocalStorage der Filter.
  5 neue Frontend-Tests + 1 neuer Backend-Test.
- **B5 (B4-Nachzug)**: „Realitaet" → „Realität" in der Verwaiste-GAs-
  Card.

### Hinzugefügt / Geändert (Iter 60 — UX-Quick-Wins Visual)
- **U6 Inline-Top-N-Selektor mit Label „zeige" + mehr Padding** —
  Selektor war vorher leicht zu übersehen (2 px Padding, kein Label).
  Neue Wrap-Span mit muted „zeige"-Label und 4×10 px Button-Padding.
- **U10 Helper-Text bei Top-Sender-Card** — analog zu Top-Geräte
  („Welche GA sendet am häufigsten? · X sichtbar"); Konsistenz beider
  Cards.
- **U11 Hersteller/Modell-Truncation mit Tooltip** — `device-cell__text`
  als inline-block mit `overflow:hidden`, voller Text via `title`-Attribut
  als Hover-Tooltip. Vorher hartes „…" ohne Sicht auf den vollen Wert.
- **U12 Reload-Icon-Buttons sichtbarer** — `mh-btn--icon` jetzt mit
  dezenter Border (divider) statt komplett transparent. Hover hebt zur
  fg-muted-Border. Top-Bar-Reload bekommt sichtbares Affordance.
- **U2 KNX-Stats Aktualisieren-Button als primary** — war Ghost-Button,
  jetzt `mh-btn--primary mh-btn--sm` mit Tooltip „Alle Cards neu vom
  Backend laden". Zentrale Re-Fetch-Aktion klar erkennbar.
- **U4 Acknowledge-Pille als dezente Status-Pille** — vorher reiner
  muted Text mit `✓ bekannt`. Jetzt success-soft Hintergrund, success-
  Foreground, semibold — klar als positiver Status, nicht als Werbung.
- **U5 Top-Sender-Tabelle sortierbar** (analog Iter 57 Top-Geräte) —
  GA, Label, Tel/Min, Soll, Status (Severity-Rang). Pure Helper
  `sortTopSender` mit `TopSenderSortKey`-Type, modul-level export. 9
  neue Tests in `tests/top-sender-sort.test.ts`. Default: rate_per_min
  desc (= heutiges Backend-Order). String-Spalten asc, numerische und
  Severity desc als Default-Direction. Leere Labels werden bei Label-
  Sort ans Ende sortiert.
- **U7 Buslast-KPI mit 0–100 %-Verlaufs-Bar** — vorher nur 4-stufige
  Border-Sprünge an Schwellen 10/20/30 %. Jetzt zusätzlich Mini-Bar
  unter dem Wert mit linear-gradient grün→gelb→orange→rot über die
  volle 0–100-Skala, vertikaler Marker an aktueller Position.
  ARIA-`role="meter"` mit min/max/now für Screenreader.
- **U8 Severity-Spalte bei inaktiven KNX-GAs** — vorher nur „—". Jetzt
  Default-Severity (`warning`) als gestrichelte muted Pille mit Tooltip
  „Severity beim Aktivieren". User sieht direkt, was beim Aktivieren
  greift.

- **B2 Nachzug**: severity-counts-Badges in der KPI-Card und
  `.busload--elevated` / `.health-score--yellow` nutzten weiter
  `mh-pill--info` (blau) statt `mh-pill--caution` (gelb). Jetzt durch
  zentralen `severityPillClass`-Helper konsistent.
- **B4 Nachzug**: „Ø ueber Zeitraum" → „Ø über Zeitraum" im
  Buslast-KPI-Hint.

### Behoben (Iter 59 — Bug-Sammel B1–B4)
- **B1 Audit-Detail-Summary zeigte `{deleted_count}` wörtlich.** Der
  Renderer `_renderDetailsSummary` listete bei jedem Detail-Objekt nur
  die Schlüssel als `{key}` auf — beim Audit-Clear-Eintrag mit genau
  einem `deleted_count`-Feld sah das wie ein nicht ersetztes Template
  aus. Pure Helper `formatDetailsSummary` (export, unit-getestet) zeigt
  bei einem einzelnen primitiven Wert jetzt `key: value`, kürzt sehr
  lange Werte auf 60 Zeichen mit Ellipsis. 7 neue Tests in
  `tests/audit-summary.test.ts`.
- **B2 Status-Pille „● OK" wurde grau statt grün gerendert.** In
  `stats-knx-view.ts:_severityPillClass` mappte `green → mh-pill--neutral`
  (grau) und `yellow → mh-pill--info` (blau!) — verkehrte die Ampel-
  Logik aus Konzept §3.1 in zusammenhanglose Farben. Neue
  `mh-pill--caution`-Klasse (gelb) in `tokens.ts`, Mapping korrigiert
  zu `green→success`, `yellow→caution`, `orange→warning`, `red→error`.
  Pure Helper `severityPillClass` als Modul-Level-Export. 4 neue Tests
  in `tests/severity-pill.test.ts`.
- **B3 Tagesverlauf-Chart blieb leer trotz Daten.** Die Polylines
  hatten `stroke-width="1.5"` ohne `vector-effect`, sodass bei
  `viewBox 600x120` + `preserveAspectRatio="none"` die Stroke-Breite
  bei breitem Container fast unsichtbar verzerrt wurde. Fix:
  `vector-effect="non-scaling-stroke"` + `stroke-width="2"` (Linien)
  + `r="2"` (Marker). Zusätzlich expliziter Hinweis „Keine Telegramme
  im Zeitraum" wenn alle Series nur Null-Werte haben (statt leerem
  SVG). 2 neue Tests in `tests/knx-timeline-chart.test.ts`.
- **B4 Umlaut-Drift in mehreren UI-Components.** Nach Iter 0.5.0
  („Umlaute überall in nutzersichtbaren Strings") sind in späteren
  Iterationen wieder ASCII-Substitute eingezogen. Korrigiert in
  `audit-view.ts` (Confirm-Dialog, Alert, Button-Title), `stats-knx-
  view.ts` (Health-/Severity-Labels, Top-Geräte-Card, Bursts-Card,
  Detail-Pane, Bulk-Ack-Prompt), `knx-addresses-view.ts` (Sync-Confirm,
  Toast-Texte, ETS-Sync-Button-Title), `simple-list-view.ts`
  (Heartbeat-Hint). Strings wie „Geraete", „loeschen", „auffaellig",
  „leicht erhoeht", „fuer", „oeffnen" sind jetzt wieder „Geräte",
  „löschen", „auffällig", „leicht erhöht", „für", „öffnen".

- **KNX-Statistik-Bereiche Burst-Detector, Buslast-KPI, Bus-Health-Score
  und Sicherheits-Audit lieferten 404.** Die zugehörigen View-Klassen
  (`KnxStatsBurstsView`, `KnxStatsBusloadView`, `KnxStatsHealthScoreView`,
  `KnxStatsSensitiveLogView`, `KnxStatsSensitiveSetView`,
  `KnxStatsLongTermView`, `KnxStatsBusAnalysisStateView`) waren in
  `api/messages.async_register_views` nicht im Registrierungs-Tuple
  enthalten und wurden daher beim Setup nie beim HA-HTTP-Layer
  registriert. Regressionstest (`test_api_view_registration.py`)
  spiegelt jetzt jede in `api/knx_stats.py` definierte `KnxStats*View`
  gegen das Registrierungs-Tuple.

## [0.12.0] – 2026-05-02

Großer KNX-Stats-Release mit 49 Iterationen seit 0.10.2. Komplett
neuer Sub-Tab „KNX-Bus-Analyse", bus-weite Erfassung,
Empfehlungs-Engine, Web-Recherche-getriebene KPIs, intelligenter
ETS-Abgleich und konfigurierbare Bus-Analyse.

### Hinzugefügt – KNX-Bus-Analyse-Tab (Iter 1-34)
- **KNX-Bus-Analyse-Tab unter Statistik:** Neuer Sub-Tab mit
  Empfehlungs-Engine, der überaktive Gruppenadressen identifiziert und
  konkrete ETS-Anpassungs-Empfehlungen liefert. Konzept siehe
  `docs/messagehub_knx_statistik.md`.
- DPT-Wissensbasis (`KNX_RECOMMENDED_RATES_PER_MIN`) mit 15+ Geräteklassen
  und 4-stufiger Ampel-Klassifizierung (grün/gelb/orange/rot).
- Anti-Pattern-Detector: Konstant-Wert-Spam, Read-Burst, Mehrfach-Response,
  Heartbeat-Spam — alle aus realem User-Log validiert.
- **Bus-weite Erfassung (Iter 20-27):** Alle KNX-Telegramme aus dem
  Gruppenmonitor werden in `knx_raw_telegrams` (48 h Retention) und
  `knx_telegram_counters` (365 Tage) erfasst — unabhängig von der
  Whitelist. Cleanup-Job alle 6 h, Hard-Cap 5 Mio Raw-Zeilen.
- **Idempotenter `customElement`-Decorator (Iter 28):** Behebt
  Safari-Hot-Reload-Crash „name has already been used".
- **Erweiterter Detail-Pane (Iter 29-31):** Source-Adresse, Liste der
  Sibling-GAs (alle GAs des selben Geräts, klickbar), SVG-Sparkline
  mit Wertverlauf (Hysterese-Hinweis bei engen Δ-Werten).
- **Top-Geräte-Tabelle (Iter 32):** Neue Sektion „Welches Gerät erzeugt
  am meisten Last?", aggregiert nach Source-Adresse mit Anteils-Anzeige.
- **Bulk-Acknowledge per Geräte-Quelle (Iter 33):** Knopf in der
  Geräte-Tabelle markiert alle GAs eines Geräts in einem Schritt als
  bekannt (Hard-Cap 100 GAs, Audit-Log).
- **Hersteller-Erkennung + Doku-Hinweise (Iter 34):** Source-Adressen
  werden gegen das ETS-Projekt aufgelöst (Hörmann, MDT, Hager, Gira,
  ABB, Theben, Busch-Jaeger, Zennio, Elsner). Detail-Pane zeigt
  Hersteller-spezifische Tipps + Link zur Hersteller-Doku.

### Hinzugefügt – Web-Recherche-Top-5 (Iter 36-42)
- **Buslast-%-KPI (Iter 36, Feature A):** ETS-konformes Modell mit
  10 s/60 s/5 min/10 min Bucketing je nach Periode. Anzeige von
  current / max / Ø-Buslast in der Übersicht-Card.
  Endpoint `GET /knx-stats/busload?bucket_seconds=`.
- **Bus-Health-Score 0–100 (Iter 37, Feature K):** Single-Glance-KPI
  über alle vorhandenen Indikatoren (Wiederhol-Quote, Buslast-Spitze,
  stumme Geräte, offene Alarme). Vier Komponenten gewichtet zu einer
  Gesamtzahl, mit Findings-Liste pro Befund. Ampel green/yellow/orange/
  red an den Schwellen 90/70/50.
  Endpoint `GET /knx-stats/health-score`.
- **Long-Term-Sicht aus Counter-Tabelle (Iter 38-39, Feature B+J):**
  Neue Period-Presets 7 d / 30 d / 365 d aktivieren den degradierten
  Modus — Counter-Tabelle liefert Total + Top-GAs + bucketierte Series
  (hour/day automatisch). Banner erklärt Einschränkungen (keine Source,
  keine Werte). `parse_iso_period` unterstützt jetzt `max_days`
  (Counter-Retention 365 d). Endpoint `GET /knx-stats/long-term`.
- **Burst-Detector (Iter 40-41, Feature C):** Erkennt kurze
  Telegrammfluten („10 Rolladen gleichzeitig"), die im Period-Avg
  untergehen. Sliding-Window-basiert, mit GA- und Source-Count zur
  Diagnose („ein Gerät flutet" vs. „ein Trigger feuert viele Geräte").
  Endpoint `GET /knx-stats/bursts?window_seconds=&threshold_pct=`.
- **Sicherheits-Audit-Log (Iter 42, Feature N):** Admins markieren
  GAs als sicherheitsrelevant (Türschloss, Alarmanlage, Tor) per
  `is_sensitive`-Flag. Card listet markierte GAs + Telegramme mit
  Zeit/Geräte/Wert. Migration 0020.
  Endpoints `GET /knx-stats/sensitive-log`, `POST/DELETE /knx-stats/sensitive/{ga}`.

### Hinzugefügt – User-Feedback-Items (Iter 44-49)
- **Audit-Log löschbar (Iter 44, N5):** Danger-Button in der Audit-Log-
  Card mit Bestätigungsdialog. Backend legt nach dem Clear einen
  `audit_clear`-Eintrag an, damit der Vorgang in den verbleibenden
  Logs nachvollziehbar bleibt. Endpoint `DELETE /api/messagehub/audit`.
- **Top-N pro Card konfigurierbar (Iter 45, N6):** Top-Sender und
  Top-Geräte haben jetzt eigene Inline-Selektoren (10/25/50/100) im
  Card-Header. Werte werden im localStorage persistiert.
- **Intelligenter ETS-Projektdatei-Abgleich (Iter 46-47, N4):** Neuer
  Sync-Endpoint mit vier Buckets: `add` / `keep` / `update` / `delete`.
  - **KEEP:** identische Einträge bleiben mit User-Config (log_enabled,
    log_severity) komplett erhalten.
  - **UPDATE:** label/dpt-Änderungen übernehmen ETS-Felder, setzen
    User-Config bewusst zurück (Semantik der GA hat sich geändert).
  - **DELETE:** in ETS nicht mehr vorhandene GAs werden entfernt
    (inkl. Lausch-Konfig).
  Frontend-Vorschau-Dialog zeigt Counts vor dem Anwenden. Endpoint
  `POST /knx-addresses/sync` mit body `{items, apply}`.
- **Bus-Analyse ein-/ausschaltbar (Iter 48-49, N1):** Toggle in der
  Filter-Bar des Stats-Tabs deaktiviert die bus-weite Telegramm-
  Erfassung — ressourcen-sparend, ohne HA-Restart. Banner über dem
  Tab erinnert an den deaktivierten Zustand. Migration 0021
  (`messagehub_settings`-Key/Value-Tabelle). Endpoint
  `GET/PUT /knx-stats/bus-analysis-state`.

### Geändert
- **Default-Severity beim GA-Logging-Aktivieren = `warning` (Iter 44,
  N2):** Statt vorher `info`. Drei Stellen aktualisiert: Frontend
  `_add` + `_import`, Backend-API-Default. Bestehende Einträge bleiben
  unverändert.
- **Settings-Tab-Leiste ohne Icons (Iter 44, N3):** Reine Text-Buttons
  in der Tableiste (Webhooks/KNX-Bus/Channels/MQTT/Heartbeats/
  Auto-Remediation).
- **Buslast-Konstanten zentral in `const.py`** (`KNX_TP_BAUDRATE_BPS`,
  `KNX_AVG_TELEGRAM_BITS = 200`): Vereint alte Schätzung (22 Byte) mit
  ETS-konformem Modell (200 Bit/Telegramm inkl. Inter-Frame-Pause).
- HTTP-API unter `/api/messagehub/knx-stats/`: summary, top, top-by-source,
  ga/{ga} (Detail mit Empfehlung + Findings), timeline, acknowledge,
  busload, health-score, long-term, bursts, sensitive-log,
  bus-analysis-state.
- Frontend-Sub-Tabs „Live-Status" (= bisheriger Inhalt) + „KNX-Bus-Analyse"
  (neu) mit Filter-Bar, KPIs, Top-Tabelle, Detail-Pane, SVG-Sparkline-
  Timeline, Health-Score-Card, Long-Term-Card, Bursts-Card,
  Sensitive-Log-Card.
- Acknowledgement-Mechanismus mit konfigurierbarem Auto-Ablauf
  (Default 90 Tage, sticky möglich).
- Neue DB-Tabellen / Schema-Änderungen:
  `knx_ga_acknowledgements`, `knx_telegram_counters`,
  `knx_raw_telegrams` (Iter 20), `is_sensitive`-Spalte in
  `knx_group_addresses` (Iter 42, Migration 0020),
  `messagehub_settings` (Iter 48, Migration 0021),
  partieller Index `idx_messages_knx_bus_timestamp`.

### Sicherheit
- Alle neuen KNX-Stats-Endpoints sind Admin-only (`RequireAdminView`).
- Period-Validierung mit Hard-Cap MAX_PERIOD_DAYS=90 (DoS-Schutz),
  Long-Term-Endpoint hebt explizit auf 365 d (Counter-Retention).
- GA-Format-Validierung per Regex (`validate_knx_ga`,
  `validate_knx_individual_address`).
- Hard-Limits: `top<=500`, `timeline-gas<=20`, `bucket<=60min`,
  `bulk-ack<=100`, `sensitive-telegrams<=1000`, `sync-items<=10000`,
  `note-length<=1000`.
- Audit-Log für alle Mutationen (Acknowledge/Unacknowledge, Bulk-Ack,
  ETS-Sync, Sensitive-Set, Bus-Analyse-Toggle, Audit-Clear selbst).
- Knowledge-Base hartcodiert in `const.py`, kein Internet-Zugriff zur
  Laufzeit, kein Eval. HTTPS-Doku-Links mit `rel="noopener noreferrer"`.

### Tests
- Backend: 471 → 535 Unit-Tests (+64 neu für Buslast, Health-Score,
  Long-Term, Bursts, Sensitive-Log, ETS-Sync, Settings-Repo,
  Audit-Clear).
- Frontend: 68 → 75 Vitest-Tests (+7 neu für KPI-Cards, Banner,
  Toggles, Inline-Top-N).

## [0.10.2] – 2026-05-02

Kritischer Hotfix: KNX-Telegramme kamen nicht mehr in den Nachrichten an.

### Behoben

- **xknx-Callback war `async def`, xknx ruft aber sync auf.**
  xknx 3.15.0 erwartet einen Callback der Signatur
  `Callable[[Telegram], None]` und ruft ihn als
  `callback.callback(telegram)` ohne `await` auf. Unsere
  `async def _on_telegram(...)` lieferte nur eine Coroutine
  zurueck, die mit der Warnung
  `RuntimeWarning: coroutine '...' was never awaited`
  stillschweigend verworfen wurde — die Telegramme verschwanden,
  ohne dass im Log etwas von "Telegramm empfangen" stand.
- **Fix**: Sync-Wrapper `_on_telegram(telegram)` registriert,
  der intern `hass.async_create_task(_handle_telegram(telegram))`
  aufruft. Damit wird die echte Ingest-Coroutine sauber als
  Task im HA-Eventloop scheduled.
- **Regressionstest** (`test_knx_listener_sync_wrapper.py`):
  pruft per `inspect.iscoroutinefunction()` dass der bei xknx
  registrierte Callback NICHT async ist und dass er ein
  Telegramm via `async_create_task` an den Eventloop weiterreicht.

## [0.10.1] – 2026-05-02

Hotfix fuer Repair-Issue-Translations.

### Behoben

- **Repair-Issues zeigten den raw `translation_key`** statt der
  uebersetzten Texte. Ursache: in v0.10.0 lagen die `issues`-
  Eintraege nur in `strings.json`, nicht in `translations/<lang>.json`.
  HA holt zur Laufzeit aber aus den `translations/`-Dateien.
- **`issues`-Block in alle sechs Translation-Dateien** ergaenzt
  (de, en, es, fr, it, nl) — KNX-/MQTT-Repair-Issues haben jetzt
  ueberall lesbare Titel und Beschreibungen.

## [0.10.0] – 2026-05-02

Architektur-Review-Pass. Performance, Modularitaet, Security und
Code-Hygiene auf Production-Niveau gehoben — keine Verhaltens-
aenderung fuer User, aber substantieller Refactor unter der Haube.

### Performance & Hot-Path

- **KNX-Whitelist-Cache** (`processing/knx_cache.py`): TTL-basierter
  In-Memory-Cache eliminiert den DB-SELECT pro KNX-Telegramm. Bei
  KNX-Bursts (10+ Telegrammen/s) ist das spuerbar.
- **Sensor-Coalescing**: 500ms-Debounce vor jedem Sensor-Update
  bricht Schreibsturm-Kaskaden bei vielen gleichzeitig eintreffenden
  Nachrichten — ein Burst loest jetzt einen statt N HA-State-Writes aus.
- **Per-Fingerprint-Lock** (`storage/repositories.py`): statt eines
  globalen Repository-Locks wird nur das SELECT+UPDATE/INSERT-Race auf
  identischem Fingerprint serialisiert. Parallele Inserts auf
  unterschiedlichen Sources blockieren einander nicht mehr.

### Modularitaet

- **`__init__.py` von 858 auf 662 Zeilen reduziert.** Listener und
  periodische Jobs wandern in eigene Module:
  - `listeners/knx.py`, `listeners/mqtt.py`, `listeners/syslog.py`
  - `jobs/periodic.py` (Heartbeat + Anomaly-Tick)
  - `helpers.py` (zentrales `fire_message_added`)
- **`KnxTelegramData` als typed dataclass** (`@frozen, slots`):
  vereint xknx-Telegram-Hook und HA-Eventbus-`knx_event`-Daten in ein
  einheitliches Schema. `_build_knx_message` und `_ingest` arbeiten
  jetzt mit konkretem Typ statt `dict[str, Any]`.
- **`storage/queries.py`** zentralisiert die haeufigsten SQL-Templates
  fuer die `messages`-Tabelle. Davor stand der INSERT-Block wortwoertlich
  doppelt im Repository.

### Security

- **Syslog-Bind defaults auf `127.0.0.1`** statt `0.0.0.0`. Wer den
  Listener absichtlich aus dem LAN erreichbar machen will, setzt das
  jetzt explizit — und bekommt eine WARN-Logzeile als Bestaetigung.
- **JSONPath-Expression-Limit** (512 Zeichen) als Erste-Linie-Verteidigung
  gegen pathologische Compile-Bomben in der Webhook-CRUD-API.
- **Payload-Depth-Limit** (32 Ebenen): tiefer-verschachtelte Webhook-
  Payloads werden mit Platzhalter ersetzt, statt die jsonpath-Engine
  quadratisch zu belasten.
- **Repair-Issues** (`repair.py`): KNX-/MQTT-Listener melden fehlende
  Voraussetzungen jetzt aktiv ueber HA-Settings → Reparaturen, nicht
  nur als stille Log-Zeile.

### Code-Hygiene

- **PLC0415-Audit**: lazy `from datetime import ...` 5x dedupliziert
  (jetzt einmal am Modul-Top). Lokale Modul-Imports in Listenern und
  Jobs nach Modul-Top verschoben, wo keine zirkulaeren Abhaengigkeiten
  drohen. HA-spezifische Imports bleiben lazy mit dokumentierter
  Begruendung.
- **Severity-Enum konsolidiert** (`Severity.values()`, `Severity.is_valid()`,
  `Severity.rank()`, `Severity.rank_of()`): `_VALID_SEVERITIES`-Sets in
  `knx_repo` und `SEVERITY_RANK`-Tabelle in `forwarder.py` greifen jetzt
  auf das zentrale Enum zu.
- **`.gitattributes`**: das Vite-Output-Bundle
  (`frontend_dist/messagehub-panel.js`) wird in PRs als
  `linguist-generated` markiert und zaehlt nicht zur Sprach-Statistik.
  PR-Diffs sind nicht mehr von 5000 Zeilen Bundle-Diff zugewuchert.

### Hinzugefuegt

- 6 neue Tests fuer JSONPath-Validation (`test_field_mapping.py`)
- 5 neue Tests fuer Repair-Issue-Helper (`test_repair.py`)
- 6 neue Tests fuer Severity-Helper (`test_models.py::TestSeverityHelpers`)
- 2 neue strings.json-Eintraege (Issue-Translations fuer KNX/MQTT)

### Geaendert

- **335 Tests gruen** (vorher 309) — saemtliche Refactorings TDD-konform.

## [0.9.5] – 2026-05-02

KNX-Listener-Refactor. Beseitigt die laestige Doppelt-Konfiguration
zwischen messagehub-GA-Whitelist und HA-KNX `event:`-Liste.

### Geändert

- **KNX-Listener haengt direkt am xknx-Telegram-Stream** statt am
  HA-Eventbus `knx_event`. Die HA-KNX-Integration legt eine
  `xknx`-Instance in `hass.data["knx"]` ab, dort registrieren wir
  via `xknx.telegram_queue.register_telegram_received_cb()` einen
  Callback. Damit:
  - **Keine `event:`-Konfig in `configuration.yaml` mehr noetig** — die
    messagehub-GA-Whitelist ist single source of truth.
  - **Kein "event: \"*\"" mehr noetig** — du erfaesst exakt die GAs,
    die du im Panel auf "Loggen=ON" gestellt hast.
  - **Kein Performance-Spam** — alle anderen Telegramme werden im
    Adapter direkt verworfen, bevor sie zum HA-Eventbus durchschlagen.
- **Fallback** auf den alten `knx_event`-Listener, falls die xknx-
  Instance auf einer ungewohnten HA-Version nicht erreichbar ist.
  In dem Fall steht jetzt eine WARN-Zeile im Log mit Konfig-Hinweis.

### Hinzugefügt

- **`_telegram_to_knx_event_data()`**: Adapter zwischen xknx-Telegram-
  Objekten und dem knx_event-Schema, damit `_build_knx_message()`
  beide Quellen einheitlich verarbeitet.
- **`_get_xknx_instance()`**: Best-effort-Lookup der xknx-Instance
  aus `hass.data["knx"]` (KNXModule-Attribut oder dict-Form).
- **7 neue Unit-Tests** in `tests/unit/test_knx_telegram_adapter.py`
  (GroupValueWrite/Read/Response, raw-Value-Fallback, fehlende
  Payloads, unbekannte Payload-Typen).

## [0.9.4] – 2026-05-02

Setup-Stabilitaets-Patch.

### Behoben

- **`configuration_url`** in `build_device_info()` und
  `_ensure_device_registered()` korrigiert: war `f"/{DOMAIN}"` (relativer
  Pfad), manche HA-Versionen lehnen das mit ungueltiger URL ab und
  brechen das ganze Setup ab. Jetzt
  `f"homeassistant://navigate/{DOMAIN}"` — HA-internes Schema, das
  als Link auf das Sidebar-Panel interpretiert wird.
- **`_ensure_device_registered()`** mit `try/except` umschlossen: die
  Geraete-Registry-Eintragung ist Komfort, nicht kritisch. Sollte ein
  zukuenftiger HA-API-Bruch das Verhalten aendern, laeuft das Setup
  trotzdem weiter und nur die Geraete-Gruppe fehlt.

## [0.9.3] – 2026-05-02

HACS-Validation-Patch. Der 0.9.2-Release-Workflow scheiterte an drei
HACS-Validation-Schritten.

### Behoben

- **`hacs.json`**: ungültiger Country-Code `'EN'` entfernt (das war
  versehentlich Sprache statt Land), stattdessen ISO-Country-Codes
  `DE, AT, CH, GB, US, NL, FR, ES, IT`. Außerdem `iot_class`-Key
  entfernt — der gehört nur ins `manifest.json`, nicht ins `hacs.json`
  (HACS lehnt extra keys ab).
- **Brand-Icons** in `custom_components/messagehub/brand/`: HACS sucht
  Brand-Assets in genau diesem Pfad. Kopiert aus
  `assets/brands/messagehub/`: `icon.png`, `icon@2x.png`, `logo.png`,
  `logo@2x.png`. Damit greift HACS auf das mitgelieferte Icon zurück,
  ohne auf den brands-Repo-PR warten zu müssen.

### Hinweis: GitHub-Repository-Metadata

Zwei der ursprünglichen vier Fehler sind nicht code-fixbar — du musst
auf GitHub einmalig setzen:

- **Repository topics:** auf https://github.com/sebolber/HomeAssistantProtokollcenter
  → ⚙️ neben "About" → Topics hinzufügen, z. B. `home-assistant`,
  `hacs`, `home-assistant-custom-component`, `messagehub`,
  `notifications`, `knx`.
- **Repository description:** im selben "About"-Dialog die Beschreibung
  setzen, z. B. "Zentrale Sammelstelle für strukturierte Nachrichten
  in Home Assistant — Webhooks, MQTT, KNX, Syslog, Eventbus, Service".

## [0.9.2] – 2026-05-02

Hassfest-Patch. Der 0.9.1-Workflow scheiterte an einer neuen
Hassfest-Regel zur Manifest-Key-Sortierung.

### Behoben

- **`manifest.json`** Keys neu sortiert: erst `domain`, dann `name`,
  alle weiteren alphabetisch (`after_dependencies`, `codeowners`,
  `config_flow`, `dependencies`, `documentation`, `integration_type`,
  `iot_class`, `issue_tracker`, `requirements`, `version`). Hassfest-
  Regel `[MANIFEST] Manifest keys are not sorted correctly` ist erfüllt.

## [0.9.1] – 2026-05-02

Hassfest-Fix. Der 0.9.0-Release-Workflow scheiterte, weil `mqtt` als
Dependency nicht im Manifest stand:

```
[DEPENDENCIES] Using component mqtt but it's not in 'dependencies'
or 'after_dependencies'
```

### Behoben

- **`manifest.json`** ergänzt um `"after_dependencies": ["mqtt"]`.
  `after_dependencies` ist die richtige Wahl — wir nutzen MQTT nur
  konditional (`if "mqtt" not in hass.config.components: return`),
  also keine harte Abhängigkeit. Wenn HA-MQTT läuft, wird messagehub
  erst danach geladen.

## [0.9.0] – 2026-05-02

Konsolidierungs-Release. Bündelt alle Verbesserungen aus den 0.8.x-
Patch-Tags zu einem klar abgegrenzten Minor-Release und ergänzt die
Lovelace-Anbindung um die bisher fehlende „Geräte"-Eintrag in
*Settings → Geräte & Dienste*. Alles aus 0.8.0–0.8.3 ist hier
nochmal als Highlights zusammengefasst — die Detail-History für jeden
Patch findet sich in den Sub-Sektionen darunter.

### Highlights

- **🎛 Sub-Tabs in den Einstellungen** — Webhooks, KNX-Bus, Channels,
  MQTT, Heartbeats, Auto-Remediation als getrennte Tabs, persistierter
  Tab-Zustand. KNX-Liste mit ihren bis zu 3000 Adressen blockiert nicht
  mehr die anderen Sektionen.
- **📊 6 neue Lovelace-Sensoren** — Severity-Counts (Errors/Warnings/Info/
  Debug all-time) plus Time-Window-Counts (1 h / 7 d). Direkt in
  Glance-, Gauge- und History-Cards nutzbar.
- **🏷 „Zu Dashboard hinzufügen" funktioniert** — alle Entitäten sind
  unter einem **Gerät** gruppiert. Settings → Geräte & Dienste → Message
  Hub → Gerät listet alle 12 Entitäten und der HA-Standard-Knopf
  schiebt sie als Card-Stack in eine Lovelace-View, wie bei
  Forecast.Solar.
- **🎨 App-Icon + Brand-Assets** — Inbox mit drei Severity-Dots auf
  HA-Blau-Tile. PNGs in 256/512/1024 px für HACS, Panel-Header mit
  Inline-SVG. `assets/brands/messagehub/` als fertiges Asset-Set für
  einen [home-assistant/brands](https://github.com/home-assistant/brands)-PR
  (siehe `docs/brand-pr.md`).
- **⚡ Severity inline ändern** — Klick auf die Severity-Pille in der
  Nachrichtenliste oder KNX-Adressliste öffnet ein Inline-Popover; die
  Auswahl persistiert sofort, ohne den Detail-Dialog zu öffnen.
- **🛠 SonarCloud-CI vollständig** — eigener `sonar.yml`-Workflow mit
  SHA-pinned Actions (entspricht S7637), Properties-Excludes greifen
  zuverlässig (Bundle-Lärm weg), pytest-asyncio + Test-IPs als
  False-Positives unterdrückt.
- **📝 Komplette User-Doku** — `README.md`, `docs/configuration.md`,
  `docs/dashboard.md`, `docs/auto-update.md`, `docs/brand-pr.md`. Alle
  6 Eingangskanäle, 6 Lovelace-Sensoren, 4 Lovelace-Karten-Bausteine,
  3 Auto-Update-Varianten und der brands-PR-Workflow Schritt-für-Schritt.

### Bekannte Einschränkungen

- **Brand-Icon in HA-Settings-UI** zeigt weiterhin „icon not available"
  bis der PR an `home-assistant/brands` gemerged ist (Lead-Time
  1–3 Tage). HACS-UI und Panel-Header zeigen das Icon sofort.
- **`actions/cache@v4`** läuft auf Node 20, deprecated von GitHub.
  Wird intern von der Sonar-Action genutzt — wir können das nicht
  direkt fixen, Sonar-Maintainer muss das in einer kommenden Version
  aktualisieren. Workflow läuft aber bis September 2026 weiter.

---

## [0.8.3] – 2026-05-02

CI-Patch. Drei kleine Sonar-Workflow-Aufraeumungen, die im Run-Log
des erfolgreichen v0.8.2-Scans aufschlugen.

### Behoben

- **Security-Update für SonarQube-Scan-Action.**
  `SonarSource/sonarqube-scan-action@v4` → `@v6`. Sonar selbst meldete
  CVE in v4/v5 und empfiehlt v6.
- **PL/SQL-Falscherkennung auf Migrations-Files.**
  Sonar hat `custom_components/messagehub/storage/sql/0006_fts5.sql` als
  PL/SQL geparst und drei „Parse error"-Warnings erzeugt — die Datei
  ist aber SQLite-FTS5-Dialekt. Fix: `storage/sql/**` aus
  `sonar.exclusions` (SQL-Migrationen sind Daten-Definitionen, kein
  Review-Material).
- **Coverage-Reports referenzierten nicht-existente Pfade.**
  `sonar.python.coverage.reportPaths=coverage.xml` und
  `sonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info`
  zeigten auf Files, die der CI-Workflow nicht generiert →
  `WARN No report was found`. Auskommentiert mit Hinweis, wann
  aktivieren.

### Hinweis: Python-Version-Warning in der UI

Die Warning „compatible with all Python 3 versions by default" stammt
mit hoher Wahrscheinlichkeit aus einem Automatic-Analysis-Run **vor**
dem CI-Setup. Sobald in **SonarCloud → Project → Administration →
Analysis Method** „Automatic" deaktiviert und „GitHub Actions" allein
aktiv ist, verschwindet sie beim nächsten CI-Lauf. Der Properties-
Eintrag `sonar.python.version=3.12,3.13` greift gemäß Workflow-Log
ab v0.8.3 sauber.

## [0.8.2] – 2026-05-02

Patch-Release. Behebt zwei UI-Stolpersteine: Brand-Icon-Vorbereitung und
das fehlende Geräte-Grouping nach Update von 0.8.0 auf 0.8.1.

### Behoben

- **Geräte-Eintrag bei Update von ≤ 0.8.0:** existierende Entitäten
  hatten kein `device_info` und blieben nach dem Update auf 0.8.1
  weiter „geräte-los" — Settings → Geräte & Dienste zeigte „12 Entitäten"
  ohne Geräte-Gruppe.
  Fix: `_ensure_device_registered()` legt das Gerät beim Setup
  explizit im HA-Device-Registry an. Damit existiert es garantiert,
  und alle Entitäten werden beim nächsten Update-Tick mit dem Gerät
  verknüpft.

### Hinzugefügt

- **`assets/brands/messagehub/`** mit den vier vom
  [home-assistant/brands](https://github.com/home-assistant/brands)-Repo
  geforderten PNGs in exakter Größe:
  - `icon.png` (256 × 256), `icon@2x.png` (512 × 512)
  - `logo.png` (480 × 256), `logo@2x.png` (960 × 512)
- **`assets/logo.svg`** als Source — Icon links + Wortmarke „Message
  Hub" rechts.
- **`docs/brand-pr.md`** mit Schritt-für-Schritt-Anleitung für den PR
  an `home-assistant/brands` (Web-UI- und gh-CLI-Variante).

### Hinweis

Der Brand-Icon-Eintrag in `home-assistant/brands` ist ein **manueller
PR-Prozess** (Lead-Time 1–3 Tage Maintainer-Review). Solange das nicht
gemerged ist, zeigt HA-Core in *Settings → Geräte & Dienste* weiterhin
„icon not available". HACS-UI und Panel-Header zeigen das Icon aber
sofort, weil sie das Repo-`icon.png` bzw. das Frontend-Bundle nutzen.

## [0.8.1] – 2026-05-02

Patch-Release. Macht alle messagehub-Sensoren zu einem zusammenhängenden
**Gerät**, damit der HA-Standard-„Zu Dashboard hinzufügen"-Knopf in
*Settings → Geräte & Dienste → Message Hub* erscheint und alle Entitäten
mit einem Klick als Karten-Stack in eine Lovelace-View wirft (analog
zu Forecast.Solar, Sun, etc.).

### Hinzugefügt

- **`build_device_info(entry_id)`** in `const.py` — gemeinsame
  Device-Registry-Metadaten (manufacturer, model, configuration_url
  zeigt aufs Panel) als pure dict-Funktion, framework-frei testbar.
- 4 neue Tests in `tests/unit/test_device_info.py` (Identifier-Stabilität,
  Mehrfach-Installationen, Metadaten).

### Geändert

- **Alle 12 Entitäten** (`_BaseMessageSensor` + Binary-Sensor) setzen
  jetzt `_attr_device_info` mit `identifiers={(DOMAIN, entry_id)}` —
  HA gruppiert sie als **Message Hub**-Gerät unter
  *Settings → Geräte & Dienste*.
- **`docs/dashboard.md`** Schnellstart-Sektion ergänzt: Ein-Klick-Import
  via „Zu Dashboard hinzufügen" als bevorzugte Variante; manuelles YAML
  bleibt als Alternative.

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
