#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
: "${RUNTIME_DIR:?RUNTIME_DIR must point to the browser capture runtime}"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory}"
export CAPTURE_STRICT="${CAPTURE_STRICT:-1}"

/usr/bin/time -f '[timing] browser capture: %e s' node "$RUNTIME_DIR/scripts/default-capture.mjs"
