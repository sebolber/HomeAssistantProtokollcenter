#!/usr/bin/env bash
# scripts/start.sh
#
# One-Stop-Start fuer die messagehub-Entwicklung:
#   0. (optional) holt einen Branch aus origin und checkt ihn aus
#   1. prueft Voraussetzungen (Python 3.12+, Docker, docker compose) und
#      installiert Fehlendes nach (sudo erforderlich, mit Rueckfrage)
#   2. legt eine venv .venv/ an, falls nicht vorhanden
#   3. installiert Test- und Tooling-Dependencies (idempotent)
#   4. fuehrt optional die Unit-Tests als Smoke-Test aus
#   5. startet die Dev-HA auf http://localhost:8124
#   6. wartet auf den healthy-Status und gibt die naechsten Schritte aus
#
# Usage:
#   bash scripts/start.sh [BRANCH] [Optionen]
#
# Positional:
#   BRANCH        optional. Wenn angegeben: vor dem Start aus origin/<BRANCH>
#                 fetchen, auschecken und pullen. Working tree muss sauber sein.
#
# Optionen:
#   --no-tests    Smoke-Tests ueberspringen
#   --reset       Dev-HA-Konfiguration loeschen, frischer HA-Onboarding-Flow
#   --logs        nach dem Start direkt in den Log-Tail wechseln
#   --yes | -y    sudo-/Install-Prompts automatisch bestaetigen
#   --no-install  fehlende Voraussetzungen NICHT auto-installieren, nur warnen
#   -h | --help   diese Hilfe anzeigen
#
# Beispiele:
#   bash scripts/start.sh
#   bash scripts/start.sh main
#   bash scripts/start.sh main --reset --logs
#   bash scripts/start.sh -y                        # alles auto-installieren
#   bash scripts/start.sh claude/feature-x --no-tests

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
  sed -n '2,33p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
}

# ── Args ───────────────────────────────────────────────────────────────────────
RUN_TESTS=1
RESET_HA=0
TAIL_LOGS=0
ASSUME_YES=0
AUTO_INSTALL=1
BRANCH=""
for arg in "$@"; do
  case "$arg" in
    --no-tests)    RUN_TESTS=0 ;;
    --reset)       RESET_HA=1 ;;
    --logs)        TAIL_LOGS=1 ;;
    --yes|-y)      ASSUME_YES=1 ;;
    --no-install)  AUTO_INSTALL=0 ;;
    -h|--help)     usage ;;
    --*)           fail "Unbekannte Option: $arg (--help fuer Hilfe)" ;;
    -*)            fail "Unbekannte Option: $arg (--help fuer Hilfe)" ;;
    *)
      if [ -z "$BRANCH" ]; then
        BRANCH="$arg"
      else
        fail "Mehrere Branches angegeben: '$BRANCH' und '$arg'"
      fi
      ;;
  esac
done

# ── In Repo-Wurzel wechseln ────────────────────────────────────────────────────
cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"
COMPOSE_FILE="docker-compose.dev.yml"

[ -f "$COMPOSE_FILE" ] || fail "$COMPOSE_FILE nicht gefunden — bist du im Repo-Root?"

echo
echo -e "${BOLD}messagehub Dev-Start${NC}  (${REPO_ROOT})"
[ -n "$BRANCH" ] && echo -e "Branch:               ${BOLD}${BRANCH}${NC}"
echo

# ── 0. Git-Update (optional) ───────────────────────────────────────────────────
if [ -n "$BRANCH" ]; then
  command -v git >/dev/null 2>&1 || fail "git nicht gefunden, aber Branch '$BRANCH' angefordert"
  [ -d .git ] || fail "kein git-Repo in $REPO_ROOT"

  step "aktualisiere aus origin (Branch: $BRANCH)"

  # Sicherheitsnetz: working tree muss sauber sein, sonst gehen Aenderungen verloren.
  if ! git diff --quiet || ! git diff --cached --quiet; then
    git status --short
    fail "working tree ist nicht sauber — bitte erst commiten oder stashen, dann erneut starten"
  fi

  # Mit Retries, falls das Netz wackelt.
  fetch_ok=0
  for delay in 0 2 4 8; do
    [ "$delay" -gt 0 ] && { warn "git fetch fehlgeschlagen, retry in ${delay}s"; sleep "$delay"; }
    if git fetch origin "$BRANCH" 2>&1; then
      fetch_ok=1
      break
    fi
  done
  [ "$fetch_ok" -eq 1 ] || fail "git fetch origin $BRANCH wiederholt fehlgeschlagen"

  # Existiert der Branch lokal? Wenn nein, neu von origin/<BRANCH> auschecken.
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git checkout "$BRANCH"
  else
    info "lokaler Branch '$BRANCH' existiert nicht — checke aus origin aus"
    git checkout -B "$BRANCH" "origin/$BRANCH"
  fi

  # Fast-forward auf den remote Stand. Bricht ab, wenn lokale Commits divergieren.
  if ! git merge --ff-only "origin/$BRANCH"; then
    fail "lokaler Branch '$BRANCH' divergiert von origin/$BRANCH — bitte manuell aufloesen"
  fi

  info "auf $BRANCH @ $(git rev-parse --short HEAD)"
fi

# ── 1. Prerequisites ───────────────────────────────────────────────────────────
step "pruefe Voraussetzungen"

# OS / Package-Manager erkennen
OS_FAMILY="unknown"
PKG_INSTALL=""
PKG_UPDATE=""
NEEDS_SUDO=0

if [ "$(uname -s)" = "Darwin" ]; then
  OS_FAMILY="macos"
  if command -v brew >/dev/null 2>&1; then
    PKG_INSTALL="brew install"
    PKG_UPDATE="brew update"
  fi
elif [ -f /etc/os-release ]; then
  # shellcheck source=/dev/null
  . /etc/os-release
  case "${ID:-}${ID_LIKE:-}" in
    *ubuntu*|*debian*)
      OS_FAMILY="debian"
      PKG_INSTALL="apt-get install -y"
      PKG_UPDATE="apt-get update"
      NEEDS_SUDO=1
      ;;
    *fedora*|*rhel*|*centos*|*rocky*|*alma*)
      OS_FAMILY="fedora"
      PKG_INSTALL="dnf install -y"
      PKG_UPDATE="dnf -y check-update || true"
      NEEDS_SUDO=1
      ;;
    *arch*|*manjaro*)
      OS_FAMILY="arch"
      PKG_INSTALL="pacman -S --noconfirm"
      PKG_UPDATE="pacman -Sy"
      NEEDS_SUDO=1
      ;;
    *alpine*)
      OS_FAMILY="alpine"
      PKG_INSTALL="apk add"
      PKG_UPDATE="apk update"
      NEEDS_SUDO=1
      ;;
  esac
fi

info "OS-Family:     $OS_FAMILY"

# sudo nur, wenn nicht root
SUDO=""
if [ "$NEEDS_SUDO" -eq 1 ] && [ "$(id -u)" -ne 0 ]; then
  SUDO="sudo"
fi

confirm() {
  # confirm "<frage>" — true bei y/Y oder ASSUME_YES, false sonst
  local prompt="$1"
  if [ "$ASSUME_YES" -eq 1 ]; then
    info "$prompt (auto-yes)"
    return 0
  fi
  printf "${YELLOW}?${NC}  %s [y/N] " "$prompt"
  read -r answer
  case "${answer:-}" in
    y|Y|yes|YES) return 0 ;;
    *)           return 1 ;;
  esac
}

run_install() {
  # run_install <kommandos...>
  if [ -z "$PKG_INSTALL" ]; then
    return 1
  fi
  # shellcheck disable=SC2086
  $SUDO $PKG_UPDATE >/dev/null 2>&1 || true
  # shellcheck disable=SC2086
  $SUDO $PKG_INSTALL "$@"
}

ensure_python() {
  PYTHON_BIN=""
  for cand in python3.13 python3.12 python3; do
    if command -v "$cand" >/dev/null 2>&1; then
      ver=$("$cand" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
      major=${ver%%.*}
      minor=${ver##*.}
      if [ "$major" -eq 3 ] && [ "$minor" -ge 12 ]; then
        PYTHON_BIN="$cand"
        info "Python:        $cand ($ver)"
        return 0
      fi
    fi
  done

  warn "Python 3.12+ nicht gefunden"
  if [ "$AUTO_INSTALL" -eq 0 ]; then
    fail "Bitte Python 3.12+ installieren (siehe README) oder ohne --no-install starten"
  fi

  case "$OS_FAMILY" in
    debian)
      if confirm "Python 3.12 via deadsnakes-PPA installieren? (sudo)"; then
        $SUDO $PKG_INSTALL software-properties-common >/dev/null
        $SUDO add-apt-repository -y ppa:deadsnakes/ppa
        $SUDO $PKG_UPDATE >/dev/null
        $SUDO $PKG_INSTALL python3.12 python3.12-venv python3.12-dev
      else
        fail "Python-Install abgebrochen"
      fi
      ;;
    fedora)
      if confirm "Python 3.12 via dnf installieren? (sudo)"; then
        run_install python3.12
      else
        fail "Python-Install abgebrochen"
      fi
      ;;
    arch)
      if confirm "Python via pacman installieren? (sudo)"; then
        run_install python
      else
        fail "Python-Install abgebrochen"
      fi
      ;;
    alpine)
      if confirm "Python 3.12 via apk installieren? (sudo)"; then
        run_install python3 py3-virtualenv
      else
        fail "Python-Install abgebrochen"
      fi
      ;;
    macos)
      if ! command -v brew >/dev/null 2>&1; then
        fail "Homebrew nicht gefunden. Installiere via https://brew.sh und starte erneut"
      fi
      if confirm "Python 3.12 via Homebrew installieren?"; then
        brew install python@3.12
      else
        fail "Python-Install abgebrochen"
      fi
      ;;
    *)
      fail "automatischer Python-Install fuer OS '$OS_FAMILY' nicht unterstuetzt — bitte manuell installieren"
      ;;
  esac

  # Nach Install nochmal suchen
  for cand in python3.13 python3.12; do
    if command -v "$cand" >/dev/null 2>&1; then
      PYTHON_BIN="$cand"
      info "Python:        $cand"
      return 0
    fi
  done
  fail "Python-Install schien zu klappen, aber kein python3.12/3.13 im PATH"
}

ensure_docker() {
  if command -v docker >/dev/null 2>&1; then
    info "Docker:        $(docker --version)"
    return 0
  fi

  warn "docker nicht gefunden"
  if [ "$AUTO_INSTALL" -eq 0 ]; then
    fail "Bitte Docker installieren (siehe https://docs.docker.com/get-docker)"
  fi

  case "$OS_FAMILY" in
    debian|fedora|arch|alpine)
      if confirm "Docker via get.docker.com Skript installieren? (curl | sh, sudo)"; then
        curl -fsSL https://get.docker.com | $SUDO sh
        # Wenn nicht root: Benutzer in docker-Gruppe aufnehmen
        if [ "$(id -u)" -ne 0 ]; then
          $SUDO usermod -aG docker "$USER" || true
          warn "Du wurdest zur Gruppe 'docker' hinzugefuegt — bitte einmal aus-/einloggen, dann start.sh erneut starten"
          exit 0
        fi
      else
        fail "Docker-Install abgebrochen"
      fi
      ;;
    macos)
      fail "Bitte Docker Desktop fuer Mac installieren: https://www.docker.com/products/docker-desktop"
      ;;
    *)
      fail "automatischer Docker-Install fuer OS '$OS_FAMILY' nicht unterstuetzt"
      ;;
  esac

  command -v docker >/dev/null 2>&1 || fail "Docker-Install ist fehlgeschlagen"
  info "Docker:        $(docker --version)"
}

ensure_compose() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
    info "Compose:       $(docker compose version --short 2>/dev/null || echo 'plugin')"
    return 0
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
    warn "nutze legacy docker-compose ($(docker-compose --version))"
    return 0
  fi

  warn "weder 'docker compose' noch 'docker-compose' verfuegbar"
  if [ "$AUTO_INSTALL" -eq 0 ]; then
    fail "Bitte docker-compose-plugin installieren"
  fi

  case "$OS_FAMILY" in
    debian)
      if confirm "docker-compose-plugin via apt installieren? (sudo)"; then
        run_install docker-compose-plugin
      else
        fail "Compose-Install abgebrochen"
      fi
      ;;
    fedora|arch|alpine)
      if confirm "docker-compose-plugin nachinstallieren? (sudo)"; then
        run_install docker-compose-plugin || run_install docker-compose
      else
        fail "Compose-Install abgebrochen"
      fi
      ;;
    macos)
      fail "Compose ist Teil von Docker Desktop — bitte sicherstellen, dass Desktop laeuft"
      ;;
  esac

  if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
  else
    fail "Compose-Install ist fehlgeschlagen"
  fi
  info "Compose:       $COMPOSE OK"
}

ensure_python
ensure_docker
ensure_compose

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
for _ in $(seq 1 45); do
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
EOF

if [ -n "$BRANCH" ]; then
  echo "  Branch:     $BRANCH @ $(git rev-parse --short HEAD)"
fi

cat <<EOF

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
