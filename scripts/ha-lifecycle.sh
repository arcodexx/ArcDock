#!/bin/sh
# ArcDock Home Assistant Lifecycle Controller
# Controls local Home Assistant Core container on mode changes (Desk Mode vs. Car Mode)

ACTION="$1"
COMPOSE_FILE="/opt/arcdock/docker/docker-compose.yml"

case "$ACTION" in
  start|desk)
    echo "[ArcDock] Switching to Desk Mode: Starting Home Assistant..."
    if command -v docker >/dev/null 2>&1; then
      docker start homeassistant 2>/dev/null || docker compose -f "$COMPOSE_FILE" up -d
      logger -t arcdock-ha "Desk Mode: Home Assistant container started."
    else
      echo "[ArcDock] Docker not found. Skipping container start."
    fi
    ;;
  stop|car)
    echo "[ArcDock] Switching to Car Mode: Stopping Home Assistant..."
    if command -v docker >/dev/null 2>&1; then
      docker stop homeassistant 2>/dev/null
      logger -t arcdock-ha "Car Mode: Home Assistant container suspended (~1GB RAM reclaimed)."
    else
      echo "[ArcDock] Docker not found. Skipping container stop."
    fi
    ;;
  status)
    if command -v docker >/dev/null 2>&1; then
      docker ps -f name=homeassistant --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
      echo "[ArcDock] Docker not found."
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|status|desk|car}"
    exit 1
    ;;
esac
