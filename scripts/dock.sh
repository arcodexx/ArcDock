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

# Setup SSH Multiplexing (ControlMaster) to prevent multiple password prompts
SSH_SOCKET="/tmp/arcdock-ssh-${TARGET_HOST//\//_}-${PORT}.sock"
SSH_SHARED_OPTS=(
  -o "ControlMaster=auto"
  -o "ControlPath=${SSH_SOCKET}"
  -o "ControlPersist=120s"
  -o "ConnectTimeout=4"
  -o "StrictHostKeyChecking=no"
  -o "UserKnownHostsFile=/dev/null"
  -o "LogLevel=ERROR"
)

SCP_SHARED_OPTS=(
  -o "ControlPath=${SSH_SOCKET}"
  -o "StrictHostKeyChecking=no"
  -o "UserKnownHostsFile=/dev/null"
  -o "LogLevel=ERROR"
)

cleanup_ssh() {
  if [ -S "$SSH_SOCKET" ]; then
    ssh -O exit -o "ControlPath=${SSH_SOCKET}" -p "$PORT" "$TARGET_HOST" 2>/dev/null || true
    rm -f "$SSH_SOCKET" 2>/dev/null || true
  fi
}
trap cleanup_ssh EXIT INT TERM

# Verify target reachability before attempting transfers or operations
verify_reachability() {
  echo "🔍 Verifying connection to phone at ${TARGET_HOST}:${PORT}..."
  local REACHABLE=0
  if python3 -c "import socket; s = socket.socket(); s.settimeout(2.5); exit(0 if s.connect_ex(('${TARGET_HOST}', int('${PORT}'))) == 0 else 1)" 2>/dev/null; then
    REACHABLE=1
  fi

  if [ "$REACHABLE" -ne 1 ]; then
    echo ""
    echo "===================================================================="
    echo "❌ CANNOT CONNECT TO PHONE AT ${TARGET_HOST}:${PORT}"
    echo "===================================================================="
    echo "💡 The target phone is currently unreachable."
    echo "   Common reasons:"
    echo "   1. Phone's Wi-Fi IP address changed (DHCP router lease renewed)."
    echo "   2. Phone Wi-Fi is disconnected or on a different network."
    echo "   3. Termux SSH server is not running on phone."
    echo ""
    echo "👉 TO UPDATE THE PHONE IP ADDRESS, RUN:"
    echo "   npm run dock:ip <NEW_PHONE_IP>"
    echo ""
    echo "   Example: npm run dock:ip 192.168.1.35"
    echo ""
    echo "👉 TO CHECK YOUR PHONE'S CURRENT IP IN TERMUX:"
    echo "   Open Termux on phone and type:  ip addr show wlan0"
    echo "   Make sure SSH is started:       sshd"
    echo "===================================================================="
    echo ""
    exit 1
  fi
  echo "✅ Phone reachable at ${TARGET_HOST}:${PORT}"
}

run_ssh() {
  ssh "${SSH_SHARED_OPTS[@]}" -p "$PORT" "$TARGET_HOST" "$@"
}

run_scp() {
  scp "${SCP_SHARED_OPTS[@]}" -P "$PORT" "$@"
}

case "$ACTION" in
  deploy)
    echo "=========================================="
    echo "🚀 Building & Deploying ArcDock to Phone"
    echo "   Target: ${TARGET_HOST}:${PORT}"
    echo "=========================================="

    verify_reachability

    echo "📦 1. Building production web app..."
    npm run build

    echo "📁 2. Ensuring remote directories on phone (SSH multiplexed)..."
    run_ssh "mkdir -p ~/arcdock/dist"

    echo "📤 3. Transferring assets and server (session reused - 0 extra passwords)..."
    run_scp -r dist/* "${TARGET_HOST}:~/arcdock/dist/"
    run_scp scripts/arcdock_api.py "${TARGET_HOST}:~/arcdock_api.py"
    run_scp scripts/restart-dock.sh "${TARGET_HOST}:~/restart-dock.sh"

    echo "🔄 4. Restarting ArcDock server on phone..."
    run_ssh "bash ~/restart-dock.sh"

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
    verify_reachability
    echo "📱 Force-reloading phone display on 127.0.0.1:3000..."
    # Ensure server is running before refreshing browser
    run_ssh '
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
    verify_reachability
    echo "🔍 Checking phone services at ${TARGET_HOST}:${PORT}..."
    run_ssh '
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
    verify_reachability
    echo "🔄 Restarting ArcDock and Home Assistant on phone..."
    run_ssh '
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
    ssh -o "StrictHostKeyChecking=no" -o "UserKnownHostsFile=/dev/null" -p "$PORT" "$TARGET_HOST"
    ;;

  ip)
    if [ -n "$PARAM_IP" ]; then
      echo "$PARAM_IP" > "$(dirname "$0")/../.phone_ip"
      echo "===================================================================="
      echo "✅ Saved phone IP: $PARAM_IP"
      echo "   Future deploy/reload/status commands will target: ${PARAM_IP}:${PORT}"
      echo "===================================================================="
    else
      echo "===================================================================="
      echo "📱 Current Target Phone IP: ${SAVED_IP:-192.168.1.29}"
      echo "   Port: ${PORT}"
      echo "--------------------------------------------------------------------"
      echo "👉 To change IP address, run:"
      echo "   npm run dock:ip <NEW_IP>"
      echo "   Example: npm run dock:ip 192.168.1.35"
      echo "===================================================================="
    fi
    ;;

  *)
    echo "Usage: bash scripts/dock.sh [deploy|reload|status|restart|ssh]"
    exit 1
    ;;
esac
