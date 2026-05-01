#!/usr/bin/env bash
# scripts/start.sh
#
# One-Stop-Start fuer die messagehub-Entwicklung:
#   1. prueft Voraussetzungen (Python 3.12+, Docker, docker compose)
#   2. legt eine venv .venv/ an, falls nicht vorhanden
#   3. installiert Test- und Tooling-Dependencies (idempotent)
#   4. fuehrt optional die Unit-Tests als Smoke-Test aus
#   5. startet die Dev-HA auf http://localhost:8124
#   6. wartet auf den healthy-Status und gibt die naechsten Schritte aus
#
# Optionen:
#   --no-tests    Smoke-Tests ueberspringen
#   --reset       Dev-HA-Konfiguration loeschen, frischer HA-Onboarding-Flow
#   --logs        nach dem Start direkt in den Log-Tail wechseln
#   -h | --help   diese Hilfe anzeigen
#
# Beispiele:
#   bash scripts/start.sh
#   bash scripts/start.sh --reset --logs
#   bash scripts/start.sh --no-tests

set -euo pipefail

# ── Farben ─────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

step() { echo -e "${GREEN}→${NC} ${BOLD}$*${NC}"; }
info() { echo -e "${BLUE}ℹ${NC}  $*"; }
warn() { echo -e "${YELLOW}!${NC}  $*"; }
fail() { echo -e "${RED}✗${NC}  $*" >&2; exit 1; }

usage() {
  sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
}

# ── Args ───────────────────────────────────────────────────────────────────────
RUN_TESTS=1
RESET_HA=0
TAIL_LOGS=0
for arg in "$@"; do
  case "$arg" in
    --no-tests) RUN_TESTS=0 ;;
    --reset)    RESET_HA=1 ;;
    --logs)     TAIL_LOGS=1 ;;
    -h|--help)  usage ;;
    *)          fail "Unbekannte Option: $arg (--help fuer Hilfe)" ;;
  esac
done

# ── In Repo-Wurzel wechseln ────────────────────────────────────────────────────
cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"
COMPOSE_FILE="docker-compose.dev.yml"

[ -f "$COMPOSE_FILE" ] || fail "$COMPOSE_FILE nicht gefunden — bist du im Repo-Root?"

echo
echo -e "${BOLD}messagehub Dev-Start${NC}  (${REPO_ROOT})"
echo

# ── 1. Prerequisites ───────────────────────────────────────────────────────────
step "pruefe Voraussetzungen"

PYTHON_BIN=""
for cand in python3.13 python3.12 python3; do
  if command -v "$cand" >/dev/null 2>&1; then
    ver=$("$cand" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    major=${ver%%.*}
    minor=${ver##*.}
    if [ "$major" -eq 3 ] && [ "$minor" -ge 12 ]; then
      PYTHON_BIN="$cand"
      info "Python:        $cand ($ver)"
      break
    fi
  fi
done
[ -n "$PYTHON_BIN" ] || fail "Python 3.12 oder neuer benoetigt (gefunden: keiner)"

command -v docker >/dev/null 2>&1 || fail "docker nicht gefunden"
info "Docker:        $(docker --version)"

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
  info "Compose:       $(docker compose version --short 2>/dev/null || echo 'plugin')"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
  warn "nutze legacy docker-compose ($(docker-compose --version))"
else
  fail "weder 'docker compose' noch 'docker-compose' verfuegbar"
fi

# ── 2. venv ────────────────────────────────────────────────────────────────────
if [ ! -d .venv ]; then
  step "lege virtualenv .venv/ an ($PYTHON_BIN)"
  "$PYTHON_BIN" -m venv .venv
else
  info "virtualenv .venv/ existiert bereits"
fi

# shellcheck source=/dev/null
source .venv/bin/activate

# ── 3. Dependencies ────────────────────────────────────────────────────────────
step "installiere Dev-Dependencies (requirements_dev.txt)"
python -m pip install --quiet --upgrade pip
pip install --quiet -r requirements_dev.txt

if [ -f .pre-commit-config.yaml ]; then
  step "installiere pre-commit-Hooks"
  pre-commit install --install-hooks >/dev/null 2>&1 || warn "pre-commit install fehlgeschlagen (ueberspringe)"
fi

# ── 4. Smoke-Tests (optional) ──────────────────────────────────────────────────
if [ "$RUN_TESTS" -eq 1 ]; then
  step "fuehre Unit-Tests aus (Smoke-Test, --no-tests zum Ueberspringen)"
  if pytest tests/unit -q --override-ini="asyncio_mode=auto"; then
    info "Unit-Tests gruen"
  else
    fail "Unit-Tests rot — bitte erst fixen, bevor die Dev-HA startet"
  fi
fi

# ── 5. Reset (optional) ────────────────────────────────────────────────────────
if [ "$RESET_HA" -eq 1 ]; then
  step "reset Dev-HA: stoppe Container und loesche .dev/ha-config"
  $COMPOSE -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
  rm -rf .dev/ha-config
fi

mkdir -p .dev/ha-config

# ── 6. Dev-HA starten ──────────────────────────────────────────────────────────
step "starte Dev-HA-Container"
$COMPOSE -f "$COMPOSE_FILE" up -d

# ── 7. auf healthy warten ──────────────────────────────────────────────────────
step "warte auf healthy-Status (max 90 s)"
ready=0
for i in $(seq 1 45); do
  status=$(docker inspect --format='{{.State.Health.Status}}' ha-messagehub-dev 2>/dev/null || echo "starting")
  if [ "$status" = "healthy" ]; then
    ready=1
    break
  fi
  printf '.'
  sleep 2
done
echo

if [ "$ready" -eq 1 ]; then
  info "Dev-HA ist bereit"
else
  warn "Dev-HA nicht innerhalb 90 s healthy — pruefe Logs:  $COMPOSE -f $COMPOSE_FILE logs -f"
fi

# ── 8. naechste Schritte ───────────────────────────────────────────────────────
cat <<EOF

${GREEN}${BOLD}✓ Setup abgeschlossen${NC}

  Dev-HA:     ${BOLD}http://localhost:8124${NC}
  Container:  ha-messagehub-dev   ($COMPOSE -f $COMPOSE_FILE ps)
  DB-Pfad:    .dev/ha-config/messagehub/messages.db (nach erstem Start)

Naechste Schritte:
  1. http://localhost:8124 oeffnen, HA-Onboarding durchlaufen
  2. Einstellungen → Geraete & Dienste → Integration hinzufuegen → "Message Hub"
  3. Entwicklertools → Dienste → "messagehub.add_message" testen

Nuetzliche Kommandos:
  pytest                       # alle Tests
  ruff check . && ruff format --check .
  mypy custom_components/messagehub
  bash scripts/restart-ha.sh   # HA neu starten (nach Backend-Aenderungen)
  $COMPOSE -f $COMPOSE_FILE logs -f   # Live-Logs
  $COMPOSE -f $COMPOSE_FILE down      # Dev-HA stoppen

EOF

# ── 9. Logs (optional) ─────────────────────────────────────────────────────────
if [ "$TAIL_LOGS" -eq 1 ]; then
  step "tailing logs (Strg-C beendet nur den Tail, HA laeuft weiter)"
  exec $COMPOSE -f "$COMPOSE_FILE" logs -f --tail=80 homeassistant
fi
