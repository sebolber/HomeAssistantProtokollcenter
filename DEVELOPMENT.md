# Development Setup

Dieses Dokument beschreibt, wie du die Entwicklungsumgebung für die `messagehub`-Integration einrichtest. Es ist die Voraussetzung dafür, dass Claude Code mit Iteration 1 (`claude-code-runbook.md` §6.1) starten kann.

## Architektur des Dev-Setups

```
┌─────────────────────────────────┐         ┌─────────────────────────────┐
│  Dev-Container / Dein Host      │         │  ha-messagehub-dev (Docker) │
│                                 │         │                             │
│  • Python 3.13 + pytest + ruff  │         │  Home Assistant stable      │
│  • Node 20 + Vite + Vitest      │         │  Port 8124 (Host)           │
│  • Claude Code                  │         │  Volume:                    │
│                                 │ ─────►  │   ./custom_components/...   │
│  Tests laufen hier              │  HTTP   │   → /config/custom_components│
│  (kein HA nötig dank            │  :8124  │                             │
│   pytest-homeassistant-...)     │         │  Persistenz: .dev/ha-config │
└─────────────────────────────────┘         └─────────────────────────────┘
                ▲
                │ kein Konflikt mit Produktiv-HA auf 8123
                └─ Produktive HA-Instanz bleibt unangetastet
```

## Variante A — VS Code Dev Container (empfohlen)

**Voraussetzung:** VS Code mit der Erweiterung *Dev Containers*, lokal laufender Docker.

1. Repo öffnen, „*Reopen in Container*" wählen
2. Erstes Build dauert ~3 Minuten, danach läuft `scripts/dev-setup.sh` automatisch
3. In Terminal:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```
4. http://localhost:8124 öffnen, Onboarding der Dev-HA durchlaufen
5. Bereit für Iteration 1

## Variante B — Lokale Python-Umgebung

**Voraussetzung:** Python 3.13, Node 20, Docker.

```bash
# 1. Virtualenv anlegen
python3.13 -m venv .venv
source .venv/bin/activate

# 2. Dev-Dependencies + Setup
bash scripts/dev-setup.sh

# 3. Dev-HA starten
docker compose -f docker-compose.dev.yml up -d

# 4. Status prüfen
docker compose -f docker-compose.dev.yml ps
```

## Tägliche Kommandos

| Aufgabe | Befehl |
|---|---|
| Backend-Tests | `pytest` |
| Tests mit Coverage | `pytest --cov=custom_components/messagehub --cov-report=term-missing` |
| Ruff Lint | `ruff check .` |
| Ruff Format | `ruff format .` |
| Type-Check | `mypy custom_components/messagehub` |
| Frontend-Tests | `cd frontend && npm test` |
| Frontend-Lint | `cd frontend && npm run lint` |
| Frontend-Build | `cd frontend && npm run build` |
| Pre-Commit (alle Files) | `pre-commit run --all-files` |
| Dev-HA neustarten | `bash scripts/restart-ha.sh` |
| Dev-HA-Logs | `docker compose -f docker-compose.dev.yml logs -f` |
| Quality Gates manuell | `bash scripts/quality-gate.sh` *(ab Iter. 1)* |

## Wichtige Hinweise

**HA reload-Verhalten.** Custom Components werden von HA *nicht* hot-reloaded. Nach Backend-Änderungen → `bash scripts/restart-ha.sh`. Frontend-Änderungen erfordern zusätzlich `cd frontend && npm run build`, da der Build-Output in `custom_components/messagehub/frontend_dist/` landet und auch dort ein Neustart die Datei neu lädt.

**Port 8124 statt 8123.** Bewusst gewählt, damit deine Produktiv-HA auf 8123 unangetastet bleibt. Wenn du diese Änderung anpassen willst: `docker-compose.dev.yml` und `.devcontainer/devcontainer.json` (`forwardPorts`).

**Reset Dev-HA.** Wenn du HA komplett zurücksetzen willst:
```bash
docker compose -f docker-compose.dev.yml down -v
rm -rf .dev/ha-config
docker compose -f docker-compose.dev.yml up -d
```

**MQTT-Broker.** Erst ab Iteration 37 nötig. Vorbereiteter Mosquitto-Eintrag liegt auskommentiert in `docker-compose.dev.yml`. Aktivieren bei Bedarf.

**KNX-Zugriff.** Die Dev-HA hat *keinen* Zugang zu deinem produktiven KNX-Bus. Iteration 48 (KNX-Anreicherung) wird mit Mock-Daten und einem CSV-Export aus ETS getestet, nicht mit Live-Bus.

## Nächster Schritt

Wenn `pytest` (auch ohne Tests) und `docker compose ps` beide grün sind, ist die Umgebung bereit. Dann Claude Code starten mit:

```bash
claude --prompt "$(cat <<'EOF'
Lies claude-code-runbook.md vollständig. Beginne mit Iteration 1 (§6.1).
Halte dich strikt an §0 Globale Arbeitsanweisung — sequenziell, ohne Rückfragen,
mit TDD und Quality Gates. Nach Iteration 48 stoppen.
EOF
)"
```

Oder im Chat-Modus die Datei einbinden und sagen: „Bearbeite das Runbook ab Iteration 1".
