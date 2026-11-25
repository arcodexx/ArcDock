#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# ArcDock On-Device Server Controller
# Cleanly terminates and relaunches arcdock_api.py with port verification
# ==============================================================================

echo "Stopping existing ArcDock server..."
PIDS=$(pgrep -f '[p]ython.*/arcdock_api\.py' || true)
if [ -n "$PIDS" ]; then
  kill -9 $PIDS 2>/dev/null || true
fi
sleep 1

echo "Starting ArcDock server via Termux python..."
nohup /data/data/com.termux/files/usr/bin/python3 /data/data/com.termux/files/home/arcdock_api.py > /data/data/com.termux/files/home/arcdock.log 2>&1 &

echo "Verifying server readiness on port 3000..."
READY=0
for i in $(seq 1 10); do
  sleep 1
  if curl -s -I http://127.0.0.1:3000 2>/dev/null | grep -E "200 OK|SimpleHTTP" >/dev/null; then
    READY=1
    echo "✅ ArcDock server is UP and responding 200 OK on port 3000!"
    break
  fi
  echo "Waiting for port 3000 to be ready... ($i/10)"
done

if [ "$READY" -eq 0 ]; then
  echo "❌ ERROR: Server failed to start! Last 20 lines of log:"
  tail -n 20 /data/data/com.termux/files/home/arcdock.log
  exit 1
fi
