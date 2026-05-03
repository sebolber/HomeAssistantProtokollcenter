# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.
Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionen folgen [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Hinzugefuegt (KNX-Konfigurations-Findings, Phase 6)
- **Iter 29 — Markdown-Export (E15).**
  Neue reine Funktion `format_findings_markdown(findings)` in
  `processing/findings_markdown.py` rendert eine Tabellen-Markdown
  (Code | GA | Severity | Source | Last-Seen | Evidence). Pipes
  und Newlines werden HTML-entitaet-escaped, damit die Tabelle
  nicht zerbricht. API-Endpoint `GET /api/messagehub/findings/export.md`
  liefert `text/markdown` direkt zum Copy-Paste in die ETS-Notiz-
  Spalte. Frontend: Button "MD-Export" im Header kopiert via
  Clipboard API; Fallback Download als `findings.md`.
- **Iter 28 — Prometheus-Counter pro Finding-Code.**
  Neue Metrik `messagehub_knx_finding_total{code="...",severity="..."}`
  in `format_prometheus_metrics`. Erlaubt Alerting auf "heute kam ein
  neuer Finding-Typ dazu" oder "Anzahl error-Findings sprunghaft
  gestiegen". Reihenfolge im Output ist sortiert -> reproduzierbarer
  Scrape (Diff-frei).
- **Iter 27 — Severity-Override-UI.**
  Neue Lit-Komponente `severity-override-form.ts` rendert die Tabelle
  Code | Default | Override fuer alle bekannten Codes mit Inline-
  `<select>`. Wechsel auf einen Severity-Wert ruft
  `setSeverityOverride` auf, Wechsel auf "— Default —" ruft
  `clearSeverityOverride`. Eingebettet als ausklappbarer Bereich im
  Konfigurations-Check-Tab via "Severity-Defaults"-Button.

## [0.21.0] – 2026-05-03

KNX-Konfigurations-Findings — Phase 4 + 5 (Iter 20-26) aus
`docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.9.

Trend-Detektoren (RECONNECT_STORM, SEND_CYCLE_DRIFT,
REPEAT_APPROXIMATION) + Projekt-Integration (ORPHAN_GA, STALE_GA) +
"Nur Projekt-Befunde"-Filter im Konfigurations-Check-Tab.

Tests: 901 → 952 Backend (+51), 170 → 182 Vitest (+12).
Bundle: 382,79 KB → 387,18 KB.

### Hinzugefuegt (KNX-Konfigurations-Findings, Phase 5)
- **Iter 26 — i18n Phase 5 + Filter "Nur Projekt-Befunde".**
  Translations fuer ORPHAN_GA + STALE_GA in allen 6 Sprachen +
  `findings_view.filter_project_only`-Label. Frontend-Helper
  `isProjectRelated(code)` + `PROJECT_RELATED_CODES`-Set
  (DPT_MISMATCH, ORPHAN_GA, STALE_GA). Filter-Toggle in `findings-view`
  blendet Laufzeit-Findings aus; Total-Anzeige zeigt
  "gefiltert / total". Filter laeuft Frontend-only — keine
  Server-Round-Trip.
- **Iter 25 — Detector `STALE_GA`.**
  Erkennt: GA war frueher aktiv, ist seit >= `threshold_days` (Default
  30) tot. Severity `info`, Evidence `{last_seen, days_silent}`.
  Threshold ueberschreibbar pro Aufruf. days_silent als int gerundet.
- **Iter 24 — Detector `ORPHAN_GA`.**
  Erkennt Whitelist-Eintraege, die im Auswertezeitraum kein einziges
  Telegramm gesehen haben (`telegram_count == 0`) — "im Projekt, aber
  stumm". Severity `info`, Evidence `{period_from, period_to}`.
  Defensive: negative Counts (Repo-Datenfehler) liefern KEIN Finding.

### Hinzugefuegt (KNX-Konfigurations-Findings, Phase 4)
- **Iter 23 — i18n fuer Phase-4-Findings.**
  Title, Description (mit Evidence-Platzhaltern wie `{silence_until}`,
  `{burst_count}`, `{ratio}`, `{repeats_per_day}`) und Help-URL pro
  Code in allen sechs Sprachen (de/en/es/fr/it/nl) fuer
  RECONNECT_STORM, SEND_CYCLE_DRIFT, REPEAT_APPROXIMATION. Frontend-
  Helper ergaenzt um diese Codes; Tests erweitern parametrize um
  Phase-4-Codes.
- **Iter 22 — Detector `REPEAT_APPROXIMATION`.**
  Approximiert das Repeat-Bit, das wir ohne xknx-Layer-2-Zugriff nicht
  sehen koennen: identisches Telegramm mit Δt < 100 ms auf gleicher GA
  ist mit hoher Wahrscheinlichkeit eine Wiederholung. Schwellwert: >=5
  Repeats pro Tag (normalisiert auf `period_days`). Severity `warning`
  (Approximation, nicht Wahrheit). Evidence
  `{repeats_per_day, total_repeats, period_days}`.
- **Iter 21 — Detector `SEND_CYCLE_DRIFT`.**
  Trend-Detektor: Median(Δt) der letzten 24 h <= 50% des 7-Tage-
  Medians -> Finding (severity info). Reine Funktion; nutzt die in
  einer spaeteren Service-Iter zugespielten Pre-Aggregate aus der
  bestehenden Trend-Vergleich-Infra (Iter 67/WR-I). Evidence
  `{recent_median_dt, baseline_median_dt, ratio}`.
- **Iter 20 — Detector `RECONNECT_STORM`.**
  Erkennt: nach >=60 s Stille auf einer `knx_source` folgt ein Burst
  (>=10x normaler 30-s-Schnitt) — typisch fuer Reconnect-Floods nach
  Bus-Spannungsausfall. Severity `warning` (Symptom, kann normal sein
  nach Spannungsausfall). Evidence
  `{silence_until, burst_count, normal_avg, factor}`.

## [0.20.0] – 2026-05-03

KNX-Konfigurations-Findings — Phase 2 + 3 (Iter 11-19) aus
`docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.9.

DPT-Validierung (DPT_MISMATCH, VALUE_OUT_OF_RANGE) + die vier
Foren-Klassiker (MULTI_RESPONDER, READ_NO_RESPONSE, TOGGLE_LOOP,
MULTI_TIME_MASTER). Migration `0027_knx_dpt_inferred.sql` (Soll/Ist-
Trennung). DE/EN-Translations + Fallback-Strings fuer 4 weitere
Sprachen.

Tests: 801 → 901 Backend (+100), 155 → 170 Vitest (+15).
Bundle: 376,94 KB → 382,79 KB.

### Hinzugefuegt (KNX-Konfigurations-Findings, Phase 3)
- **Iter 19 — i18n fuer Phase-3-Findings.**
  Title, Description (mit Evidence-Platzhaltern wie `{count}`,
  `{read_at}`, `{period_ms}`, `{sources}`) und Help-URL pro Code in
  allen sechs Sprachen (de/en/es/fr/it/nl) fuer MULTI_RESPONDER,
  READ_NO_RESPONSE, TOGGLE_LOOP, MULTI_TIME_MASTER. Frontend-Helper
  ergaenzt um diese Codes; UI rendert Title statt Code, Detail-Pane
  zeigt Description + Help-URL.
- **Iter 18 — Detector `MULTI_TIME_MASTER`.**
  Erkennt: >=2 unterschiedliche `knx_source` schreiben auf eine
  Zeit-/Datums-GA (DPT 10.001 Time-of-day, 11.001 Date, 19.001
  DateTime). Severity `error` (Doppel-Zeitquellen erzeugen Drift,
  siehe §9.3). Evidence `{sources, clock_dpt}`.
- **Iter 17 — Detector `TOGGLE_LOOP`.**
  Erkennt DPT-1.001-Schaltschleifen: alternierende Werte 0/1 mit Δt
  < 2 s ueber mindestens 4 Wertwechsel. Severity `error` (Schleifen
  sind nahezu nie gewollt; sie kosten Bus-Zeit). Evidence
  `{period_ms, cycles}` — Periode = 2 × Median(Δt) (zwei Transitionen
  pro Zyklus).
- **Iter 16 — Detector `READ_NO_RESPONSE`.**
  Pro unbeantwortetem GroupValueRead ein Finding (severity warning).
  Timeout 3 s aus KNX-Spec (3-fache Wiederholung ohne ACK -> verworfen,
  siehe §3.1 F8). Evidence
  `{read_at, expected_until, timeout_sec}`.
- **Iter 15 — Detector `MULTI_RESPONDER`.**
  Erkennt >=2 unterschiedliche `knx_source` antworten innerhalb 1 s
  auf dieselbe GA. Severity `warning` (kann beabsichtigt sein bei
  parallelen Aktoren). Sliding-Window-Algorithmus O(n) ueber die
  Response-Liste. Evidence
  `{responding_sources: [...], count, window_ms}`.

### Hinzugefuegt (KNX-Konfigurations-Findings, Phase 2)
- **Iter 14 — i18n fuer Phase-2-Findings (DPT_MISMATCH, VALUE_OUT_OF_RANGE).**
  Title, Description (mit Evidence-Platzhaltern wie
  `{inferred_dpt}`/`{value}`) und Help-URL pro Code in allen sechs
  Sprachen (`translations/de.json`, `en.json`, `es.json`, `fr.json`,
  `it.json`, `nl.json`). Frontend-Helper
  `frontend/src/utils/findings-i18n.ts` (DE+EN explizit, andere
  Sprachen Fallback auf EN). `findings-view` rendert Title statt
  rohem Code, Detail-Pane zeigt Description + Help-URL-Link.
- **Iter 13 — Detector `VALUE_OUT_OF_RANGE` + Wertbereich-Tabelle.**
  Reine Funktion `detect_value_out_of_range(*, ga, dpt, value, now)`
  in `processing/findings/value_range.py`. `KNX_DPT_VALUE_RANGES` in
  `const.py` haelt die DPT-spezifischen Min/Max-Werte fuer 5.001
  (Prozent), 5.003 (Winkel), 5.004 (Counter Pulses), 9.001
  (Temperatur), 9.005 (Wind), 9.007 (Feuchte), 9.008 (CO2), 13.010
  + 13.013 (Energie int32). Severity `error`, Evidence
  `{value, dpt, range_min, range_max}`.
- **Iter 12 — Detector `DPT_MISMATCH`.**
  Reine Funktion `detect_dpt_mismatch(*, ga, project_dpt, inferred_dpt,
  confidence, samples, now)` in
  `processing/findings/dpt_mismatch.py`. Liefert ein Finding mit
  Severity `error` + Evidence
  `{project_dpt, inferred_dpt, confidence, samples}`, wenn
  Confidence >= 0.85 (Decision: 0.85 statt 0.80, weil 9.x mit < 50
  Samples haeufig False-Positives generiert). Whitelist:
  generischer 9.x-Inferenz-Treffer kollidiert nicht mit konkretem
  9.001/9.005/etc. im Projekt — der Auto-Erkenner kann den Subtyp
  ohne Sensor-Kontext nicht erraten.
- **Iter 11 — Migration `knx_group_addresses.dpt_inferred`.**
  Drei neue Spalten (`dpt_inferred`, `dpt_inferred_confidence`,
  `dpt_inferred_at`) trennen das Soll (`dpt`) vom Ist (Auto-
  Erkenner). Repo-Methoden `set_dpt_inferred(...)` / `get_dpt_inferred(...)`
  legen idempotent persistierte Inferenz-Ergebnisse an. Confidence
  ist auf [0.0, 1.0] validiert. Migration `0027_knx_dpt_inferred.sql`.

## [0.19.0] – 2026-05-03

KNX-Konfigurations-Findings — Phase 0 + 1 (Iter 1-10) aus
`docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.9.
Konfigurations-Check-Tab live mit Bestandsdetektoren (Bus-Health-
Score + 4 Anti-Pattern-Detektoren) ueber den neuen Finding-Vertrag.

Migrationen 0024 (knx_findings), 0025 (knx_finding_acknowledgements),
0026 (knx_finding_severity_overrides). 6 neue API-Endpoints
(`/api/messagehub/findings...`). Lit-Komponente `findings-view`.

Tests: 717 → 801 Backend (+84), 141 → 155 Vitest (+14).
Bundle: 363,59 KB → 376,94 KB (+13 KB).

### Hinzugefuegt (KNX-Konfigurations-Findings)
- **Iter 1 — `Finding`-Dataclass + `FindingSeverity`-Enum.**
  Neuer Vertrag fuer KNX-Konfigurations-Detektoren in
  `processing/findings.py`. `Finding` ist frozen+slotted mit Code,
  Schema-Version, Severity (debug/info/warning/error), GA, Source,
  Title, Description, Evidence-Dict, First-/Last-Seen, Occurrence-
  Count, Detector-Version. Stabiler JSON-Round-Trip via
  `to_json`/`from_json`. Vorbereitung fuer Iter 2-31 aus
  `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.9.
- **Iter 2 — `knx_findings`-Tabelle + `FindingsRepository`.**
  Append-only-Log mit Dedup-Schluessel
  `(code, ga, evidence_hash, schema_version)`: wiederholte Detector-
  Laeufe mit identischer Evidence aktualisieren `last_seen` +
  `occurrence_count`, statt neue Rows anzulegen. Migration
  `0024_knx_findings.sql`. Repo bietet `record(finding)` (Upsert) und
  `list_findings(code, ga, severity, source, limit)` mit
  `last_seen DESC`-Sortierung. title/description sind nicht
  persistiert (UI rendert via translations/).
- **Iter 10 — Frontend findings-view End-to-End mit Items + Ack-Flow.**
  Item-Rendering pro Finding (Severity-Pill, Code, GA, Source,
  Last-Seen, Occurrence-Count). Klick auf Item oeffnet Detail-Pane
  mit komplettem Evidence-Dict als KV-Liste. Ack-Button im Detail-
  Pane ruft `acknowledgeFinding` auf, laedt die Liste neu und
  schliesst den Pane. Bus-weite Findings (`ga = null`) sind
  read-only, weil das Repo (Iter 3) nur `(ga, code)`-Acks kennt —
  Ack-Button ist disabled. Bundle: 371,51 KB → 376,94 KB.
- **Iter 9 — Frontend `findings-view` als 3. Sub-Tab.**
  Neuer Konfigurations-Check-Tab im Statistik-Bereich (neben Live-
  Status + KNX-Bus-Analyse). Iter 9 rendert nur den leeren Container
  mit Severity-Filter, Total-Anzeige und Empty-State; Iter 10
  verdrahtet Items + Ack-Action. `ApiClient` bekommt
  `listFindings`, `acknowledgeFinding`, `unacknowledgeFinding`,
  `listSeverityOverrides`, `setSeverityOverride`,
  `clearSeverityOverride` plus Vertrags-Types (`FindingDto` etc.).
  Bundle: 363,59 KB → 371,51 KB.
- **Iter 8 — API CRUD fuer Severity-Overrides.**
  `GET /findings/severity-overrides` liefert Tabelle Code | Default |
  Override (alle bekannten Codes inkl. ohne Override-Eintrag — UI muss
  keinen separaten Default-Lookup kennen).
  `PUT /findings/severity-overrides/{code}` setzt einen Override
  idempotent (UPSERT). `DELETE /findings/severity-overrides/{code}`
  loescht ihn (idempotent, schreibt Audit-Log auch wenn kein Row
  existiert). Service-Layer validiert Code gegen
  `KNX_FINDING_DEFAULT_SEVERITIES` und Severity gegen
  `FINDING_SEVERITIES`.
- **Iter 7 — API `POST /findings/ack` + `DELETE /findings/ack/{ga}/{code}`.**
  Service-Layer (`ack_finding_response` / `unack_finding_response`)
  validiert GA-Format (`M/L/G`) und Code (muss in
  `KNX_FINDING_DEFAULT_SEVERITIES` registriert sein, sonst Tippfehler).
  Note-Length ist auf 1000 Bytes begrenzt (DoS- + Audit-Spam-Schutz).
  Audit-Eintrag (`target_type='knx_finding_ack'`) wird vom Repo
  geschrieben — der Service-Layer gibt nur eine schmale Bestaetigung
  als Response zurueck.
- **Iter 6 — API `GET /api/messagehub/findings`.**
  Filter (severity, code, ga, source) + Pagination (limit, offset).
  Service-Layer in `processing/findings_service.py`
  (`list_findings_response`) gebuendelt, View ist ein duenner aiohttp-
  Wrapper in `api/findings.py`. Hard-Cap `limit=500` schuetzt vor
  versehentlichen Riesen-Pages. Repo-Erweiterung: `count_findings`
  fuer das `total`-Feld der Pagination.
- **Iter 5 — Bestand auf neuen Vertrag gehoben.**
  Health-Findings (Bus-Health-Score) und Anti-Pattern-Findings (4
  Detektoren aus knx_stats.py) bekommen Lift-Funktionen
  (`lift_health_findings`, `lift_pattern_findings`) in
  `processing/findings.py`. Die existierenden Detektoren bleiben
  unveraendert (additiv, kein Refactor) — der Lift mappt `kind` auf
  `code = "PATTERN_*"` bzw. erzeugt `code = "HEALTH_*"` aus dem
  HealthScoreInput. KnxSeverity-Mapping orange -> warning, red ->
  error. 8 neue Codes in `KNX_FINDING_DEFAULT_SEVERITIES`. Vorbereitung
  fuer Iter 9/10 (UI-Tab + Wiring).
- **Iter 4 — `knx_finding_severity_overrides` + Resolver.**
  Default-Severity pro Code in `const.py`
  (`KNX_FINDING_DEFAULT_SEVERITIES`, 12 Codes aus §9.3). User-Override
  pro Code in eigener Tabelle (Migration
  `0026_knx_finding_severity_overrides.sql`). Resolver
  `resolve_severity(code)`: Override -> Default, mit `KeyError` bei
  unbekanntem Code (Tippfehler-Schutz). Audit-Log-Eintrag bei jedem
  Set/Clear (`target_type='knx_finding_severity_override'`).
- **Iter 3 — `knx_finding_acknowledgements` + Auto-Expire.**
  Whitelist-Granularitaet `(GA, finding_code)`: ein Multi-Responder-
  Ack auf 1/2/3 schliesst DPT-Mismatch auf derselben GA NICHT mit
  ein. Default `expires_at = +90 Tage` (`DEFAULT_KNX_ACK_EXPIRY_DAYS`),
  `sticky=True` setzt es auf NULL fuer dauerhafte Unterdrueckung.
  `acknowledge` / `unacknowledge` schreiben einen `audit_log`-Eintrag
  mit `target_type='knx_finding_ack'`. Migration
  `0025_knx_finding_acks.sql` mit Partial-Index ueber endliche
  expires_at-Werte.

## [0.18.0] – 2026-05-03

UX + Stability Release. 23 Commits seit 0.14.0 — drei kritische
Production-Bugs aus Screenshot-Reviews behoben, Diagnose-UX gehaertet
(Integration ist im HA-Log-Filter sichtbar), drei Iterationen
UX-Verbesserungen am KNX-Bus-Analyse-Tab (P0/P1/P2/P3 aus
systematischem UX-Review), Trend-Card aus Counter-Tabelle, plus
Tech-Debt-Cleanup (Cache-Flakiness, Ruff in Tests).

Tests: 706 → 717 Backend (+11), 124 → 141 Vitest (+17).
Bundle: 348 → 363 KB (+15 KB).

### Behoben (Production-Bugs)
- **`KnxStatsGaDetailView.get() got an unexpected keyword argument 'ga'`**
  — Home Assistant ruft View-Handler ueber `handler(request, **request.match_info)`
  auf. Die vier KNX-Stats-Views, die `{ga}` in der URL deklarieren,
  hatten Methoden-Signaturen `(self, request)` ohne `ga`-Parameter.
  Jeder Aufruf brach mit HTTP 500 ab. Betroffen: `KnxStatsGaDetailView.get`,
  `KnxStatsGaExportView.get`, `KnxStatsSensitiveSetView.post/delete/_toggle`,
  `KnxStatsAcknowledgeDetailView.delete`. Plus AST-basierter Regression-
  Test, der jede HTTP-Methode aller `api/*.py`-Views auf vollstaendige
  Path-Parameter-Akzeptanz prueft.
- **HTTP 500 im Statistik > KNX-Bus-Analyse-Tab + Dauer-Spinner im
  Einstellungen > KNX-Bus-Tab, wenn keine ETS-Projektdatei geladen.**
  Ursache: xknx-Project-Properties (`group_addresses`, `devices`)
  warfen RuntimeError/TypeError beim Zugriff auf nicht-geladene
  Strukturen. `getattr(..., default)` faengt nur AttributeError. Fix:
  `_safe_getattr` + `_safe_truthy` in `processing/knx_discovery.py`,
  Top-Level-Safety-Net in `discover_knx_project` /
  `discover_knx_devices` faengt jede Exception und faellt auf den
  Storage-Reader zurueck. 5 neue Resilience-Tests gegen RuntimeError-
  Properties + raisende `__bool__`-Container.
- **`Vorperiode immer 0` im Trend-Tab bei langen Perioden** —
  `compute_trend` las immer aus `knx_raw_telegrams` (48h Retention).
  Bei Perioden ≥ 48h liegt die Vorperiode komplett ausserhalb der
  Retention → total_prev = 0, Vergleich nutzlos. Fix: ab 24h
  Periodenlaenge wird die `knx_telegram_counters`-Tabelle (365d
  Retention, Per-GA-Aggregate) als Quelle benutzt.
  Plus Frontend-Fallback-Hinweis "Vergleich nicht verfuegbar" wenn
  Counter noch leer ist (frische Installation).

### Behoben (HACS-Diagnose)
- **`manifest.json:loggers`-Feld ergaenzt** — vorher tauchte
  `messagehub` ueberhaupt nicht im HA-Log-Filter-Dropdown
  (Einstellungen → System → Protokolle, Filter rechts oben) auf, und
  Debug-Logging via UI funktionierte nicht. Damit waren KNX-Listener-
  und Discovery-Probleme im Produktivbetrieb unauffindbar. Loggers:
  `custom_components.messagehub`, `aiosqlite`, `jsonpath_ng`.

### Behoben (Tech-Debt)
- **`KnxWhitelistCache`-Flakiness** — `_loaded_at` war initial 0.0,
  `monotonic() - 0.0 > TTL` ist nur bei System-Uptime > 300s wahr. In
  Containern mit kurzer Uptime wurde der erste Refresh stillschweigend
  uebersprungen, der Cache blieb leer, Tests flackerten. Fix:
  `-math.inf`-Sentinel — `monotonic() - (-inf) = inf > TTL` ist
  immer wahr, der erste Refresh laeuft IMMER. 2 Regression-Tests gegen
  kurze Uptime.

### Hinzugefuegt (UX P0 — Reihenfolge + Sichtbarkeit)
- **Inline-TopN-Filter pro Card** im KNX-Bus-Analyse-Tab — bisher nur
  bei Top-Sender + Top-Geraete vorhanden, jetzt zusaetzlich an
  Sicherheits-Audit, Telegrammfluten (Bursts), Long-Term-Sicht, Trend,
  Verwaiste GAs (pro Spalte einen), Stille-Alarme, Bus-Gesundheit,
  und im Detail-Drawer "Andere GAs des Geraets". Optionen:
  10 / 25 / 50 / 100 / 200, Default 25.
- **Reihenfolge der Cards** an mentales User-Modell angepasst:
  Uebersicht-KPIs ganz oben, Health-Score, dann Top-Sender + Top-
  Geraete + Detail-Pane, danach Tagesverlauf/Heatmap/Trend, dann
  Anomalie-Cards (Bursts, Stille, Bus-Health), Audit + Verwaiste GAs
  ans Ende. Vorher war Verwaiste GAs (3000+ Eintraege) im Mittelteil,
  Top-Sender im unteren Drittel.
- **Sticky Filter-Bar** mit subtilem Schatten — Periode/Min-Tel/Min
  bleiben beim Scrollen oben.
- **Verwaiste-GAs-Card: ETS-Platzhalter-Filter** (Default ON,
  erkennt `^[\s\-_=]*$` und Label==Address). Reduziert die Liste bei
  3000+ Projekt-GAs um ~80 % typischen Noise-Anteil.

### Hinzugefuegt (UX P1 — Hauptinteraktion)
- **Detail-Pane als Side-Drawer** statt inline am Tabellen-Ende.
  `<aside role="dialog" aria-modal="true">` mit Backdrop, Slide-In-
  Animation 200 ms (`prefers-reduced-motion` respektiert). Schliessen
  via X / Backdrop-Klick / Escape. Mobile (< 720 px): full-width.
- **Heatmap-Bucket-Groesse adaptiv** je Periode: 1 h → 5 min, 6 h →
  15 min, 24 h+ → 60 min. Vorher immer 60 min, was bei kurzen
  Perioden in 1-2 Spalten resultierte.
- **Trend-Card bei kurzen Perioden entschaerft** — 1h-vs-1h-Vergleich
  produziert regelmaessig 4-stellige %-Spruenge (Tag/Nacht-Wechsel,
  Automation). Severity wird bei 1h/6h auf "green" gedeckelt + ein
  erklaerender Hinweistext erscheint. 24h+-Perioden behalten die alte
  Ampel-Logik. Bei langen Perioden ohne Counter-Daten erscheint statt
  leerer Listen ein Hinweistext.

### Hinzugefuegt (UX P2 — Visuelle Klarheit)
- **Top-Sender-Status-Spalte konsolidiert**: vorher bis zu 3 Pills
  uebereinander (Severity, Findings, Bekannt), jetzt genau 1 Pill.
  `green + has_findings` escaliert auf `yellow` mit ⚠-Glyph statt
  widerspruechlichem "OK + auffaellig"-Look.
- **Health-Score-Komponenten als Badges** statt 4 Reihen mit immer-
  gruenen Balken. Eigene Severity-Faerbung pro Komponente:
  ≥ 80 → green, ≥ 60 → yellow, ≥ 40 → orange, < 40 → red.
- **Aktualisieren-Button visuell verstaerkt**: eigene
  `.filter-refresh-btn`-Klasse mit explizitem accent-Fallback,
  Semibold-Font, box-shadow + hover-lift. Bei Loading-State rotiert
  der ↻-Glyph.

### Hinzugefuegt (UX P3 — Polish)
- **Filter-Bar Mobile-Responsive** (< 640 px column-layout, Periode-
  Pills duerfen wrappen, Aktualisieren-Button full-width).
- **Card-Header konsistent** ueber alle Cards (`card-head__meta`-
  Wrapper rechts, mit TopN + Subtitle in einer Zeile).

### Geaendert (Trend-Datenquelle)
- `compute_trend` switcht ab 24h Periodenlaenge auf
  `knx_telegram_counters` (vorher 48h-Schwelle, dann 24h-Boundary
  hinzugekommen, weil Vorperiode dort am Rand der Raw-Retention
  steht). Counter hat hourly-Granularitaet — bei 24h+-Aggregaten
  verlustfrei. Trend-Endpoint `max_days` jetzt 365 (vorher 90).
- Frontend sendet im Long-Term-Modus (7d/30d/365d) den vollen
  Zeitraum statt der 48h-Live-Slice an den Trend-Endpoint.

### Geaendert (Doku-Cleanup)
- 4 veraltete Doku-Dateien entfernt:
  `messagehub_knx_statistik_review.md` (Status: abgeschlossen),
  `messagehub_knx_statistik.md` (Implementations-Spec, Features
  released), `messagehub_erweiterungen.md` (alle Erweiterungen
  released), `messagehub_backlog.md` (effektiv leer nach 0.14.0).
- `messagehub_konzept.md` aktualisiert — §13 Phasen-Plan + §14
  Optionale-Erweiterungen-Status, §16 Manifest-Skizze auf aktuellen
  Stand verweist.
- `CLAUDE.md` Cross-References aktualisiert.
- README + info.md ergaenzen Hinweis zur KNX-Bus-Analyse-Card und
  Debug-Logging via UI.

### Tech-Debt-Cleanup
- **Ruff in Tests**: 37 → 0 Errors via per-file-ignores fuer Test-
  spezifische Stylings (PT011, PT006, PT018, PLC0415, E501) plus
  Auto-Fix fuer 11 I001 + 4 PLR1711 + 2 RUF100. Production-Code-
  Regeln unangetastet.

### Migration
Keine Datenbank-Migrationen.
Alle UI-Aenderungen nutzen `localStorage`-Filter; vorhandene Filter-
Presets bleiben erhalten und werden mit den neuen Default-Feldern
gemerged. `manifest.json:loggers` ist additiv, kein Eingriff in
Bestandskonfig.

## [0.14.0] – 2026-05-02

Großer Quality + Feature-Release. Sammelt Iter 59–93 (35 Iterationen):
Bug-Fixes aus zwei Screenshot-Reviews, 15 UX-Quick-Wins, sieben neue
Backlog-Features (WR-T DPT-Auto-Erkennung, U13 Anti-Pattern-Badge,
WR-P HA-KNX-Direktlinks, P2-3 Rate-Limit, WR-V ASCII-Decoder, WR-I
Trend-Vergleich, WR-F GA-Werteverlauf-Export, K2 Prometheus-Metrics,
WR-G GA-Heatmap, K1 Saved Filters), plus 30+ Code-Review-Findings
(Sustainability, Performance, Security, Clean Code, Testabdeckung).

Tests: 545 → 679 Backend-Unit-Tests (+134), 96 → 124 Vitest (+28).
Bundle: 316 KB → 348 KB (+32 KB / 10 % für 9 neue Features).

Highlights:
- **Tests + Auth**: Pure-Helper-Refactors für GA-Export (Iter 70)
  und Auth (Iter 71), Stress-Tests für Per-Fingerprint-Lock (Iter 82),
  KNX-Hot-Path-Resilienz (Iter 90).
- **Performance**: N+1-Fix in `compute_ga_detail` (Iter 73), Bulk-
  INSERT für `ack_set_bulk` (Iter 78), TTL-Cache für
  `discover_knx_devices` (Iter 79), Streaming-Export (Iter 80),
  Filter-First in `compute_top` (Iter 77).
- **Security**: FTS5-Injection-Fix (Iter 74), Channels-SSRF-
  Validation (Iter 75), Sensitive-GA-Export-Audit (Iter 75),
  Alarm-Eventbus-Dedup (Iter 76), Rate-Limit für ChannelTestView
  (Iter 88), Prometheus-Audit-Failure-Counter (Iter 81).
- **Refactors**: Helper-Duplikat-Auflösung in `api/messages.py`
  (Iter 72), `format_value` Strategy-Pattern (Iter 84),
  `compute_top` Helper-Splits (Iter 77).
- **Features**: WR-T (DPT-Auto), U13 (Findings-Badge), WR-P
  (HA-KNX-Links), WR-V (ASCII-Decoder), WR-I (Trend-Card), WR-F
  (CSV/JSON-Export), K2 (Prometheus `/metrics`), P2-2 (Alarm-
  Schwellen via Config-Flow), WR-G (GA-Heatmap), K1 (Saved
  Filters).
- **UX**: 15 Quick-Wins (Top-N-Selektor, Sortierung, Pagination,
  Filter-Pill-State, Truncation-Tooltip, Anti-Pattern-Badge, etc.)
  und alle Bugs B1–B5 aus zwei Screenshot-Reviews.

Siehe `[Unreleased]` unter dieser Sektion für die einzelnen Iter-
Einträge in chronologischer Reihenfolge.

### Hinzugefügt (Iter 93 — K1 Saved Filters Frontend)
- **Saved-Filters-Dropdown** im Filter-Bar des Nachrichten-Tabs
  („📋 Filter ▾"): Liste aller gespeicherten Filter-Presets, Klick →
  Filter laden, „✕" pro Eintrag → Löschen, „+ Aktuellen Filter
  speichern" → Prompt nach Namen.
- API-Client-Methoden `listSavedFilters`, `upsertSavedFilter`,
  `deleteSavedFilter`. `SavedFilterDto`-Type.
- State persistiert weiter im LocalStorage; Saved-Filter-Anwendung
  überschreibt LocalStorage durch den Server-Stand.

### Hinzugefügt (Iter 92 — K1 Saved Filters serverseitig, Backend)
- **Neue Tabelle** `saved_filters` (Migration 0023). Spalten: `id`,
  `name`, `scope`, `filters` (JSON), `created_at`, `updated_at`.
  UNIQUE(scope, name) verhindert Duplikate.
- **`SavedFiltersRepository`** mit `list_by_scope`, `get`, `upsert`,
  `delete`. Validierung: scope ∈ {`messages`, `knx-stats`, `audit`},
  name nicht leer + max 80 Zeichen, filters dict.
- **REST-Endpoints**:
  - `GET /api/messagehub/saved-filters?scope=...` — Liste.
  - `POST /api/messagehub/saved-filters` body `{name, scope, filters}`
    — Upsert.
  - `DELETE /api/messagehub/saved-filters/{id}` — Löschen.
- Audit-Log: `saved_filter_upsert`, `saved_filter_delete`.
- 11 neue Backend-Tests in `test_saved_filters.py`.

### Hinzugefügt (Iter 91 — WR-G GA-Heatmap)
- **Neuer Endpoint** `GET /api/messagehub/knx-stats/heatmap?from=&to=&top_n=10&bucket=60`
  liefert eine 2D-Matrix Top-N GAs × Zeit-Buckets. Service-Methode
  `compute_heatmap` kombiniert `top_by_ga` (Top-N nach Total) mit
  `timeline` (Bucket-Counts) zu einem `{gas, buckets, matrix}`-Wrapper.
  Hard-Cap top_n=30, bucket 1–60 min.
- **Heatmap-Card im Frontend** als CSS-Grid: Y-Achse Top-N GAs mit
  Code + Label, X-Achse Zeit-Buckets (Stunde:Minute), Zellen mit
  `color-mix(in srgb, var(--mh-warning) X%, transparent)` proportional
  zum Maximum. Tooltip pro Zelle mit absolutem Count.
- 4 neue Backend-Tests in `test_knx_stats_service.py::TestComputeHeatmap`.
- `KnxStatsHeatmapView` registriert in `async_register_views`.

### Tests (Iter 90 — CR-34 KNX-Listener-Crash-Resilienz)
- **4 neue Backend-Tests** für `_record_bus_activity` mit gefakten
  Repos: ValueError im `insert_raw`, RuntimeError im
  `increment_counter`, Bus-Analyse-Flag aus → Skip, Flag an → beide
  Repo-Methoden gerufen.
- Sicherstellen, dass der KNX-Hot-Path bei DB-Lock o. ä. NIE crashed
  — Telegramme aus der Whitelist gehen weiter ins Logbuch.

### Code-Hygiene (Iter 89 — CR-7 Bus-Analyse-Flag Single-Source-of-Truth)
- **Backward-Compat-Fallback `_knx_shadow_counters_enabled` entfernt**
  in `listeners/knx.py:_record_bus_activity`. Iter 48 hat den Flag auf
  `HASS_KEY_KNX_BUS_ANALYSIS` umgestellt; der alte Key war seither
  ungeschrieben und nur passiv im Read-Pfad als Fallback. Jetzt: nur
  noch eine Quelle, kein Drift mehr möglich.
- Modul-Docstring entsprechend angepasst.

### Sicherheit (Iter 88 — CR-20 ChannelTestView Rate-Limit)
- **Token-Bucket** auf `POST /channels/{id}/test`. Vorher konnte ein
  Admin per Klick einen externen Provider (Telegram, Pushover, ntfy)
  spammen — interner Throttle/Quiet-Hours-Schutz wurde im Test-Pfad
  bewusst deaktiviert. Jetzt: Capacity 3, Refill 3/Min pro Channel-ID.
- HTTP 429 mit `Retry-After: 20` bei überschrittenem Limit.

### Hinzugefügt (Iter 87 — P2-2 Alarm-Schwellen via Config-Flow)
- **3 neue Config-Flow-Options** im OptionsFlow: `knx_alarm_busload_pct`,
  `knx_alarm_repeat_rate_pct`, `knx_alarm_silence_count`. Setzt User
  via Settings → Geräte & Dienste → Message Hub → Konfigurieren.
- **`KnxStatsAlarmsView`** liest die Werte aus dem ersten ConfigEntry
  (`_first_entry_options`-Helper) und nutzt sie als Defaults — Query-
  Param-Override gewinnt weiter.
- README-Tabelle „Optionen" um die drei Schlüssel ergänzt.

### Code-Hygiene + Doku (Iter 86 — LOW-Findings Sammel 2)
- **CR-3 Magic Numbers extrahiert**: Trend-Severity-Schwellen
  (25 / 100 / 300 % Δ) als benannte Konstanten am Modul-Top von
  `stats-knx-view.ts`. Bedeutung jetzt aus dem Bezeichner ablesbar.
- **CR-22 Sicherheits-Hinweis Webhooks** in `docs/configuration.md`
  ergänzt: Webhook-ID als einzige Auth-Schicht, Body-/Rate-Limit-
  Schutzschichten, `local_only`-Default und Empfehlung für
  Reverse-Proxy-Eingrenzung.

### Code-Hygiene (Iter 85 — LOW-Findings Sammel)
- **CR-6**: `KnxStatsBusAnalysisStateView.get` liefert jetzt 503 bei
  fehlender DB-Init (konsistent mit anderen Endpoints).
- **CR-26**: Dead `_ = dpt`-Zuweisung in `detect_patterns` entfernt;
  Param mit `noqa: ARG001` markiert.
- **CR-29**: Lokaler `from datetime import datetime as _dt`-Import in
  `silence_detect` entfernt — Modul-Top-Import wird genutzt.

### Refactor (Iter 84 — CR-24 `format_value` Strategy-Pattern)
- **`format_value` (KNX-DPT-Formatter) auf Dispatch-Tabelle umgestellt**.
  Vorher 8 Returns + 12 Branches mit `noqa: PLR0911, PLR0912`. Jetzt
  ein dict-ähnliches Lookup `_DPT_HANDLERS: list[tuple[prefix, fn]]` +
  Default-Handler für numerische Werte mit Einheit.
- Pure Refactor — alle 660 Tests bleiben grün, kein Verhaltens-Diff.

### Hinzugefügt (Iter 83 — CR-4 MQTT-Topic-PUT-Handler)
- **`MqttTopicDetailView.put`** für `/api/messagehub/mqtt-topics/{id}`.
  Vorher musste das Frontend DELETE+POST simulieren — die Topic-ID
  änderte sich dabei. Mit PUT bleibt die ID stabil; `_audit` schreibt
  `mqtt_topic_update`.

### Tests (Iter 82 — CR-35 High-Volume-Concurrency)
- **3 neue Stress-Tests** für `MessageRepository.insert_or_aggregate`:
  1000 parallele Inserts auf gleichem Fingerprint → genau ein
  count=1000-Aggregat (Per-Fingerprint-Lock greift), 100 parallele
  Inserts mit unterschiedlichen Sources → 100 Rows, 200 parallele
  Inserts mit 5 Gruppen → 5 Aggregate à 40 (Lock blockiert nur
  gleiche Fingerprints, nicht cross).

### Operational (Iter 81 — CR-30 Audit-Fail-Handling)
- **Audit-Schreibfehler werden jetzt sichtbar**: ERROR-Log statt
  WARNING (mit Stack-Trace via `LOGGER.exception`), plus
  `_audit_failure_count` als in-process Counter.
- **Prometheus-Endpoint** liefert `messagehub_audit_failures_total`
  als zusätzlichen Counter — User kann persistente DB-Probleme
  jetzt überwachen.
- 1 neuer Backend-Test in `test_prometheus_format.py`.

### Sicherheit + Performance (Iter 80 — CR-18 Streaming-Export)
- **`ExportView` streamt jetzt page-by-page** statt alles im Memory
  zu bauen. Bei `limit=100 000` wurden vorher mehrere hundert MB
  aufgebaut → DoS-Vektor gegen die HA-Instanz.
- **Pure Helpers** in `api/export.py`: `csv_header_line()`,
  `message_to_csv_line(m)`, `message_to_jsonl_line(m)`. Page-Size
  1000 Messages, jeder Page wird sofort an den HTTP-Stream geschrieben.
- 3 neue Backend-Tests (Header-Line + Per-Row Format-Identitaet zu
  `messages_to_csv` und `messages_to_jsonl`, plus CSV-Quoting für
  Sonderzeichen).

### Performance (Iter 79 — CR-11 Cache + CR-13 Index)
- **CR-11 TTL-Cache für `discover_knx_devices`** (5 min). Wird in
  `KnxStatsTopBySourceView` und `KnxStatsGaDetailView` bei jedem
  Request gerufen — bei 100+ Devices vorher pro Request frisch
  geparst. Cache-Key = `id(hass)`. Invalidierung beim
  `_invalidate_knx_cache`-Pfad (KNX-Project-Sync, GA-Edit, etc.) →
  ETS-Änderungen schlagen sofort durch.
- 5 neue Backend-Tests in `test_knx_discovery_cache.py`.
- **CR-13 Partieller Index** auf `knx_ga_acknowledgements.expires_at`
  WHERE expires_at IS NOT NULL (Migration 0022). `ack_active_set`
  filtert über `expires_at IS NULL OR expires_at >= ?` — der
  NOT-NULL-Branch profitiert vom Index. Partiell, weil sticky-Acks
  (NULL) eh den IS-NULL-Branch nutzen.

### Performance (Iter 78 — CR-9 Bulk-INSERT für `ack_set_bulk`)
- **`Database.executemany`** als neue Bulk-Variante zu `execute` (ein
  einziger fsync-Commit über N Rows). Bei `ack_set_bulk` mit 100 GAs
  ~50× schnellere Bulk-Acknowledge-Operation.
- `KnxStatsRepository.ack_set_bulk` nutzt jetzt `executemany` statt
  N einzelner `execute`-Calls.
- 648 Tests bleiben grün — bestehende Bulk-Ack-Tests verifizieren das
  Verhalten.

### Refactor + Performance (Iter 77 — CR-12 + CR-23 compute_top)
- **`compute_top` zerlegt** in 3 Helper-Methoden:
  `_filter_top_rows`, `_enrich_top_samples`, `_build_top_row`. Vorher
  67 Zeilen mit Cognitive-Complexity ~17, jetzt der Public-Pfad
  unter 30 Zeilen.
- **CR-12 Filter-First**: rate + ack-Filter laufen JETZT vor dem
  Bulk-Sample-Lookup. Bei restriktivem `min_rate_per_min` werden
  Samples nur für die survivors geladen — bei sehr hoher
  Min-Rate-Threshold (z. B. „nur >= 5 Tel/Min") kann das den
  Bulk-Lookup um 80%+ kürzen.
- **DPT-Inferenz nur für GAs ohne DPT** (CR-12-Detail): vorher lief
  `infer_dpt_from_samples` auch für GAs mit gepflegtem ETS-DPT —
  unnötiger Aufwand.
- 648 Tests bleiben grün — kein Verhaltensunterschied.

### Sicherheit (Iter 76 — CR-17 Alarm-Eventbus-Dedup)
- **`AlarmDedupCache`** (in-process Set + TTL) verhindert mehrfaches
  Eventbus-Fire desselben Alarms innerhalb derselben Minute. Bei
  rapid-Polling (z. B. alle 30 s) wurde sonst dieselbe `triggered`-
  Bedingung pro Aufruf neu gefeuert → nachgelagerte Automationen
  liefen mehrfach.
- Modul-Singleton `_alarm_dedup` in `api/knx_stats.py`. Default-TTL
  3600 s, Cleanup inline beim Lookup.
- 6 neue Backend-Tests in `test_alarm_dedup.py`.

### Sicherheit (Iter 75 — CR-19 + CR-21: Sensitive-Export-Audit + Channels-SSRF)
- **CR-19 KNX-GA-Export markiert sensitive GAs im Audit**:
  `KnxStatsRepository.is_sensitive(ga)` prüft das `is_sensitive=1`-
  Flag, der Export-View schreibt entweder `knx_stats_ga_export` oder
  `knx_stats_ga_export_sensitive` als Audit-Action plus
  `is_sensitive`-Detail. Export wird nicht blockiert (Admin-User),
  aber lauter geloggt.
- **CR-21 Channel-Config-Validation gegen SSRF + Config-Bombs**: Neues
  HA-frei testbares Modul `api/_channel_validation.py` mit
  `validate_channel_config(channel_type, config)`.
  - **webhook**: URL muss http(s) auf public Host zeigen — blockiert
    `localhost`, `*.local`, IPv4-Private (RFC 1918), Loopback,
    Link-Local, Multicast. Max 1024 Zeichen.
  - **telegram**: bot_token im Format `<id>:<chars>` (Regex), chat_id
    pflicht.
  - **pushover**: 30-stellige alphanumerische user_key + api_token.
  - **ntfy**: server-URL public, topic non-empty.
  - **notify**: service-Name ohne Dots.
- 24 neue Tests in `test_channel_validation.py` (alle Channel-Types,
  alle Block-Pfade).
- `ChannelsView.post` und `ChannelDetailView.put` rufen die Validation
  vor dem DB-Insert.

### Sicherheit (Iter 74 — CR-16 FTS5-Injection / DoS gefixt)
- **FTS5-MATCH-Klausel** in `_build_filter_where` wrappt User-Input
  jetzt in doppelte Anführungszeichen + escapt interne `"`.
  Vorher konnten Spezialzeichen (NEAR, AND, OR, `"`, `*`) einen
  `SQLITE_ERROR: fts5: syntax error` triggern → DoS via 500-Response
  und Info-Leak (Fehlermeldung im Body).
- 1 neuer Backend-Test mit 8 problematischen Queries (nackte
  Anführungszeichen, NEAR, OR, Wildcards, FTS5-Keywords) — alle
  laufen jetzt ohne Exception durch.

### Performance (Iter 73 — CR-8 N+1 in `compute_ga_detail` behoben)
- **Neue Repo-Methode** `KnxStatsRepository.ga_meta_for_period(ga,
  from, to)` mit direktem `WHERE r.destination = ?` + LIMIT 1.
- **Vorher**: `_fetch_ga_meta` rief `top_by_ga(limit=500)` mit
  Aggregat über alle Top-500 GAs auf, nur um eine zu finden — bei
  jedem Detail-Pane-Klick. Linear-Scan in Python.
- **Jetzt**: ein direkter Index-Hit via Filter-Klausel, plus LEFT
  JOIN auf `knx_group_addresses` für dpt/label.
- 617 Tests bleiben grün — bestehende `compute_ga_detail`-Tests
  decken die Funktionalität ab.

### Refactor (Iter 72 — CR-1 Helper-Duplikat-Refactor)
- **`api/messages.py` 138 Zeilen lokaler Helper-Definitionen entfernt**
  und durch Imports aus `api/_helpers.py` ersetzt (mit Aliases auf
  die `_`-Names, damit der ~1100 Zeilen restliche Code unangetastet
  bleibt). Vorher existierten `_msg_to_dict`/`_wh_to_dict`/`_get_repos`
  /etc. parallel zu `msg_to_dict`/`wh_to_dict`/`get_repos` — Drift-
  Risiko bei Änderungen an einer Stelle.
- `_helpers.py` Modul-Docstring aktualisiert (CR-28).
- 617 Tests bleiben grün — kein Verhaltensunterschied.

### Tests (Iter 71 — CR-37 Auth-Tests)
- **8 neue Backend-Tests** für `assert_admin_user`. Pure Funktion in
  neuem Modul `api/_auth.py` (kein `homeassistant`-Import → ohne
  HA-Test-Stack testbar). `RequireAdminView._check_admin` delegiert
  jetzt an die Funktion.
- Decken alle Bypass-Pfade ab: `None`-User (anonymous), Object ohne
  `is_admin`-Attribut, `is_admin=False`, `is_admin=True`, plus
  defensive Tests gegen truthy non-bool und leere Strings.

### Tests / Refactor (Iter 70 — CR-32 GA-Export-Tests)
- **18 neue Backend-Tests** für GA-Werteverlauf-Export (Iter 68 hatte
  Endpoint inline ohne Tests). Pure Helpers in
  `processing/knx_stats_export.py` (`cap_samples`,
  `format_ga_export_csv`, `format_ga_export_json`,
  `safe_export_filename`).
- Tests decken ab: Hard-Cap (50 000 Samples), CSV-Quoting bei
  Kommas/Anführungszeichen im Wert, Dict-/List-Werte als JSON,
  None-Werte als leere Cells, LF-statt-CRLF Lineterminator,
  JSON-Wrapper-Format, Unicode-Erhalt, Filename-Slash-Escape.
- `KnxStatsGaExportView` nutzt jetzt die Helpers — Lines-of-Code im
  View von 84 auf 33 reduziert.
- `compute_trend` (Iter 67) hat bereits 3 Tests — CR-33 ist damit
  als „abgehakt" verifiziert.

### Hinzugefügt (Iter 69 — K2 Prometheus `/metrics`-Endpoint)
- **Neuer Endpoint** `GET /api/messagehub/metrics` liefert Counts im
  Prometheus-Text-Format. Pure Funktion `format_prometheus_metrics`
  in `processing/prometheus.py` mit 7 Tests, View `MetricsView` in
  `api/messages.py`.
- Exposed Metrics:
  - `messagehub_total` (counter) — Total Messages
  - `messagehub_messages_total{severity}` (counter) — pro Severity all-time
  - `messagehub_messages_24h{severity}` (gauge) — pro Severity letzte 24 h
  - `messagehub_knx_telegrams_total` (counter)
  - `messagehub_webhooks_total` (gauge)
- Auth: `RequireAdminView` wie alle anderen Endpoints — Prometheus-
  Scraper braucht ein Long-Lived Access Token via Bearer-Header.
- `docs/configuration.md` um REST-API-Eintrag + Scrape-Config-Beispiel
  ergänzt. README unverändert (Endpoint ist Power-User-Feature).
- 8 SELECTs pro Scrape (4 Severities × 2 Zeiträume + total + knx +
  webhook) — bei typischer 30–60 s-Frequenz vertretbar. Materialized-
  View bewusst nicht jetzt; bei höherem Bedarf separat.

### Hinzugefügt (Iter 68 — WR-F GA-Werteverlauf-Export CSV/JSON)
- **Neuer Endpoint** `GET /api/messagehub/knx-stats/ga/{ga}/export`
  liefert den Werteverlauf einer GA als CSV oder JSON. Query-Param
  `format=csv|json` (Default `csv`) plus `from`/`to`. Hard-Cap 50 000
  Samples pro Aufruf (DoS-Schutz).
- **Audit-Log-Eintrag** `knx_stats_ga_export` mit Format, Periode und
  Sample-Count — Export ist eine bewusste Wissensgefälle-Mutation und
  bekommt einen Trail.
- **Detail-Pane** im Frontend bekommt zwei neue Schnell-Aktionen-
  Links: „⤓ CSV-Export" und „⤓ JSON-Export". HTML5-`download`-
  Attribut sorgt für Download statt Inline-Anzeige; Filename folgt
  dem Schema `ga-1-2-3.csv` (Slashes als Bindestriche).
- View-Registrierung in `async_register_views`; Reflection-Test in
  `test_api_view_registration` deckt das automatisch ab.

### Hinzugefügt (Iter 67 — WR-I Trend-Vergleich heute-vs-Vorperiode)
- **Neue Card „Trend gegenüber Vorperiode"** im KNX-Bus-Analyse-Tab
  zwischen den Verwaisten-GAs und den Top-Sender. Vergleicht die
  aktuelle Periode mit einer Vorperiode gleicher Länge unmittelbar
  davor.
- KPI-Header: aktuell/zuvor Telegramm-Total + Total-Delta in % (oder
  „neu" bei prev=0). Card-Border-Color folgt 4-stufiger Ampel
  (|Δ| < 25 % grün, < 100 % gelb, < 300 % orange, sonst rot).
- Zwei Spalten: Größte Anstiege (warning-soft Hintergrund) und Größte
  Rückgänge (success-soft) mit jeweils bis zu 5 GAs. Pro Zeile: GA,
  Label, absolute + relative Differenz. „neu" bei count_prev=0,
  „verstummt" bei count_now=0.
- Backend: neue Repo-Methode `total_by_ga_for_period` (kein LIMIT) +
  Service-Methode `compute_trend(from, to, top_n)` mit Bulk-Merge
  über beide Perioden + neuer API-Endpoint
  `GET /api/messagehub/knx-stats/trend`. Hard-Cap top_n=50.
- 3 neue Backend-Tests (delta_abs/pct/None für „neu" + verstummt,
  empty periods, top_n cap) + Mock-Stubs in 2 Frontend-Test-Dateien.

### Hinzugefügt (Iter 66 — WR-V Multi-byte-ASCII-Decoder für DPT 16.x)
- **Byte-Tupel werden als String dekodiert** im KNX-Wert-Formatter.
  Vorher zeigte eine DPT-16.x-Nachricht „Alarm = (32, 32, 37, 32, 84,
  111, 116, 97, 108, 32, 32, 32, 32, 37)" statt „  %  Total %". xknx
  liefert Strings teilweise als Tupel von Byte-Werten — der Formatter
  hat das vorher 1:1 als `str(tuple)` weitergegeben.
- **Heuristik im `format_value`**: bei DPT 16.x oder bei DPT=None mit
  Byte-Tupel >= 3 Elemente, wird via `_try_decode_byte_tuple_as_string`
  dekodiert. Akzeptanzkriterium: alle Bytes 0–255, mind. 70 % printable
  ASCII (32–126) oder Padding-Null. latin-1-Decode strippt
  Null-Padding. Bei mehrheitlich nicht-printable Bytes (z. B. DPT 10.x
  TimeOfDay = 3 Bytes mit kleinen Zahlen) bleibt die Tupel-
  Repräsentation erhalten — kein Falschpositiv.
- 8 neue Backend-Tests in `test_knx_dpt_string_decode.py` (Tupel-
  Decode, Passthrough für Strings, Padding-Stripping, Out-of-Range,
  Float-Tupel, Non-printable).

### Sicherheit (Iter 65 — P2-3 Rate-Limit für `/knx-stats/alarms`)
- **Token-Bucket-Limiter** auf den Alarms-Endpoint. Jeder Aufruf
  feuert HA-Eventbus-Events für triggered Alarms — ein Admin-User
  könnte über Polling absichtlich Eventspam erzeugen. Konfiguration
  Capacity 5, Refill 12/Minute (= 1 Token alle 5 s). Pro-User-Key
  (User-ID), damit ein User nicht andere blockiert.
- Bei Limit überschritten: HTTP 429 mit `Retry-After: 5`-Header.
  `web.json_response` direkt, weil `HomeAssistantView.json_message`
  keine custom Headers unterstützt.
- 3 neue Backend-Tests in `test_alarms_rate_limit.py` (Burst,
  Per-Key-Isolation, Refill-nach-Wait via monkeypatched monotonic).

### Hinzugefügt (Iter 64 — WR-P HA-KNX-Direktlinks)
- **„Schnell-Aktionen"-Sektion im Detail-Pane** unter den Geschwister-
  GAs. Zwei Direktlinks pro GA:
  1. „HA-KNX-Konfig öffnen" → `/config/integrations/integration/knx`
     (gleicher Tab, nur ein Klick statt Settings → Geräte & Dienste
     → KNX → suchen).
  2. „Im KNX-User-Forum suchen" → externes Forum-Search mit GA-Code
     vorausgefüllt (neuer Tab, `rel="noopener noreferrer"`).
- Tab-Wechsel innerhalb messagehub (zu Settings → KNX-Adressen mit
  GA-Filter) bewusst NICHT verdrahtet — mehr Refactor-Aufwand als
  Mehrwert; GA-Code kann per Copy-Paste übernommen werden.

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
