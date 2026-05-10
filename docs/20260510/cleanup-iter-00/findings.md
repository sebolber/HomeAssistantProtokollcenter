# Cleanup-Iteration 00 — Baseline-Reparatur: Findings

**Datum:** 2026-05-10
**Branch:** `claude/project-cleanup-quality-LQaFC`
**Phase:** 2 (Findings — read-only)

## Kontext

Iter 00 ist eine **Iron-Rule-#1-Ausnahme**: Tests werden aenderbar, weil die
Pre-Iteration-Bedingung „alle Tests gruen" sonst nie erreicht wird.
Der Merge `4bdeae6` (PR #1) wurde mit roten CI-Checks gemerged. Diese
Iteration repariert die Baseline, **bevor** die regulaere Cleanup-Reihe
(Iter 01–10) starten kann.

User-Freigabe: explizite Bestaetigung „Iter 0: Baseline reparieren (eigener PR)".

## Zustand der Quality Gates (CLAUDE.md)

| Gate | Soll | Ist | Erfuellt |
|---|---|---|---|
| `pytest -q` | gruen | 6 failed, 2 errors in `tests/integration/` | ❌ |
| `mypy --strict custom_components/messagehub` | clean | 4 Fehler in 3 Dateien | ❌ |
| `ruff check .` | clean | 67 Fehler (64 auto-fixable) | ❌ |
| `ruff format --check .` | clean | 118 Dateien wuerden reformatiert | ❌ |
| `npm run typecheck` (frontend) | gruen | clean | ✅ |
| `npm test` (frontend) | gruen | 406/406 passed, **Exit 1** wegen Unhandled Rejection | ❌ |
| `npm run build` (frontend) | gruen | clean | ✅ |
| Frontend-Bundle-Konsistenz | identisch | `git diff custom_components/messagehub/frontend_dist/` leer | ✅ |

GitHub-CI auf `4bdeae6` (Merge-Commit von PR #1):

| Check | Status |
|---|---|
| Backend tests (Python 3.12) | FAILURE |
| Backend tests (Python 3.13) | FAILURE |
| Frontend (typecheck + tests + bundle-consistency) | FAILURE |
| SonarCloud Code Analysis | FAILURE |
| Scan with SonarCloud | success |

## Findings im Detail

### F-00-01 — Integration-Tests: `hass.http is None`

**Was:** Alle 8 Tests in `tests/integration/test_init.py` und
`tests/integration/test_service_add_message.py` schlagen mit
`AttributeError: 'NoneType' object has no attribute 'register_view'` fehl.

**Wo:**
- `custom_components/messagehub/api/messages.py:1573` (`hass.http.register_view(view)`)
- aufgerufen aus `custom_components/messagehub/__init__.py:175` (`async_register_views(hass)`)
- in `async_setup_entry` der Integration

**Warum problematisch:**
- `manifest.json:dependencies` deklariert `["http", "frontend", "webhook"]`. In
  Produktiv-HA laedt der Loader diese Komponenten **vor** `async_setup_entry`.
  In `pytest-homeassistant-custom-component` 0.13.316 passiert das **nicht
  automatisch** — die Test-Fixture liefert `hass`, aber `hass.http is None`,
  bis der Test selbst `await async_setup_component(hass, "http", {})` ruft.
- Folge-Effekt im Teardown: `_connection_worker_thread` (von aiosqlite oder
  aiohttp) bleibt liegen, weil `async_setup_entry` mitten im Setup abbricht
  und die Cleanup-Hooks nicht durchlaufen.

**Risiko bei Reparatur:** Sehr gering. Test-Setup-Aenderung in
`tests/integration/conftest.py`. Beruehrt keinen Produktiv-Code.

**Vorschlag:** Autouse-Fixture in `tests/integration/conftest.py`, die `http`
und `webhook` (auch im Manifest deklariert) per `async_setup_component`
laedt, bevor der Test laeuft. `frontend` ist optional fuers reine
Service-/View-Setup.

```python
# tests/integration/conftest.py (Skizze)
import pytest
from homeassistant.setup import async_setup_component


@pytest.fixture(autouse=True)
async def _setup_http_component(hass):
    """Manifest-deklarierte 'http'-Dependency in Tests aufsetzen."""
    assert await async_setup_component(hass, "http", {})
    return None
```

### F-00-02 — Frontend: Unhandled Rejection in `stats-knx-load-race.test.ts`

**Was:** `npm test --run` liefert `406 passed (406)`, aber Exit-Code 1
wegen einer Unhandled Rejection waehrend des Test-Laufs.

**Wo:**
- Werfender Code: `frontend/src/components/stats-knx-view.ts:1289`
  ```ts
  const refPct = bl !== null ? bl.summary.max_pct : s.estimated_busload_pct;
  ```
- Trigger: `frontend/tests/stats-knx-load-race.test.ts` Stub fuer
  `getKnxStatsBusload`:
  ```ts
  getKnxStatsBusload: async () => ({ buckets: [], from: "", to: "" }),
  ```
  Es fehlt das `summary`-Feld, das die Production-API liefert.

**Warum problematisch:**
- `bl !== null` schuetzt nur vor `null`, nicht vor `bl.summary === undefined`.
  Der Stub mockt unvollstaendig; im Race-Szenario wird ein `render()` mit
  `_busload === { buckets: [], from: "", to: "" }` ausgefuehrt, bevor
  `_load()` den State korrekt verwirft.
- Die TS-Typ-Definition fuer `getKnxStatsBusload` verlangt vermutlich
  `summary` als required → Stub ist Type-Cast-getrickst.

**Risiko bei Reparatur:**
- Variante A (Test-Stub vervollstaendigen): trivial, 1 Zeile, keinerlei
  Produktiv-Code beruehrt.
- Variante B (Production-Defensivitaet `bl?.summary?.max_pct`):
  veraendert Render-Verhalten in Edge-Faellen — Iron-Rule #6
  (keine Funktionsaenderung) → tendenziell nein.

**Vorschlag:** Variante A — Stub um `summary: { max_pct: 0, ... }` erweitern.

### F-00-03 — mypy: 4 Errors

**Was:** `mypy --strict custom_components/messagehub` → Exit 2.

**Aufschluesselung:**

| # | Fehler | Ursache |
|---|---|---|
| 1 | `geoip2.database` not found | Optional-Dep `geoip2` ist nicht in `requirements_dev.txt` (manifest hat sie auch nicht — feature-flag-mae?ig optional) |
| 2 | `geoip2` not found | Gleicher Grund |
| 3 | `messagehub.processing.findings.knx_stats` not found | `custom_components/messagehub/processing/findings/__init__.py:30` importiert ohne Package-Prefix `custom_components.` |
| 4 | `homeassistant/config_entries.py:384`: Type parameter defaults py3.13+ | `[tool.mypy] python_version = "3.12"`, aber HA 2026.2.3 nutzt PEP 696 (py3.13-only) |

**Risiko bei Reparatur:**
- (1)+(2) `geoip2`: per `[[tool.mypy.overrides]] module = "geoip2.*" ignore_missing_imports = true` ausschliessen — null Risiko, kosmetisch.
- (3): falscher Import in Produktiv-Code (`processing/findings/__init__.py`). **STOP**: das ist eine Quellcode-Aenderung im Produktiv-Pfad. Iron-Rule #6. Muss separat geprueft werden — moeglich, dass es nur durch glueckliche `sys.path`-Lage bisher funktionierte.
- (4): `python_version` auf `"3.13"` heben. CI testet Matrix `["3.12", "3.13"]`. Ein Bump auf `"3.13"` macht mypy fuer 3.12 nachsichtiger? **Achtung**: das koennte 3.12-spezifische Inkompatibilitaeten verbergen. Alternativ: mypy-Version pinnen (mypy 2.0.0 ist sehr neu; vorher mag's funktioniert haben).

**Vorschlag:**
- (1)+(2): mypy.overrides hinzufuegen (Konfig, kein Code).
- (3): **vorab Investigation noetig** — moeglicherweise eigener Schritt mit
  zusaetzlicher Bestaetigung. Anders als die anderen Findings ist das
  moeglicher Produktiv-Code-Eingriff.
- (4): mypy `python_version = "3.13"` setzen, weil CI/Devcontainer/Spec
  alle 3.13 als primaer haben (DEVELOPMENT.md, pyproject `requires-python>=3.12`,
  CI-Matrix). Risiko-Hinweis fuer 3.12 in Findings-Backlog.

### F-00-04 — ruff check: 67 Fehler

**Was:** `ruff check .` → 67 issues, 64 auto-fixable.

**Verteilung (Sample):**
- `RUF100`: ungenutzte `# noqa` Direktiven (z. B. `# noqa: PLC0415` an
  Stellen, wo PLC0415 gar nicht greift)
- `I001`: Import-Reihenfolge in Test-Dateien

**Warum problematisch:**
- `ruff check` ist Quality-Gate per CLAUDE.md.
- Pre-commit pinnt `ruff-pre-commit` auf `v0.6.9`, requirements_dev.txt
  hat `ruff>=0.6` (loose). Lokal/CI installiert ist `ruff 0.15.12`.
  Zwischen 0.6.9 und 0.15.12 wurden RUF100-Regeln verschaerft.

**Risiko bei Reparatur:** `ruff check . --fix` macht 64 Auto-Fixes. Diese
betreffen nur `# noqa`-Direktiven (entfernen) und Import-Reihenfolge —
keine Verhaltensaenderung, kein Risiko. Die verbleibenden 3 manuellen
Fixes muessen einzeln bewertet werden.

**Vorschlag:** Erst `ruff check . --fix` laufen lassen, Diff reviewen, dann
die 3 manuellen Findings einzeln planen.

### F-00-05 — ruff format: 118 Dateien wuerden reformatiert

**Was:** `ruff format --check .` → 118 Dateien Diff.

**Warum problematisch:**
- Vermutlich gleicher Grund wie F-00-04: ruff-Version-Drift.
  `ruff 0.6.9` (pre-commit-pin) hat in Format-Spec leicht andere Defaults
  als 0.15.12. Z. B. wurden 2025 die Linebreaks bei langen Calls geaendert.
- Ohne stabile Version geht der Pre-Commit-Hook lokal anders aus als CI.

**Risiko bei Reparatur:**
- Variante A — `ruff format .` ausfuehren: reformat von 118 Dateien, riesiger
  Diff, aber rein syntaktisch und nicht-funktional.
- Variante B — ruff in `requirements_dev.txt` und `.pre-commit-config.yaml`
  auf identische Version pinnen (z. B. die aktuelle 0.15.12 oder die alte
  0.6.9). Dann nur die fuer diese Version tatsaechlich noetigen Fixes.

**Vorschlag:** Variante B mit aktueller Version (0.15.12). Pinnen, dann
die 118 Files reformatieren. Risiko: PR-Diff wird gross und schwer
reviewbar — aber Cleanup an sich ist mechanisch.

### F-00-06 — ruff/mypy/pre-commit Versions-Drift (Meta-Finding)

**Was:** Loose Version-Constraints in `requirements_dev.txt` (`ruff>=0.6`,
`mypy>=1.10`) lassen CI mit jeweils neuerer Version laufen, waehrend
`pre-commit-config.yaml` `ruff-pre-commit@v0.6.9` pinnt.

**Warum problematisch:** Reproduzierbarkeit. CI vs. lokaler pre-commit-Run
liefern unterschiedliche Ergebnisse. Das ist eine **systemische** Ursache
fuer F-00-04 und F-00-05.

**Vorschlag:** Versions-Pinning konsolidieren. Dieses Finding gehoert
strenggenommen in **Iter 02 (Dependency-Audit)**, beruehrt aber Iter 00
unmittelbar — daher hier dokumentiert. Fuer Iter 00 reicht ein **harter
Pin** auf die aktuell installierten Versionen (ruff 0.15.12, mypy 2.0.0),
damit CI nach Iter-00-Fixes reproduzierbar bleibt. Volle Reform spaeter.

## Out-of-Scope (in Backlog)

- F-00-03 Punkt (3): Import-Pfad in Produktiv-Code — separater PR mit
  expliziter Code-Aenderungs-Bestaetigung.
- Tieferer Tooling-Versions-Audit (F-00-06 voll) — Iter 02.
- xfail-Test `test_provider_config_repr_documents_state` (Security-Finding):
  → Iter 01 (Sicherheits-Quickwins) Scope.
- Bundle-Consistency-Verifikation: aktuell konsistent, Re-Build aendert
  ggf. nichts.

## Empfohlene Reparatur-Reihenfolge

1. F-00-01 (Integration-Tests): autouse-Fixture
2. F-00-02 (Frontend-Stub): 1-Zeilen-Fix
3. F-00-03 mypy (1, 2, 4): Konfig-Aenderungen, **ohne** den Import-Pfad-Fix (3) — der ist Out-of-Scope
4. F-00-04 (`ruff check --fix`): 64 Auto-Fixes
5. F-00-05 (`ruff format`): 118 Files reformatieren
6. F-00-06 (Versions-Pin): `requirements_dev.txt` aktualisieren

Jeder Schritt = eigener Commit. Nach jedem Schritt: Tests + Lint + Build.
