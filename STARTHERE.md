# ha-messagehub — Starter-Paket

Dieses Paket enthält alles, was du brauchst, um die Implementierung der
`messagehub` Home Assistant Custom Integration mit Claude Code zu starten.

## Was ist hier drin

| Datei / Ordner | Zweck |
|---|---|
| `docs/messagehub_konzept.md` | Fachliches Konzept (Architektur, Datenmodell, Frontend, Sicherheit) |
| `docs/messagehub_erweiterungen.md` | Erweiterungen mit Mapping auf Runbook-Iterationen |
| `claude-code-runbook.md` | **Master-Prompt** für Claude Code mit 48 Iterationen |
| `DEVELOPMENT.md` | Setup-Anleitung Schritt für Schritt |
| `.devcontainer/` | VS Code Dev Container Config |
| `.vscode/` | Editor-Settings + empfohlene Extensions |
| `scripts/dev-setup.sh` | One-Shot-Setup, idempotent |
| `scripts/restart-ha.sh` | Dev-HA neustarten + Logs |
| `docker-compose.dev.yml` | Parallele Dev-HA auf Port 8124 |
| `requirements_dev.txt` | Python Test- und Tooling-Dependencies |
| `.gitignore` | initial, deckt `.dev/` und Caches ab |

## Was du als nächstes tust

1. `git init && git add . && git commit -m "chore(meta): initial dev environment"`
2. `DEVELOPMENT.md` lesen und Variante A oder B durchführen
3. `docker compose -f docker-compose.dev.yml up -d` — Dev-HA läuft auf http://localhost:8124
4. Claude Code mit `claude-code-runbook.md` füttern, Iteration 1 anstoßen

Alles weitere (Code, Tests, Frontend, Translations, README, hacs.json) entsteht
in den 48 Iterationen.

## Was noch nicht hier ist

- `pyproject.toml`, `.pre-commit-config.yaml`, `manifest.json`, `hacs.json` — werden in Iteration 1 angelegt
- `custom_components/messagehub/` — wird in Iteration 1 angelegt
- `frontend/` — wird in Iteration 16 angelegt
- `README.md` (öffentlich, für HACS) — wird in Iteration 25 angelegt

Diese Bewusste-Lücken-Strategie sorgt dafür, dass Iteration 1 echte Arbeit
liefert und nicht nur Datei-Boilerplate kopiert.
