# Repo-Kontext fuer Claude Code

## Projekt
Home Assistant Custom Integration `messagehub`. Architektur-Spec:
`docs/messagehub_konzept.md`. User-Doku: `README.md` +
`docs/configuration.md`. Release-Historie: `CHANGELOG.md`.

## Wichtigste Regeln
- **TDD verbindlich** — fuer jede Verhaltensaenderung erst Test, dann Code.
  Tests muessen vor dem Commit gruen sein.
- Jede Iteration <= 60 min inkl. Tests.
- **Quality Gates** als harte Bedingungen pro Iteration:
  1. Backend: `pytest -q` gruen, `mypy --strict` clean, `ruff` clean
  2. Frontend: `npm run typecheck`, `npm test`, `npm run build` jeweils gruen
  3. HACS-bundle (`custom_components/messagehub/frontend_dist/`) im Commit
- **Conventional Commits**: `feat`, `fix`, `refactor`, `chore`, `docs`,
  `test`, `ci`, `build` — Subject <= 72 Zeichen, dt./engl. konsistent
  pro Commit, Footer mit `Iteration: N`.
- **Niemals** `git reset --hard`, `rm -rf` ohne explizite User-Bestaetigung.

## Code-Stil Backend
- Type-Hints ueberall (`mypy --strict`)
- Async-First (`asyncio`, `aiosqlite`)
- Keine globalen Singletons; `hass.data[DOMAIN]` als Container
- Logging: `_LOGGER = logging.getLogger(__name__)`, niemals `print()`
- Strings fuer UI ueber `translations/`, nicht hartkodiert
- Konstanten in `const.py`, keine Magic Strings
- Cognitive Complexity pro Funktion <= 15 (Sonar-Default).
  Bei Verstoss: in benannte Helfer extrahieren, nicht `# noqa`.

## Code-Stil Frontend
- Lit + TypeScript strict mode
- Komponenten in eigener Datei pro Klasse
- HA-Theme-Variablen (`var(--primary-text-color)`) statt Farb-Literale —
  zentral in `frontend/src/styles/tokens.ts` definiert
- Keine externen UI-Libs ausser Lit selbst
- `position: fixed`-Popovers + Backdrop-Overlay statt
  `document.click`-Listener (Race-frei in Shadow-DOM)

## Test-Stil
- Arrange / Act / Assert klar getrennt
- Test-Namen: `test_<verb>_<condition>_<expected>`
- Async-Tests mit `@pytest.mark.asyncio`
- Fixtures in `tests/conftest.py` zentral
- Frontend-Tests mit jsdom in `frontend/tests/*.test.ts`

## Git
- Conventional Commits, Footer mit `Iteration: N`
- Niemals `git push --force` auf main
- Vor jedem Tag-Push: `manifest.json` Version stimmt mit Tag ueberein,
  `frontend_dist/messagehub-panel.js` ist im Commit

## Build / Release
- Frontend: `npm run build --prefix frontend` legt das Bundle direkt in
  `custom_components/messagehub/frontend_dist/` ab — wird committed,
  weil HACS keinen Build-Step hat
- Cache-Buster: `_async_register_panel` haengt `?v=<mtime>` an die
  module_url, damit Browser nach Rebuild automatisch neu laden
- Release: `manifest.json:version` bumpen, `CHANGELOG.md` erweitern,
  Tag setzen (`git tag -a vX.Y.Z`), pushen — der `release.yml`-
  Workflow validiert hassfest+HACS und legt das GitHub-Release an
