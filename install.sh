#!/usr/bin/env bash
# Chaos Harness v1.4.0 Loop & Wiki — POSIX installer (thin wrapper)
# Real logic lives in scripts/install.mjs (cross-platform)

set -e

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

if ! command -v node >/dev/null 2>&1; then
  echo " FAIL: Node.js not found. Install Node.js >= 18 from https://nodejs.org/"
  exit 1
fi

exec node "$SCRIPT_DIR/scripts/install.mjs" "$@"
