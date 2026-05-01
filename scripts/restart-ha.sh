#!/usr/bin/env bash
# scripts/restart-ha.sh
#
# Restart der Dev-HA, um Code-Änderungen aufzunehmen.
# Custom Components werden von HA NICHT hot-reloaded, daher nach jedem
# Backend-Code-Change nötig.

set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE_FILE="docker-compose.dev.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Fehler: $COMPOSE_FILE nicht gefunden" >&2
  exit 1
fi

echo "→ restarting ha-messagehub-dev"
docker compose -f "$COMPOSE_FILE" restart homeassistant

echo "→ waiting for healthy state"
for _ in $(seq 1 30); do
  if docker inspect --format='{{.State.Health.Status}}' ha-messagehub-dev 2>/dev/null | grep -q healthy; then
    echo "✓ HA ist bereit auf http://localhost:8124"
    break
  fi
  sleep 2
done

echo "→ tailing logs (Strg-C zum Beenden, HA läuft weiter)"
docker compose -f "$COMPOSE_FILE" logs -f --tail=80 homeassistant
