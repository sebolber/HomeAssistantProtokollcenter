#!/usr/bin/env bash
# Diagnose-Skript: prueft ob HA knx_event feuert und ob messagehub sie sieht.
#
# Usage:  bash scripts/diag-knx.sh
#
# Ablauf:
#   1. setzt logger-Level auf debug fuer messagehub + knx (idempotent)
#   2. restartet den HA-Container
#   3. wartet bis HA healthy ist
#   4. zeigt die Log-Zeilen, gefiltert auf alles relevante
set -euo pipefail

CONFIG_DIR=".dev/ha-config"
CONFIG_YAML="$CONFIG_DIR/configuration.yaml"
LOG_FILE="$CONFIG_DIR/home-assistant.log"

if [ ! -f "$CONFIG_YAML" ]; then
  echo "ERROR: $CONFIG_YAML existiert nicht — laeuft HA wirklich aus diesem Repo?" >&2
  exit 1
fi

if grep -q "custom_components.messagehub" "$CONFIG_YAML"; then
  echo "[1/4] logger-Block ist bereits gesetzt"
else
  echo "[1/4] haenge logger-Block an $CONFIG_YAML"
  cat >> "$CONFIG_YAML" <<'YAML'

logger:
  default: warning
  logs:
    custom_components.messagehub: debug
    homeassistant.components.knx: debug
    xknx: info
YAML
fi

echo "[2/4] restart HA"
docker compose -f docker-compose.dev.yml restart homeassistant

echo "[3/4] warte 30s bis HA bereit ist"
sleep 30

echo "[4/4] Log-Auszug (Treffer fuer messagehub/knx):"
echo "--------------------------------------------------"
if [ -f "$LOG_FILE" ]; then
  grep -iE 'messagehub|knx_event|knx-bus|xknx' "$LOG_FILE" | tail -100 || echo "(kein Treffer)"
else
  echo "ERROR: $LOG_FILE nicht vorhanden"
fi
echo "--------------------------------------------------"
echo ""
echo "Loese jetzt ein KNX-Telegramm aus (z.B. Lampe schalten)."
echo "Danach diesen Befehl, um neue Treffer zu sehen:"
echo "  tail -f $LOG_FILE | grep -iE 'messagehub|knx_event|knx-bus|xknx'"
