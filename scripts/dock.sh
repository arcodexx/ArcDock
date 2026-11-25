#!/usr/bin/env bash
set -e

# ==============================================================================
# ArcDock Master Phone Control CLI (Run from Mac)
# Zero typing on the phone needed!
# ==============================================================================

ACTION="${1:-deploy}"
PARAM_IP="${2:-}"
PORT="${SSH_PORT:-8022}"

# Read saved IP if available
SAVED_IP=""
if [ -f "$(dirname "$0")/../.phone_ip" ]; then
  SAVED_IP=$(cat "$(dirname "$0")/../.phone_ip" | tr -d ' \n\r')
fi

# If 2nd argument is an IP, save and use it
if [ -n "$PARAM_IP" ] && [[ "$PARAM_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "$PARAM_IP" > "$(dirname "$0")/../.phone_ip"
  SAVED_IP="$PARAM_IP"
fi

# 1. Ensure ADB port forwarding if USB is connected
setup_adb() {
  if command -v adb >/dev/null 2>&1; then
    if adb devices 2>/dev/null | grep -E "\bdevice\b" >/dev/null 2>&1; then
      echo "🔌 Setting up ADB port forwards (8022 SSH, 3000 Dock, 8123 HA)..."
      adb forward tcp:8022 tcp:8022 2>/dev/null || true
      adb forward tcp:3000 tcp:3000 2>/dev/null || true
      adb forward tcp:8123 tcp:8123 2>/dev/null || true
      TARGET_HOST="localhost"
      return 0
    fi
  fi
  TARGET_HOST="${PHONE_IP:-${SAVED_IP:-192.168.1.29}}"
}

setup_adb

case "$ACTION" in
  deploy)
    echo "=========================================="
    echo "🚀 Building & Deploying ArcDock to Phone"
    echo "   Target: ${TARGET_HOST}:${PORT}"
    echo "=========================================="
    
    echo "📦 1. Building production web app..."
    npm run build

    echo "📁 2. Ensuring remote directories on phone..."
    ssh -o ConnectTimeout=5 -p "$PORT" "$TARGET_HOST" "mkdir -p ~/arcdock/dist"

    echo "📤 3. Transferring assets and server..."
    scp -P "$PORT" -r dist/* "${TARGET_HOST}:~/arcdock/dist/"
    scp -P "$PORT" scripts/arcdock_api.py "${TARGET_HOST}:~/arcdock_api.py"
    scp -P "$PORT" scripts/restart-dock.sh "${TARGET_HOST}:~/restart-dock.sh"

    echo "🔄 4. Restarting ArcDock server on phone..."
    ssh -p "$PORT" "$TARGET_HOST" "bash ~/restart-dock.sh"

    echo "📱 5. Force-refreshing phone screen (bypassing cache)..."
    if command -v adb >/dev/null 2>&1 && adb devices 2>/dev/null | grep -E "\bdevice\b" >/dev/null 2>&1; then
      TIMESTAMP=$(date +%s)
      # Ask Fully Kiosk to clear cache via broadcast if running
      adb shell am broadcast -a de.ozerov.fully.action.clearCache 2>/dev/null || true
      # Force-restart Fully Kiosk on 127.0.0.1 to preserve origin localStorage
      adb shell am force-stop de.ozerov.fully 2>/dev/null || true
      sleep 1
      adb shell am start -a android.intent.action.VIEW -d "http://127.0.0.1:3000?t=${TIMESTAMP}" -n de.ozerov.fully/.MainActivity 2>/dev/null || \
      adb shell am start -a android.intent.action.VIEW -d "http://127.0.0.1:3000?t=${TIMESTAMP}" 2>/dev/null || true
      echo "✨ Fully Kiosk restarted with clean cache on 127.0.0.1:3000!"
    fi

    echo "=========================================="
    echo "✅ Deploy Complete!"
    echo "=========================================="
    ;;

  reload)
    echo "📱 Force-reloading phone display on 127.0.0.1:3000..."
    # Ensure server is running before refreshing browser
    ssh -o ConnectTimeout=3 -p "$PORT" "$TARGET_HOST" '
      if ! curl -s -I http://127.0.0.1:3000 2>/dev/null | grep -E "200 OK|SimpleHTTP" >/dev/null; then
        echo "Port 3000 not responding, launching ArcDock server..."
        bash ~/restart-dock.sh
      fi
    ' 2>/dev/null || true

    if command -v adb >/dev/null 2>&1 && adb devices 2>/dev/null | grep -E "\bdevice\b" >/dev/null 2>&1; then
      TIMESTAMP=$(date +%s)
      adb shell am broadcast -a de.ozerov.fully.action.clearCache 2>/dev/null || true
      adb shell am force-stop de.ozerov.fully 2>/dev/null || true
      sleep 1
      adb shell am start -a android.intent.action.VIEW -d "http://127.0.0.1:3000?t=${TIMESTAMP}" -n de.ozerov.fully/.MainActivity 2>/dev/null || \
      adb shell am start -a android.intent.action.VIEW -d "http://127.0.0.1:3000?t=${TIMESTAMP}" 2>/dev/null || true
      echo "✅ Phone display reloaded on 127.0.0.1:3000 with fresh timestamp and cleared cache!"
    else
      echo "⚠️ No USB ADB device detected. Connect via USB or reload in browser."
    fi
    ;;

  status)
    echo "🔍 Checking phone services at ${TARGET_HOST}:${PORT}..."
    ssh -p "$PORT" "$TARGET_HOST" '
      echo "=== Active Python & HA Processes ==="
      ps aux | grep -E "arcdock_api|hass" | grep -v grep || echo "⚠️ No active processes found!"
      echo ""
      echo "=== Network Interfaces & Wi-Fi IP ==="
      ip addr show wlan0 2>/dev/null | grep -o "inet [0-9.]*" || echo "wlan0 not found"
      echo ""
      echo "=== Port Listeners ==="
      echo -n "• Port 3000 (ArcDock): "
      curl -s -I http://127.0.0.1:3000 2>/dev/null | head -n 1 || echo "DOWN (Not listening)"
      echo -n "• Port 8123 (Home Assistant): "
      curl -s -I http://127.0.0.1:8123 2>/dev/null | head -n 1 || echo "DOWN (Not listening)"
    '
    echo ""
    echo "💡 From your Mac with phone plugged via USB:"
    echo "   ArcDock:        http://localhost:3000 (or http://127.0.0.1:3000)"
    echo "   Home Assistant: http://localhost:8123"
    ;;

  restart)
    echo "🔄 Restarting ArcDock and Home Assistant on phone..."
    ssh -p "$PORT" "$TARGET_HOST" '
      echo "1. Restarting ArcDock server..."
      bash ~/restart-dock.sh
      
      echo "2. Restarting Home Assistant Core..."
      PIDS=$(pgrep -f "hass" || true)
      if [ -n "$PIDS" ]; then
        kill -9 $PIDS 2>/dev/null || true
      fi
      sleep 1
      nohup /data/data/com.termux/files/home/hass/bin/hass > /data/data/com.termux/files/home/hass.log 2>&1 &
      echo "Waiting 3s for HA to initialize..."
      sleep 3
      ps aux | grep -E "arcdock_api|hass" | grep -v grep
    '
    echo "✅ Services restarted on phone!"
    ;;

  ssh)
    echo "💻 Connecting SSH to phone at ${TARGET_HOST}:${PORT}..."
    ssh -p "$PORT" "$TARGET_HOST"
    ;;

  ip)
    if [ -n "$PARAM_IP" ]; then
      echo "$PARAM_IP" > "$(dirname "$0")/../.phone_ip"
      echo "✅ Saved phone IP: $PARAM_IP (future deploy/reload will target this IP)"
    else
      echo "Current phone IP: ${SAVED_IP:-192.168.1.29}"
      echo "To change: npm run dock:ip <new-ip>  (e.g. npm run dock:ip 192.168.1.35)"
    fi
    ;;

  *)
    echo "Usage: bash scripts/dock.sh [deploy|reload|status|restart|ssh]"
    exit 1
    ;;
esac
