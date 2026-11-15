#!/bin/sh
# ArcDock - Battery Guardian (60%-70% Sysfs Charge Hysteresis Watchdog)
# Prevents lithium battery swelling on devices docked 24/7.
# Can be run via a 60-second cron or systemd timer.

BATTERY_PATH="/sys/class/power_supply/battery"

if [ ! -d "$BATTERY_PATH" ]; then
  echo "Battery sysfs directory not found at $BATTERY_PATH"
  exit 0
fi

CAPACITY=$(cat "$BATTERY_PATH/capacity" 2>/dev/null || echo "100")
STATUS=$(cat "$BATTERY_PATH/status" 2>/dev/null || echo "Unknown")

CHARGING_CONTROL=""
if [ -f "$BATTERY_PATH/charging_enabled" ]; then
  CHARGING_CONTROL="$BATTERY_PATH/charging_enabled"
elif [ -f "$BATTERY_PATH/charge_control_limit_max" ]; then
  CHARGING_CONTROL="$BATTERY_PATH/charge_control_limit_max"
fi

echo "Battery Capacity: ${CAPACITY}%, Status: ${STATUS}"

if [ -n "$CHARGING_CONTROL" ]; then
  # If capacity is 70% or above, cut off charging
  if [ "$CAPACITY" -ge 70 ]; then
    echo "0" > "$CHARGING_CONTROL" 2>/dev/null
    echo "Charge cut off at ${CAPACITY}%."
  # If capacity drops to 60% or below, re-enable charging
  elif [ "$CAPACITY" -le 60 ]; then
    echo "1" > "$CHARGING_CONTROL" 2>/dev/null
    echo "Charge resumed at ${CAPACITY}%."
  fi
fi
