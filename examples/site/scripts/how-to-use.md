# How to Use Scripts

```bash
# from repo root
chmod +x examples/site/scripts/*.sh

# export your OAuth token
export TOKEN="YOUR_ACCESS_TOKEN"

# try them
examples/site/scripts/ping.sh
examples/site/scripts/order_status.sh ORD-ABC123
examples/site/scripts/schedule_demo.sh "Jane Doe" "jane@example.com" "2025-08-16T09:00Z/2025-08-18T17:00Z"
examples/site/scripts/create_quote_sandbox.sh SKU-123 5

# optional smoke test
examples/site/scripts/smoke.sh
```

want me to generate a **minimal Express server** next that serves the `/.well-known/agent.json`, `openapi.json`, and implements these endpoints with rate limiting + idempotency?
