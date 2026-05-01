# Repo-Kontext fuer Claude Code

## Projekt
Home Assistant Custom Integration `messagehub`. Spec siehe `docs/messagehub_konzept.md`
und `docs/messagehub_erweiterungen.md`. Master-Plan: `claude-code-runbook.md`.

## Wichtigste Regeln
- TDD verbindlich, siehe `claude-code-runbook.md` §0
- Jede Iteration <= 60 min inkl. Tests
- Quality Gates aus §4 sind harte Bedingungen
- Commits nach Conventional-Commits-Convention §3.3
- Niemals `git reset --hard`, `rm -rf` ohne `iter-N-pre`-Tag

## Code-Stil Backend
- Type-Hints ueberall (`mypy --strict`)
- Async-First (`asyncio`, `aiosqlite`)
- Keine globalen Singletons; `hass.data[DOMAIN]` als Container
- Logging: `_LOGGER = logging.getLogger(__name__)`, niemals `print()`
- Strings fuer UI ueber `translations/`, nicht hartkodiert
- Konstanten in `const.py`, keine Magic Strings

## Code-Stil Frontend
- Lit + TypeScript strict mode
- Komponenten in eigener Datei pro Klasse
- HA-Theme-Variablen (`var(--primary-text-color)`) statt Farb-Literale
- Keine externen UI-Libs ausser Lit selbst

## Test-Stil
- Arrange / Act / Assert klar getrennt
- Test-Namen: `test_<verb>_<condition>_<expected>`
- Async-Tests mit `@pytest.mark.asyncio`
- Fixtures in `tests/conftest.py` zentral

## Git
- Conventional Commits, Footer mit Iteration / Duration / Coverage
- Niemals `git push --force` auf main

## Reviews
- Wenn unklar, ob Scope erfuellt: in `BLOCKERS.md` eintragen, nicht raten
