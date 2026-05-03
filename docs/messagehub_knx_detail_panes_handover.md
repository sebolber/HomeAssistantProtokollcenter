# Übergabe: KNX-Detail-Panes — Iter D.2 bis J + Gesamtreview

Stand: 2026-05-03, letzter Commit `cb396fe` (auf `main` per FF).

## Aufgabe in einem Satz

Setze die Iter D.2 bis J aus `docs/messagehub_knx_detail_panes_konzept.md`
nachhaltig um (TDD, Quality-Gates, Caller-Pflicht), commitiere pro
Iter, am Ende ein Senior-Architect-Gesamtreview.

## Was ist fertig

| Iter | Inhalt | Commit |
|------|--------|--------|
| A | Repo `last_seen_for_source`, `count_for_source`, `repeat_ratio_for_source`, `gas_for_source` erweitert (dpt + last_seen) | `8929b19` |
| B | Service `KnxStatsService.compute_source_detail` + `SourceDetail`/`SourceGaSummary`-Dataclasses + `source_detail_to_dict` | `109659f` |
| C | API-View `KnxStatsSourceDetailView` registriert in `messages.py` | `226577f` |
| D.1 | Frontend-API-Client: `KnxStatsSourceDetailDto` + `getKnxStatsSourceDetail()` | `cb396fe` |

Backend ist End-to-End fertig — Endpoint
`GET /api/messagehub/knx-stats/source/{dev_source}?from=ISO&to=ISO`
liefert vollwertige Source-Detail-Daten.

Test-Stand: 1019 Backend-Tests, 192 Frontend-Tests, ruff + typecheck
clean. Branch `claude/knx-wiring-audit-iter30-m4h8Z` und `main`
synchron auf `cb396fe`.

## Offene Iter

### Iter D.2 — Frontend Render-Body + Click-Wrapper

**Smoke-Test-First** (`frontend/tests/source-detail-render.test.ts`):
mounte `<stats-knx-view>` mit gemockter `getKnxStatsSourceDetail`,
setze `_sourceDetail`-State manuell auf ein DTO, render → prüfe dass
Header (`dev_source`, `total_count`, `ga_count`), Stille-Status (wenn
`silent_alarm`), GA-Liste mit Severity-Pills sichtbar sind.

**Files:**
- `frontend/src/components/stats-knx-view.ts`
  - State erweitern: `@state() private _sourceDetail: KnxStatsSourceDetailDto | null = null`
  - State erweitern: `@state() private _selectedSource: string | null = null`
  - Methode `_loadSourceDetail(devSource: string)` analog zu `_loadDetail(ga)`
  - Methode `_closeSourceDetail()` analog zu `_closeDetail()`
  - Render: `_renderDetailPane()` so erweitern, dass es entweder GA-Detail
    ODER Source-Detail rendert (entscheiden via state)
  - Neuer privater Render `_renderSourceDetailBody(detail)` mit:
    - KPI-Reihe (Total, GA-Count, Bus-Anteil, Wiederhol-Quote)
    - Stille-Status (prominent wenn `silent_alarm`)
    - GA-Liste sortierbar (Spalten GA · Label · DPT · Rate · Soll · Severity-Pill · Klick → öffnet GA-Detail)
    - Geräte-Info (`device`/`manufacturer_hints`) wie im GA-Detail
- Tests: `frontend/tests/source-detail-render.test.ts` (mind. 4 Tests)

**Caller-Pflicht:** noch keine Top-Level-Click-Handler, aber `_loadSourceDetail`
ist über das Test-Mock aufrufbar — bewusst, weil E/F/G die echten Caller liefern.
Im Commit-Body **`OPEN: Click-Handler in Iter E+F+G`** dokumentieren.

**Phase-Exit-Antwort:** *„Mock-Test bewegt eine Source in den State — der Render-Body
zeigt das Source-Detail-Pane mit allen Feldern. Echte User-Klicks
folgen in E+F+G."*

### Iter E — Top-Geräte Click-Handler

**Smoke-Test-First**:
`test_top_devices_row_click_loads_source_detail` — mounte stats-knx-view,
mocke API mit topBySource + getKnxStatsSourceDetail, klicke auf eine
TR-Zeile in der `data-test="top-devices-table"`, prüfe dass
`_sourceDetail`-State befüllt wird und Pane sichtbar ist.

**Files:**
- `frontend/src/components/stats-knx-view.ts:_renderTopBySource`
  - TR-Zeile mit `@click=${() => this._loadSourceDetail(row.dev_source)}` versehen
  - Selection-Highlight via `_selectedSource === row.dev_source ? "selected" : ""`
  - Cursor: pointer auf TR
- Test: `frontend/tests/top-devices-click.test.ts`

**Caller-Pflicht:** Click-Handler ruft Iter-D.2-Service.

**Phase-Exit-Antwort:** *„User klickt auf eine Top-Gerät-Zeile, das Source-Detail-Pane öffnet sich mit der GA-Liste dieses Geräts."*

### Iter F — Stille-Alarme Click-Handler

**Smoke-Test-First**:
`test_silence_alarm_click_loads_source_detail` — analog zu Iter E,
nur dass das Click auf einer `silence-list`-LI-Zeile passiert.

**Files:**
- `frontend/src/components/stats-knx-view.ts:_renderSilenceAlarms`
  - LI mit `@click=${() => this._loadSourceDetail(a.dev_source)}` versehen
  - Cursor + Selection-Highlight wie in Iter E
- Test: `frontend/tests/silence-click.test.ts`

**Phase-Exit-Antwort:** *„User klickt auf eine Stille-Alarm-Zeile und sieht
sofort, welche GAs das stumme Gerät bedient."*

### Iter G — Trend-Liste Click-Handler

**Smoke-Test-First**:
`test_trend_row_click_loads_ga_detail` — mounte stats-knx-view, mocke
API mit Trend-Daten + getKnxStatsGaDetail, klicke auf eine
`trend-list`-LI-Zeile, prüfe dass `_detail`-State befüllt wird (NICHT
`_sourceDetail`! — Trend-Zeilen referenzieren GAs, nicht Sources).

**Files:**
- `frontend/src/components/stats-knx-view.ts:_renderTrend`
  - LI in `top_increase` und `top_decrease` mit `@click=${() => this._loadDetail(row.ga)}` versehen
  - Cursor: pointer
- Test: `frontend/tests/trend-click.test.ts`

**Phase-Exit-Antwort:** *„User klickt auf einen GA in der Trend-Liste und sieht das vollständige GA-Detail (rate, recommendation, value-history) — kein Backend-Wechsel notwendig."*

### Iter H — Findings-Liste in Source-Detail

**Smoke-Test-First**:
`test_source_detail_includes_findings_for_source` — Backend-Test:
inseriere Finding mit `source="1.1.10"`, rufe Source-Detail-Service,
prüfe `detail.findings` enthält den Eintrag.

**Backend-Erweiterung:**
- `processing/knx_stats_service.py:SourceDetail` um Feld
  `findings: list[FindingDto]` ergänzen
- `compute_source_detail` ruft `FindingsRepository(db).list_findings(source=dev_source)`
  und konvertiert die Findings in DTO-Form
- Service braucht jetzt eine `findings_repo`-Abhängigkeit oder
  delegiert an die View. **Empfehlung:** Service-Konstruktor
  optional erweitern (`__init__(repo, *, findings_repo=None)`),
  damit existierende Aufrufer (Tests, andere Endpunkte) kein Refactor
  brauchen.

**Frontend-Erweiterung:**
- `_renderSourceDetailBody` neue Sektion „Findings dieses Geräts"
- Klick auf einen Finding-Code → öffnet Findings-Tab mit
  vorbefülltem Filter `?source=1.1.10` (über Top-Level-State-Sharing
  oder URL-Hash; einfachster Weg: window.location.hash setzen +
  messagehub-panel.ts liest den Hash beim Tab-Switch)

**Test:** Backend + Frontend (Mocked Findings).

**Phase-Exit-Antwort:** *„User sieht im Source-Detail eine Liste aller
Findings, die diese Source betreffen (RECONNECT_STORM etc.); Klick
springt in den Findings-Tab mit passendem Filter."*

### Iter I — Trend-Compare per Source in Source-Detail

**Smoke-Test-First**:
`test_source_detail_includes_trend_when_period_long_enough` — inseriere
Telegramme heute + gestern, rufe Source-Detail mit 24h-Period, prüfe
dass `detail.trend` mit `count_now`/`count_prev`/`delta_pct` befüllt ist.

**Backend-Erweiterung:**
- Neuer Aggregator `count_per_source_compare(dev_source, recent_from, recent_to,
  baseline_from, baseline_to) -> dict` im Repo (1 SQL-Query mit `WHERE timestamp BETWEEN ... AND ... GROUP BY ...`).
- `SourceDetail.trend: TrendDelta | None`
- Service: nur bei Period >= 24h; sonst `trend=None` (UI rendert nichts).

**Frontend:** neuer Render-Block im Source-Detail-Body — Total-Vergleich
mit Severity-Klassifikation analog zu `_renderTrend`.

**Phase-Exit-Antwort:** *„Bei einer 24h+-Auswahl sieht der User im
Source-Detail, ob das Gerät dieses Mal mehr/weniger Telegramme
gesendet hat als in der gleichen Vorperiode."*

### Iter J — Doku + CHANGELOG + Release v0.23.0

**Files:**
- `CHANGELOG.md` `[Unreleased]`-Block: Iter A-J zusammenfassen
- `manifest.json:version` auf `0.23.0`
- `[Unreleased]` umbenennen zu `[0.23.0] – <Datum>`
- `docs/messagehub_knx_detail_panes_konzept.md` Status-Marker setzen (alle Iter „erledigt")
- `docs/messagehub_backlog.md` aktualisieren

**Commit:** `chore(release): v0.23.0` mit 3-Satz-Phase-Exit-Antwort
im Body. Push auf `claude/knx-wiring-audit-iter30-m4h8Z` und auf
`main` (Fast-Forward). KEIN Tag setzen, KEIN PR.

## Senior-Architect-Gesamtreview (am Ende)

Nach Iter J: ausführliches Review mit folgenden Schwerpunkten:

### Security

- Auth-Pfad: Endpoint via `RequireAdminView` ✓; manuell verifizieren
  dass kein Pfad ohne Admin-Check existiert
- Input-Validation: `validate_knx_individual_address` greift bei
  jedem Aufruf? `parse_iso_period`-Hard-Cap (90 Tage) greift?
- SQL-Injection: alle Repo-Methoden parametrisiert? Keine f-Strings
  in SQL?
- DoS-Schutz: GA-Hard-Cap 100; Period-Hard-Cap 90 Tage; was passiert
  bei einer Source mit 5 Mio Telegrammen im Period?
- Audit-Log: muss ein Source-Detail-Lookup geloggt werden? Aktuell
  nicht (Read-Only); diskutieren ob das ausreicht.
- Secrets-Leak: `device_info` enthält Hersteller/Modell — keine
  Credentials, nur ETS-Projekt-Daten; OK.

### Performance

- Pro Aufruf: 6 SQL-Queries (gas_for_source, last_seen, count,
  repeat_ratio, summary, ack_active_set). Bei 5 Mio Rows + Index:
  jeweils < 50 ms; Aufrufrate < 1/s realistisch (User-Klick) → OK.
- N+1-Pattern? `compute_source_detail` macht KEINE Per-GA-SQL-Queries
  (Severity-Klassifikation läuft in Python über die `gas_for_source`-
  Rows). ✓
- Index-Nutzung: `idx_knx_raw_source_ts` deckt source+timestamp ab,
  `idx_knx_raw_destination_ts` deckt ga+timestamp ab. ✓
- Frontend-Bundle: Source-Detail fügt ~3 KB zum Bundle hinzu (DTOs +
  fetch + render); akzeptabel.
- Caching-Strategie: nicht implementiert. Diskutieren ob bei Doppel-
  Klicks innerhalb 30 s ein Frontend-Memo sinnvoll wäre.

### Massendaten / Loggrößen

- Anlage mit 5 Mio Telegrammen + 200 Sources + 5000 GAs:
  - `gas_for_source` mit Hard-Cap 100 → max 100 Rows pro Antwort
  - `summary` aggregiert über 5 Mio Rows in einem `COUNT(*)` →
    indexed scan
  - JSON-Antwort < 50 KB pro Aufruf
- DB-Wachstum: keine neuen Tabellen, keine zusätzliche Schreiblast
  (Read-Only-Endpoint). ✓
- Retention: nutzt knx_raw_telegrams (48h Default Retention),
  nicht den Counter — Source-Detail funktioniert nur für die
  letzten 48h. Diskutieren ob ein Counter-basierter Pfad für
  längere Perioden nötig ist (Iter K?).

### Clean Code

- `compute_source_detail` Cognitive Complexity: prüfen ob unter 15
  (CLAUDE.md-Regel). Bei Verstoss in Helper extrahieren.
- `SourceDetail`-Dataclass: `frozen=True, slots=True` ✓
- Type-Hints: alle Service-Methoden typisiert ✓
- Naming: `dev_source` konsistent über Backend/Frontend? `share_pct`
  vs. `bus_share_pct`? Diskutieren.
- Kommentare: WHY-Kommentare bei Hard-Caps und Threshold-Werten
  vorhanden? ✓ (siehe Iter B Service-Docstrings)
- Frontend Cognitive Complexity: `_renderDetailPane` jetzt mit zwei
  Inhaltstypen — prüfen ob Aufteilung in `_renderGaDetailBody` +
  `_renderSourceDetailBody` schon ausreicht oder ob ein
  Strategy-Pattern angebracht ist.

### Was als Format

3-5 Seiten Markdown unter `docs/messagehub_knx_detail_panes_review.md`,
pro Schwerpunkt:
- Befund (mit Code-/Datei-Verweis)
- Risiko-Bewertung (Hoch/Mittel/Niedrig)
- Empfehlung (Sofort / Phase 8 / Out-of-Scope)

Am Ende ein Verdict-Absatz: „Production-ready ja/nein/mit Auflagen".

## Verbindliche Meta-Regeln (unverändert)

### TDD-Pflicht
Pro neuer User-sichtbarer Funktion **erst Smoke-Test schreiben, dann
Code**. Naming `test_<feature>_visible_after_<trigger>`.

### Caller-Pflicht
Jede neue Funktion bekommt einen nicht-Test-Caller in derselben Iter.
Ausnahme: dokumentieren als `OPEN: wired in Iter X` im Commit-Body.
Vor Phase-Ende prüfen, dass keine offenen `OPEN`s mehr sind.

### Phase-Exit-Antwort
3-Satz-Antwort im Commit-Body:
> Was sieht ein User in der laufenden App jetzt zusätzlich? Welcher
> User-Trigger löst das aus? Welcher Code-Pfad führt vom Trigger zum
> sichtbaren Ergebnis?

### Quality-Gates pro Iter
1. Backend: `pytest -q` grün
2. Frontend: `npm run typecheck`, `npm test`, `npm run build` grün
3. HACS-Bundle (`custom_components/messagehub/frontend_dist/messagehub-panel.js`)
   im Commit
4. ruff + (optional) mypy clean

### Conventional Commits
`feat`, `fix`, `refactor`, `chore`, `docs`, `test`. Subject ≤ 72 Zeichen.
Footer mit `Iteration: source-detail-X`.

### Verbote
- KEIN `--force[-with-lease]`, KEIN `--no-verify`, KEIN `git reset --hard`
- KEIN Tag setzen, KEIN PR
- KEIN Push auf `main` außer Fast-Forward nach Release

## Setup (Status quo)

- venv: `/tmp/messagehub-venv/bin/pytest`
- Frontend: `cd frontend && npm test --run`, `npm run build`
- Branch: `claude/knx-wiring-audit-iter30-m4h8Z`
- main: synchron auf `cb396fe`

## Konzept-Quelle

`docs/messagehub_knx_detail_panes_konzept.md` — Architektur-
Entscheidungen (kein zweites Modal, GA-Klick im Source-Detail
wechselt zum GA-Detail mit Breadcrumb), Out-of-Scope-Liste.

## Reihenfolge

1. Iter D.2 → Commit `feat(frontend): Source-Detail-Render-Body (Iter D.2)`
2. Iter E → Commit `feat(frontend): Top-Geraete Click-Handler (Iter E)`
3. Iter F → Commit `feat(frontend): Stille-Alarme Click-Handler (Iter F)`
4. Iter G → Commit `feat(frontend): Trend-Liste Click-Handler (Iter G)`
5. Iter H → Commit `feat(knx-stats): Findings-Liste in Source-Detail (Iter H)`
6. Iter I → Commit `feat(knx-stats): Trend-Compare in Source-Detail (Iter I)`
7. Iter J → Commit `chore(release): v0.23.0`
8. Gesamtreview → Commit `docs(knx): Senior-Review der Detail-Panes-Iter`

Pro Iter: Push auf Branch + auf `main` (Fast-Forward).

**Goldene Regel:** Wenn am Ende einer Iter die Frage *„Welcher
Code-Pfad ruft die neue Funktion produktiv auf?"* nicht in **einem
Satz** beantwortbar ist, ist die Iter nicht abgeschlossen.

**Lass dir Zeit. Keine Abkürzungen. Nachhaltig vor schnell.**
