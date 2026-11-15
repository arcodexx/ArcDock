#!/bin/sh
# ArcDock - Launch Cage Wayland Kiosk with Chromium
# Usage: ./launch-cage.sh [URL]

TARGET_URL="${1:-http://127.0.0.1:3000}"

echo "Starting ArcDock Kiosk on Cage Wayland Compositor..."
exec cage -d -s -- chromium-browser \
  --kiosk \
  --ozone-platform=wayland \
  --enable-features=UseOzonePlatform \
  --enable-gpu-rasterization \
  --enable-zero-copy \
  --ignore-gpu-blocklist \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --noerrdialogs \
  --disable-infobars \
  --check-for-update-interval=31536000 \
  "$TARGET_URL"
