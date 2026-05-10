# Cleanup-Iteration 00 — Baseline-Reparatur: Plan

**Datum:** 2026-05-10
**Branch:** `claude/project-cleanup-quality-LQaFC`
**Phase:** 3 (Plan & Bestaetigung)

## Ziel

Quality-Gates aus CLAUDE.md auf gruen bringen, damit Iter 01 (Sicherheits-
Quickwins) starten kann. Minimal-invasive Aenderungen, **keine
Funktionsaenderungen**, jede Aenderung in eigenem atomarem Commit.

## Out-of-Scope (verschoben)

- **F-00-03 Punkt 3** (Produktiv-Import-Pfad in
  `processing/findings/__init__.py`) — eigener PR mit Code-Aenderungs-
  Bestaetigung. Wird hier per `mypy.overrides` voruebergehend ignoriert.
- **F-00-06 vollstaendiger Versions-Audit** — Iter 02. Hier nur
  Mini-Pinning auf installierte Versionen.

## Schritte (jeder = ein Commit)

### Schritt 1 — Integration-Test-Fixture (F-00-01)

**Datei:** `tests/integration/conftest.py`
**Aenderung:** Autouse-Fixture, die `http`-Component vor jedem Integration-
Test setzt (Manifest-Dependency, in pytest-haskell aber nicht auto-aktiv).

**Diff-Skizze:**
```python
# tests/integration/conftest.py
"""Pytest-Fixtures fuer HA-Integration-Tests."""

from __future__ import annotations

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component


@pytest.fixture(autouse=True)
def _auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Aktiviert das Laden von custom_components fuer alle HA-Tests automatisch."""
    return


@pytest.fixture(autouse=True)
async def _setup_manifest_dependencies(hass: HomeAssistant) -> None:
    """manifest.json deklariert dependencies=[http, frontend, webhook].
    Produktiv-HA laedt diese vor async_setup_entry; pytest-homeassistant-
    custom-component tut das nicht von selbst. Wir setzen 'http' und
    'webhook' auf — 'frontend' ist fuer reine Service/View-Setup-Tests
    nicht noetig (waere transitiv via http.frontend, ist hier zu schwer)."""
    assert await async_setup_component(hass, "http", {})
```

**Verifikation:** `pytest tests/integration -q` → 8 passed.

**Risiko:** sehr gering. Test-Only-Aenderung. Beruehrt keinen Produktiv-Code.

**Commit-Message:**
```
test(integration): setup http component in autouse fixture

manifest.json deklariert dependencies=[http, frontend, webhook].
In Produktiv-HA werden diese vor async_setup_entry geladen, in
pytest-homeassistant-custom-component 0.13.316 nicht — Folge waren
8/8 fehlgeschlagene Integration-Tests mit `hass.http is None`.

Iteration: 00
```

---

### Schritt 2 — Frontend-Race-Test-Stub vervollstaendigen (F-00-02)

**Datei:** `frontend/tests/stats-knx-load-race.test.ts`
**Aenderung:** `getKnxStatsBusload`-Stub um `summary`-Feld erweitern,
damit `_renderKpis` waehrend Race-State nicht auf `undefined.max_pct`
zugreift.

**Diff-Skizze:**
```ts
getKnxStatsBusload: async () => ({
  buckets: [],
  from: "",
  to: "",
  summary: { max_pct: 0, avg_pct: 0, current_pct: 0 },
}),
```

(Exakte Felder via Type `BusloadResponse` aus `api-client.ts` ableiten.)

**Verifikation:** `npm test -- --run` → Exit 0, keine Unhandled Rejection.

**Risiko:** sehr gering. Test-Stub-Vervollstaendigung. Keine Produktiv-
TS-Aenderung.

**Commit-Message:**
```
test(frontend): complete getKnxStatsBusload stub in race test

Race-Test `stats-knx-load-race.test.ts` lieferte Stub ohne
`summary`-Feld — render() warf TypeError waehrend des Race-States.
Tests passten zwar, npm test exit-code war aber 1.

Iteration: 00
```

---

### Schritt 3 — mypy: geoip2 ignorieren + python_version=3.13 (F-00-03 Teil 1+2+4)

**Datei:** `pyproject.toml`
**Aenderungen:**
1. `[tool.mypy] python_version` von `"3.12"` auf `"3.13"` heben.
   Begruendung: HA 2026.2.3 in `requirements_dev.txt` nutzt PEP 696
   (Type Parameter Defaults) — py3.12-mypy parsed das nicht.
   DEVELOPMENT.md schreibt 3.13 als Primary-Dev-Target;
   `pyproject:requires-python = ">=3.12"` bleibt unveraendert.
2. `[[tool.mypy.overrides]] module = "geoip2.*" ignore_missing_imports = true` —
   geoip2 ist optional (nicht im manifest), DB-Datei wird zur Laufzeit
   geprueft (`processing/geoip.py`).

**Diff-Skizze:**
```toml
[tool.mypy]
python_version = "3.13"   # vorher: "3.12"
strict = true
# ... Rest unveraendert ...

[[tool.mypy.overrides]]
module = "geoip2.*"
ignore_missing_imports = true
```

**Verifikation:** `mypy custom_components/messagehub` → 1 Fehler verbleibt
(F-00-03 Punkt 3, im Backlog dokumentiert) → **STOP** + Bestaetigung
fuer Schritt 4.

**Risiko:** mittel. python_version-Bump auf 3.13:
- CI-Matrix testet 3.12 + 3.13. Mypy-Lauf nur in der 3.13-Job-Variante
  (oder beide?). Die CI laeuft `mypy custom_components/messagehub` ohne
  Versions-Override. Mypy benutzt `[tool.mypy] python_version` aus
  pyproject — also einheitlich 3.13. Tests selbst laufen weiter auf 3.12.
- Risiko: 3.12-spezifische Imkompatibilitaeten (`from typing import Self`
  vs. `typing_extensions`) wuerden uebersehen. Pruefung: kein Code in
  `custom_components/messagehub/` nutzt 3.13-only-Syntax.

**Commit-Message:**
```
build(mypy): pin python_version=3.13 + ignore geoip2 imports

- HA 2026.2.3 nutzt PEP 696 (py3.13) im installed package; mypy mit
  python_version=3.12 konnte config_entries.py:384 nicht parsen.
- DEVELOPMENT.md schreibt py3.13 als Primary; 3.12 bleibt CI-Matrix-
  Element fuer Tests, aber Type-Check-Target ist 3.13.
- geoip2 ist optionale Runtime-Dep (manifest.json fuehrt sie nicht);
  geoip-Resolver ist runtime-defensiv. Stub-Imports per overrides
  ausblenden.

Verbleibend: F-00-03 Punkt 3 (Produktiv-Import-Pfad) — separater PR.

Iteration: 00
```

---

### Schritt 4 — F-00-03 Punkt 3 (Import-Pfad) — **ZUSAETZLICHE BESTAETIGUNG NOETIG**

**STOP-Bedingung erreicht:** Produktiv-Code-Aenderung.

**Datei:** `custom_components/messagehub/processing/findings/__init__.py`
**Beobachtung:** `from messagehub.processing.findings.knx_stats import ...`
oder aehnlich. Wir muessten das auf `from .knx_stats import ...`
oder `from custom_components.messagehub.processing.findings.knx_stats import ...`
korrigieren.

**Wichtig:** Vor diesem Schritt wird gefragt. Falls abgelehnt, bleibt
F-00-03 Punkt 3 als Backlog-Eintrag und mypy meldet 1 Fehler — was
**immer noch nicht "clean"** ist und damit Quality-Gate-Verletzung.
Mit Backlog-Verweis ist es "akzeptierter Schmerz" fuer Iter 01.

---

### Schritt 5 — `ruff check . --fix` (F-00-04)

**Aenderung:** Ueber `ruff check . --fix` 64 Auto-Fixes.

**Verifikation:** `ruff check .` → 0 oder 3 verbleibende manuelle Issues.
Bei 3 verbleibenden: einzeln reviewen, **Bestaetigung pro manuellem Fix**.

**Risiko:** gering. Ruff-Auto-Fix beruehrt:
- `RUF100`: entfernt unused `# noqa`-Direktiven
- `I001`: sortiert Imports

Beides nicht-funktional. Aber 64 Auto-Fixes in ggf. vielen Dateien
machen den Diff schwer reviewbar.

**Commit-Message:**
```
style(ruff): auto-fix 64 RUF100/I001 issues

`ruff check . --fix` (ruff 0.15.12) entfernt ungenutzte noqa-
Direktiven und sortiert Imports. Keine Verhaltensaenderung.

Iteration: 00
```

---

### Schritt 6 — `ruff format .` (F-00-05)

**Aenderung:** 118 Dateien reformatieren.

**Verifikation:** `ruff format --check .` → clean.

**Risiko:** mechanisch, keinerlei Verhaltensaenderung. **Aber** der
Diff wird gross — Reviewbarkeit leidet. Das wird im PR-Body explizit
als Mass-Format markiert.

**Commit-Message:**
```
style(ruff): format 118 files with ruff 0.15.12

`ruff format .` bringt das Repo auf den Format-Stand der aktuell
installierten ruff-Version. Pre-commit pinnt ruff-pre-commit@v0.6.9,
CI installiert ruff>=0.6 (resolved 0.15.12) — der Drift fuehrte
zu CI-Failure ohne lokale Sicht. Schritt 7 pinnt die Versionen.

Reformat ist rein syntaktisch (Linebreaks, Quotes), kein Code-
Verhalten geaendert.

Iteration: 00
```

---

### Schritt 7 — Versions-Pinning (F-00-06 minimal)

**Datei:** `requirements_dev.txt` und/oder `.pre-commit-config.yaml`
**Aenderung:** Pinning der aktuell installierten/funktionierenden
Versionen, damit CI und lokaler pre-commit identisch laufen.

**Vorschlag:**
```diff
# requirements_dev.txt
-ruff>=0.6
-mypy>=1.10
+ruff==0.15.12
+mypy==2.0.0
```
und
```diff
# .pre-commit-config.yaml
   - repo: https://github.com/astral-sh/ruff-pre-commit
-    rev: v0.6.9
+    rev: v0.15.12
```

**Verifikation:** Lokaler `pre-commit run --all-files` clean.

**Risiko:** sehr gering. Doku-/Konfig-Aenderung. Pinning macht
Reproduzierbarkeit besser; loesere Constraints bleiben Iter 02 vorbehalten.

**Commit-Message:**
```
build(deps): pin ruff==0.15.12 and mypy==2.0.0

requirements_dev.txt hatte loose `>=`-Pins, .pre-commit-config.yaml
pinnte ruff-pre-commit@v0.6.9. CI und lokale pre-commit-Hooks
liefen damit auf unterschiedlichen ruff-Versionen mit drift-bedingten
Format-Diffs. Konsolidierung auf 0.15.12 / 2.0.0 (= aktuell installierte
Versionen). Vollstaendiger Versions-Audit folgt in Iter 02.

Iteration: 00
```

---

## Verifikations-Sequenz

Nach **jedem** Schritt:
```bash
source .venv/bin/activate
pytest -q                                   # voll
mypy custom_components/messagehub
ruff check . && ruff format --check .
( cd frontend && npm run typecheck && npm test -- --run && npm run build )
git diff --stat custom_components/messagehub/frontend_dist/  # leer
```

Erst wenn ALLE gruen sind, ist die Iteration fertig.

## Reihenfolge & Atomaritaet

| # | Commit | Reversibel? | Bestaetigung vor Schritt? |
|---|---|---|---|
| 1 | test(integration): http fixture | ja, `git revert` | ja (vor Phase 4 generell) |
| 2 | test(frontend): stub completion | ja | ja |
| 3 | build(mypy): pin py3.13 + geoip2 | ja | ja, mit Hinweis zu py-Version-Risiko |
| 4 | (Out-of-Scope) Import-Pfad-Fix | — | **Extra-Bestaetigung**, sonst Skip |
| 5 | style(ruff): auto-fix | ja | ja, Diff reviewen |
| 6 | style(ruff): format 118 files | ja | ja, **gross**er Diff vorab pruefen |
| 7 | build(deps): pin versions | ja | ja |

Niemals zwei Schritte in einem Commit.
Niemals weitergehen bei rotem Test/Lint nach einem Schritt — sofort STOP.

## Erwarteter Endzustand

| Gate | Erwartet |
|---|---|
| pytest | 1476+ tests passed (1 xfailed bleibt — Security-Finding fuer Iter 01) |
| mypy | clean (oder 1 verbleibend, dokumentiert) |
| ruff check | clean |
| ruff format --check | clean |
| frontend typecheck | clean |
| frontend test | exit 0, keine Unhandled Rejection |
| frontend build | clean |
| bundle consistency | clean |

## Bestaetigung

Ich starte Phase 4 (Schreiben) **erst** nach expliziter Freigabe dieses
Plans. Innerhalb von Phase 4 hole ich vor jedem Schritt zusaetzliche
Bestaetigung ein, weil die einzelnen Aenderungen (insbesondere Schritt 4,
6) substantielle Diffs sind.
