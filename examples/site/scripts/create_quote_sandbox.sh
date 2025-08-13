#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://demo.actiontxt.org}"
: "${TOKEN:?Set TOKEN env var to your OAuth access token}"

usage() {
  echo "Usage: $0 <SKU> <QUANTITY>"
  echo "Example: $0 SKU-123 5"
  exit 1
}

SKU="${1:-}"; QTY="${2:-}"
[[ -z "$SKU" || -z "$QTY" ]] && usage

# Validate integer quantity
if ! [[ "$QTY" =~ ^[0-9]+$ ]]; then
  echo "Quantity must be an integer" >&2
  exit 2
fi

payload="{\"sku\":\"${SKU}\",\"quantity\":${QTY}}"

curl -fsS -X POST "${BASE_URL}/quotes:sandbox" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "User-Agent: ActionTxtScripts/1.0" \
  -d "${payload}" | { command -v jq >/dev/null 2>&1 && jq . || cat; }