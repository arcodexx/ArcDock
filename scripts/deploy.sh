#!/usr/bin/env bash
# Delegate directly to the master dock CLI
exec bash "$(dirname "$0")/dock.sh" deploy "$@"
