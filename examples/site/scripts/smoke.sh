#!/usr/bin/env bash

# Runs all endpoints as a quick smoke test (requires jq and a valid TOKEN).

set -euo pipefail

: "${TOKEN:?Set TOKEN env var to your OAuth access token}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔎 Ping..."
"${DIR}/ping.sh" >/dev/null && echo "✅ ping"

echo "🔎 Order status..."
ORDER_ID="${ORDER_ID:-ORD-ABC123}"
"${DIR}/order_status.sh" "${ORDER_ID}" >/dev/null && echo "✅ order_status"

echo "🔎 Schedule demo..."
"${DIR}/schedule_demo.sh" "Jane Doe" "jane@example.com" "2025-08-16T09:00Z/2025-08-18T17:00Z" >/dev/null && echo "✅ schedule_demo"

echo "🔎 Create sandbox quote..."
"${DIR}/create_quote_sandbox.sh" "SKU-123" 5 >/dev/null && echo "✅ create_quote_sandbox"

echo "🎉 All good."