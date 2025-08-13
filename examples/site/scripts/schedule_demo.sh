#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://demo.actiontxt.org}"
: "${TOKEN:?Set TOKEN env var to your OAuth access token}"

# Cross-platform UUID generator (macOS/Linux/WSL)
gen_uuid() {
  if command -v uuidgen >/dev/null 2>&1; then uuidgen
  elif [[ -r /proc/sys/kernel/random/uuid ]]; then cat /proc/sys/kernel/random/uuid
  else python - <<'PY'
import uuid; print(uuid.uuid4())
PY
  fi
}

usage() {
  cat <<'EOF'
Usage:
  schedule_demo.sh "Jane Doe" "jane@example.com" "2025-08-16T09:00Z/2025-08-18T17:00Z" [notes]

Env overrides:
  BASE_URL (default https://demo.actiontxt.org)
  IDEMP_KEY (auto-generated if not set)
  RUN_ID    (auto-generated if not set)
EOF
  exit 1
}

NAME="${1:-}"; EMAIL="${2:-}"; WINDOW="${3:-}"; NOTES="${4:-}"
[[ -z "$NAME" || -z "$EMAIL" || -z "$WINDOW" ]] && usage

IDEMP_KEY="${IDEMP_KEY:-$(gen_uuid)}"
RUN_ID="${RUN_ID:-$(gen_uuid)}"

payload="$(jq -n \
  --arg name "$NAME" \
  --arg email "$EMAIL" \
  --arg window "$WINDOW" \
  --arg notes "$NOTES" \
  '{
     name: $name,
     email: $email,
     time_window: $window
   } + ( ($notes|length)>0 ? {notes:$notes} : {} )' 2>/dev/null || true)"

# Fallback if jq not installed
if [[ -z "${payload}" ]]; then
  payload="{\"name\":\"${NAME}\",\"email\":\"${EMAIL}\",\"time_window\":\"${WINDOW}\"}"
  if [[ -n "${NOTES}" ]]; then
    payload="${payload%}} ,\"notes\":\"${NOTES//\"/\\\"}\"}"
  fi
fi

curl -fsS -X POST "${BASE_URL}/demos" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${IDEMP_KEY}" \
  -H "X-Agent-Run-Id: ${RUN_ID}" \
  -H "User-Agent: ActionTxtScripts/1.0" \
  -d "${payload}" | { command -v jq >/dev/null 2>&1 && jq . || cat; }