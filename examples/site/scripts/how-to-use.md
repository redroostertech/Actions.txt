# How to Use Scripts

## Testing Against Live Demo API

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

## Testing Against Local Reference Implementation

```bash
# Start the local server
cd server-node
npm run dev

# Test with local endpoints
curl -s http://localhost:4242/ping | jq .
export TOKEN="dev-token"
curl -s http://localhost:4242/orders/ORD-ABC123/status \
  -H "Authorization: Bearer $TOKEN" | jq .

# Run comprehensive tests
./test-server.sh
```

## Performance Comparison

| Metric | Demo API | Local Server |
|--------|----------|--------------|
| Response Time | ~100-200ms | <10ms |
| Rate Limits | Enforced | Configurable |
| Idempotency | Supported | TTL-based |
| Authentication | OAuth2 | Bearer Token |

## What's Next?

✅ **Reference Implementation Complete!** We've built a production-ready Node.js + TypeScript server that demonstrates the complete Action.txt specification.

- **Learn More**: Check out the [API Reference](../../spec/docs/api.md)
- **Run Locally**: See [Local Development](../../README.md#for-contributors--local-dev)
- **Explore Code**: Browse the [server implementation](../../server-node/)
