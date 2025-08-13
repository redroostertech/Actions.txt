#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://demo.actiontxt.org}"
: "${TOKEN:?Set TOKEN env var to your OAuth access token}"

jq_exists() { command -v jq >/dev/null 2>&1; }

resp="$(curl -fsS "${BASE_URL}/ping" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "User-Agent: ActionTxtScripts/1.0")"

if jq_exists; then echo "$resp" | jq .; else echo "$resp"; fi