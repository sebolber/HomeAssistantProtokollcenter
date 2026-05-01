#!/usr/bin/env bash
# scripts/dev-setup.sh
#
# Idempotentes One-Shot-Setup für die Entwicklungsumgebung.
# Wird vom devcontainer postCreateCommand und manuell ausgeführt.

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { echo -e "${GREEN}→${NC} $*"; }
warn() { echo -e "${YELLOW}!${NC} $*"; }

cd "$(dirname "$0")/.."

step "upgrading pip"
python -m pip install --upgrade pip --quiet

step "installing Python dev requirements"
pip install -r requirements_dev.txt --quiet

step "creating dev directories (git-ignored)"
mkdir -p .dev/ha-config

if [ -f .pre-commit-config.yaml ]; then
  step "installing pre-commit hooks"
  pre-commit install --install-hooks
else
  warn ".pre-commit-config.yaml fehlt — wird in Iteration 1 angelegt"
fi

if [ -d frontend ] && [ -f frontend/package.json ]; then
  step "installing frontend dependencies"
  (cd frontend && npm install --silent)
else
  warn "frontend/ existiert noch nicht — wird in Iteration 16 angelegt"
fi

step "checking docker availability"
if command -v docker >/dev/null 2>&1; then
  echo "  docker: $(docker --version)"
else
  warn "docker nicht verfügbar — Dev-HA-Container kann nicht gestartet werden"
fi

cat <<EOF

${GREEN}✓${NC} Dev-Setup abgeschlossen.

Schnellstart:
  pytest                                          # Backend-Tests
  ruff check .                                    # Lint
  mypy custom_components/messagehub               # Type-Check
  docker compose -f docker-compose.dev.yml up -d  # Dev-HA auf :8124 starten
  open http://localhost:8124                      # HA-Onboarding

Reset Dev-HA:
  docker compose -f docker-compose.dev.yml down -v
  rm -rf .dev/ha-config

EOF
