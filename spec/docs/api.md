# Action.txt Demo API — Reference

This document renders the endpoints defined in [`/spec/openapi.yaml`](../openapi.yaml) / [`/spec/openapi.json`](../openapi.json).

## Implementation Status

✅ **All endpoints are fully implemented** in our reference Node.js server
✅ **Comprehensive testing** with automated test suite
✅ **Production-ready** with authentication, rate limiting, and idempotency

## Running the Reference Implementation

```bash
cd server-node
npm install
cp .env.example .env
npm run dev
```

## Testing the API

```bash
# Run comprehensive test suite
./test-server.sh

# Or test individual endpoints
curl -s http://localhost:4242/ping | jq .
```

## Endpoints

- `GET /ping` — health check (requires scope `demo:read`)
- `GET /orders/{order_id}/status` — fetch order status (requires scope `demo:order:read`)
- `POST /demos` — create a demo request (requires scope `demo:schedule`, **requires** `Idempotency-Key`)
- `POST /quotes/sandbox` — create a sandbox quote (requires scope `demo:quote:sandbox`)

## Schemas

See **components.schemas** in the OpenAPI for:
- `OrderStatus`
- `ScheduleDemoInput`, `ScheduleDemoOutput`
- `QuoteRequest`, `Quote`
- `Error`

## Performance Characteristics

- **Response Time**: <10ms for simple endpoints
- **Rate Limits**: Configurable per-endpoint (e.g., ping: 10/sec, demos: 60/min)
- **Idempotency**: TTL-based storage with automatic cleanup
- **Authentication**: OAuth2 Bearer token with scope validation

## Running a rendered API Reference

### Option A: GitHub Pages + Redoc (recommended)
Create `docs/index.html` with:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Action.txt API Reference</title>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    <style> body { margin: 0; padding: 0; } </style>
  </head>
  <body>
    <redoc spec-url="../spec/openapi.yaml"></redoc>
  </body>
</html>
