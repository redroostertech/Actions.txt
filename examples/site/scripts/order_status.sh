#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://demo.actiontxt.org}"
: "${TOKEN:?Set TOKEN env var to your OAuth access token}"

usage() {
  echo "Usage: ORDER_ID=ORD-ABC123 $0"
  echo "   or: $0 ORD-ABC123"
  exit 1
}

ORDER_ID="${1:-${ORDER_ID:-}}"
[[ -z "${ORDER_ID}" ]] && usage

jq_exists() { command -v jq >/dev/null 2>&1; }

resp="$(curl -fsS "${BASE_URL}/orders/${ORDER_ID}/status" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "User-Agent: ActionTxtScripts/1.0")"

if jq_exists; then echo "$resp" | jq .; else echo "$resp"; fi