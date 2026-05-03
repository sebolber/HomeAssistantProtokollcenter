# Übergabe-Prompt: Messagehub-Audit-Folge-Sprints

**Stand:** 2026-05-03 nach Abschluss von Audit-Iter +0 bis +11 auf `main`.

---

## Mission für diese Session

Du übernimmst ein laufendes Projekt: die Home-Assistant-Custom-Integration `messagehub`. Eine vorherige Session hat ein vollständiges Anbindungs-Audit (Backend ↔ Frontend) durchgeführt und alle 12 dabei gefundenen Findings (F-001…F-011) in 11 Iterationen umgesetzt — Branch `claude/audit-frontend-integration-38eoO` wurde nach `main` gemerged. Dein Job ist es, **den dokumentierten Backlog weiter abzuarbeiten** (siehe §3 unten) — gleicher Stil, gleiche Disziplin.

---

## 1. Repo-Kontext

| | |
|---|---|
| **Pfad** | `/home/user/HomeAssistantProtokollcenter` |
| **Branch (HEAD)** | `main` (neueste Commits siehe `git log`) |
| **Stack Backend** | Python 3.11, Home Assistant Custom Integration, `aiohttp`, `aiosqlite`, `jsonpath-ng`, `pytest` + `pytest-asyncio` |
| **Stack Frontend** | Lit 3 + TypeScript strict, Vite, Vitest (jsdom) |
| **HACS-Bundle** | `custom_components/messagehub/frontend_dist/messagehub-panel.js` — wird committed (HACS hat keinen Build-Step) |
| **Aktuelle Version** | 0.23.0 (in `manifest.json`) |
| **Tests** | 1073 pytest grün · 272 vitest grün · TypeCheck strict clean |

### Pflicht-Lektüre (in dieser Reihenfolge):
1. `CLAUDE.md` — Projekt-Regeln (TDD, Conventional Commits, Quality Gates, Cognitive Complexity, Code-Stil)
2. `docs/messagehub_konzept.md` — Architektur-Spec
3. `docs/messagehub_backlog.md` — Aktueller Backlog (TopN-Bugs, xknx-blocked Items)
4. `docs/20260503/anbindungs-audit/00-summary.md` — Was die letzte Session getan hat
5. `CHANGELOG.md` — Letzte Iterationen unter `[Unreleased]`

---

## 2. Konventionen — bitte STRENG einhalten

Aus `CLAUDE.md`, ergänzt durch Erfahrung der Vorgänger-Session:

### TDD ist verbindlich
1. **Test zuerst** schreiben (rot)
2. Implementation (grün)
3. Quality-Gates laufen lassen (siehe unten)
4. Commit

### Quality-Gates pro Iteration
- `pytest tests/unit/ -q` → grün
- `cd frontend && npm run typecheck` → grün
- `cd frontend && npx vitest run` → grün
- `cd frontend && npm run build` → grün (legt das Bundle in `custom_components/messagehub/frontend_dist/`)
- `frontend_dist/messagehub-panel.js` MUSS im selben Commit sein wie der Source-Change

### Iteration-Muster (wie ich es gemacht habe)
1. TodoWrite mit allen Schritten der Iteration
2. **Test zuerst** (Vitest und/oder Pytest), Test ist rot
3. Backend-Code falls nötig
4. Frontend-Code falls nötig
5. Beide Test-Suiten grün
6. Build, Bundle committed
7. Playwright-Test umstellen (`test.fixme` → `test`) falls vorhanden
8. CHANGELOG-Eintrag unter `[Unreleased]`
9. Conventional Commit mit Footer `Iteration: <N>`
10. **User-Test-Check**: was kann der User jetzt? Schreib das in die Antwort.

### Conventional Commits
- Subject ≤ 72 Zeichen
- Typen: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `ci`, `build`, `perf`
- Footer: `Iteration: N` (oder `Iteration: topn-1`, `Iteration: K` etc.)
- Footer: `https://claude.ai/code/session_<id>` ans Ende

### Sicherheit > Performance > DRY
- Alle Backend-API-Views erweitern `RequireAdminView` und müssen `_check_admin(request)` aufrufen
- Audit-Logging via `_audit(hass, request, action=...)` für jede CUD-Aktion
- Confirm-Dialoge nur für destruktive Aktionen (Löschen)
- Rate-Limits über `TokenBucketLimiter` für Endpoints, die externe Provider treffen
- Path-Params via `encodeURIComponent` (z. B. KNX-GAs mit Slashes)
- Existenz-Check vor UPDATE/DELETE für sauberes 404 (statt Silent-No-Op)

### Code-Stil
- Backend: type-hints überall (`mypy --strict`), async-first, `_LOGGER = logging.getLogger(__name__)`, niemals `print()`
- Frontend: Lit + TS strict, HA-Theme-Variablen statt Farb-Literale (siehe `frontend/src/styles/tokens.ts`)
- Cognitive Complexity ≤ 15 pro Funktion (Sonar-Default), bei Verstoß in benannte Helfer extrahieren — niemals `# noqa`

### Was du NICHT tust
- Niemals `git reset --hard`, `rm -rf`, `git push --force` ohne explizite User-Bestätigung
- Niemals `git push --force` auf `main`
- Niemals Dependencies (Backend `requirements`, Frontend `package.json`) ohne Abklärung erweitern

---

## 3. Backlog — empfohlene Reihenfolge

### Sprint A — Top-N-Konsistenz (Phase 8)
> Dokumentiert in `docs/messagehub_backlog.md` § „Bekannte UX-Bugs". Pattern: 5 Cards haben einen UI-Top-N-Selektor, der nichts bewirkt, weil der Backend-Call entweder das globale `_filters.topN` oder einen hardcodierten Wert nutzt.

| # | Iter-ID | Titel | Aufwand | Was zu tun ist |
|---|---|---|---|---|
| **1** | **TopN-1** | Trend-Card respektiert `topNTrend` | ~30 min | `getKnxStatsTrend(filters, this._filters.topNTrend)` (statt hardcoded `5`); Vitest-Smoke: `topNTrend=10` → 10 `top_increase`-Einträge im DOM. |
| **2** | **TopN-2** | Bursts/Long-Term/Sensitive-Audit nutzen card-spezifisches `limit` | ~60 min | 3 Cards: jeden API-Aufruf um `{...fXxx, limit: this._filters.topNXxx}` erweitern; pro Card ein Vitest. |
| **3** | **TopN-3** | Bus-Health Backend liest `limit` aus Query | ~60 min | Backend `KnxStatsBusHealthView.get` muss `limit` aus Query lesen (default 25, max 500); Frontend reicht `topNBusHealth` durch. Plus pytest, dass `limit` respektiert wird. |
| **4** | **TopN-4** | Heatmap-UI-Selektor (optional) | ~30 min | Nur falls User-Bedarf: `topNHeatmap` (default 10, max 30 wegen CSS-Grid). |

### Sprint B — Performance / Datenqualität
| # | Iter-ID | Titel | Aufwand | Wert |
|---|---|---|---|---|
| **5** | **Iter K** | Counter-basierter Source-Aggregat-Pfad | ~60 min | hoch — macht Source-Detail-Pane für Perioden > 48 h voll aussagekräftig (heute nur Live-Daten). |
| **6** | **Idx** | `idx_knx_findings_source` SQLite-Index | ~15 min | bedingt — nur bei > 100k Rows messbar. |

### Out-of-scope (xknx-blocked)
| Code | Item | Blocker |
|---|---|---|
| F4 | echte Repeat/NACK/BUSY-Statistik | xknx muss Layer-2-Frames durchreichen |
| F9 | Hop-Counter | dito |
| F10 | Adresskonflikt | braucht Programmiermodus-Frames |

→ Nicht antasten, bis xknx das ergänzt.

### Empfohlene Reihenfolge
1. **TopN-1** (Quick-Win, klares Pattern, ~30 min) als Aufwärm-Iteration
2. **TopN-2** (3 ähnliche Cards in einem Schwung)
3. **TopN-3** (erste Iteration mit Backend+Frontend in dieser Sprint-Phase)
4. **Iter K** (höchster User-Wert)
5. Rest nach User-Priorität

---

## 4. Setup-Notizen (wichtig für die Tooling-Umgebung)

### Pytest-Tooling
Das System hat `pytest` über `uv tool` installiert in `/root/.local/share/uv/tools/pytest/`. Wenn `ImportError: No module named 'aiosqlite'` o. ä. auftritt:
```bash
uv tool install pytest --with aiosqlite --with jsonpath-ng --with pytest-asyncio --with aiohttp --reinstall
```

### Frontend
```bash
cd frontend
npm install   # falls node_modules fehlt
npm run typecheck && npx vitest run && npm run build
```

### Docker / E2E
Docker-Daemon ist NICHT verfügbar in der Sandbox — `docker compose` schlägt fehl. Playwright-Browser-Bundle ist nicht installiert.
- **Konsequenz**: Playwright-Tests in `e2e/audit/` sind nur „statisch vorbereitet" — du kannst sie pflegen (z. B. `test.fixme` → `test` umstellen), aber NICHT ausführen.
- Alle UI-Tests laufen über Vitest+jsdom (`frontend/tests/*.test.ts`) — das ist das Mittel der Wahl.

### Hash-State zwischen Tests aufpassen
Seit Iter +11 (F-010) modifizieren mehrere Komponenten `window.location.hash`. In `beforeEach` immer `window.history.replaceState(null, "", "/")` aufrufen, sonst „leakt" der Hash zwischen Tests.

---

## 5. Wichtige Code-Stellen

### Backend
- `custom_components/messagehub/api/messages.py` — alle View-Klassen + `async_register_views`
- `custom_components/messagehub/api/findings.py` — KNX-Findings-Endpoints
- `custom_components/messagehub/api/knx.py` — KNX-Adressen-Endpoints
- `custom_components/messagehub/api/knx_stats.py` — KNX-Stats-Endpoints (relevant für Top-N-Sprint)
- `custom_components/messagehub/api/_helpers.py` — `RequireAdminView`, `_audit`, `_get_database`, `parse_int_param`
- `custom_components/messagehub/processing/findings_service.py` — Service-Layer für Findings
- `custom_components/messagehub/storage/` — Repositories
- `custom_components/messagehub/processing/rate_limit.py` — Token-Bucket für Endpoint-Limiter

### Frontend
- `frontend/src/api-client.ts` — alle HTTP-Calls (Single Source of Truth — keine direkten `fetch()` in Komponenten!)
- `frontend/src/messagehub-panel.ts` — Hauptpanel, Top-Tab-Routing (`#messages|#stats|#settings|#audit`)
- `frontend/src/components/stats-view.ts` — Stats-Sub-Tab-Container mit Hash-Routing
- `frontend/src/components/stats-knx-view.ts` — DIE GROSSE Komponente (~2500 LOC) — hier liegen die TopN-Bugs!
- `frontend/src/components/settings-view.ts` — Settings-Sub-Tab-Container
- `frontend/src/components/findings-view.ts` — Findings-UI mit Ack/Unack
- `frontend/src/components/simple-list-view.ts` — MQTT/Heartbeats/Remediation (alle 3 mit Inline-Edit)
- `frontend/src/styles/tokens.ts` — HA-Theme-Tokens

### Tests
- Audit-Sprint-Tests: `tests/unit/test_*_endpoint.py`, `tests/unit/test_heartbeat_lifecycle.py`, etc.
- Bestehende Top-N-Tests (Vorbild für TopN-Sprint): `frontend/tests/stats-knx-table.test.ts`, `top-sender-sort.test.ts`

---

## 6. Beispiel-Iteration (TopN-1, in Pseudocode)

```text
1. TodoWrite: ["TopN-1: Test schreiben (rot)", "TopN-1: Frontend-Fix", "TopN-1: Quality-Gates", "TopN-1: Commit"]

2. Test zuerst — frontend/tests/trend-topn.test.ts:
   - Mock-API liefert top_increase mit 10 Einträgen
   - Mount stats-knx-view, setze _filters.topNTrend = 10
   - Asseriere: 10 Trend-Increase-Rows im DOM
   - Test ist ROT (Frontend hardcoded `5`)

3. Frontend-Fix in stats-knx-view.ts:
   getKnxStatsTrend(filters, 5) → getKnxStatsTrend(filters, this._filters.topNTrend)

4. Test grün, npx vitest run alles grün, npm run typecheck, npm run build
   → frontend_dist/messagehub-panel.js committen

5. CHANGELOG.md unter [Unreleased]:
   ### Geaendert
   - Iter topn-1 — Trend-Card respektiert UI-Top-N-Selektor.
     Vorher hardcoded top_n=5, jetzt this._filters.topNTrend.

6. git commit -m "fix(stats-knx): Trend-Card respektiert topNTrend (Phase 8 / topn-1)
   ...
   Iteration: topn-1
   https://claude.ai/code/session_<id>"

7. User-Test-Check: 'User wählt im Trend-Card-Selektor 10 → sieht 10 Top-Increase-Einträge.'
```

---

## 7. Was du am Ende des Sprints tun sollst

1. Alle TodoWrite-Items abgehakt
2. CHANGELOG.md unter `[Unreleased]` enthält pro Iter einen Eintrag
3. `git push origin main` (Direkt-Push ist erlaubt, da der vorherige Maintainer das so macht; KEIN force push)
4. Kurzer Abschluss-Report an den User: Was wurde umgesetzt, Test-Counts, was bleibt noch im Backlog

---

## 8. Quick-Reference: Häufige Befehle

```bash
# Pytest (vom Repo-Root)
pytest tests/unit/ -q

# Frontend Komplett-Check (vom Repo-Root)
cd frontend && npm run typecheck && npx vitest run && npm run build && cd ..

# Einzelnen Vitest-Test laufen lassen
cd frontend && npx vitest run tests/<datei>.test.ts

# Einzelnen Pytest laufen lassen
pytest tests/unit/test_<name>.py -q

# Git status / log
git status --short
git log --oneline -10
```

---

**Viel Erfolg.** Halte dich an TDD, halte dich an die Quality-Gates, und frag den User bei Architektur-Entscheidungen. Die vorhergehende Session hat ~3500 LOC an Tests + Code in 11 sauberen Commits geschrieben — das Pattern ist da, du musst nur durchziehen.

Wenn du irgendwo unsicher bist: lies erst `CLAUDE.md` und das nächst-relevante Dokument unter `docs/`, **bevor** du Code änderst.
