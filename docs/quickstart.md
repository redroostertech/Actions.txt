# Quick Start

Follow these steps to start using the ActionTxt Demo API.

---

## 1. Get an Access Token

Request a token using the **client credentials** flow. Replace `CLIENT_ID` and `CLIENT_SECRET` with your credentials.

```bash
curl -s -X POST "https://id.demo.actiontxt.org/oauth2/token" \
  -H "Content-Type: application/xwww-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  | jq .
```

Save the returned `access_token` to an environment variable:

```bash
export TOKEN="your_access_token_here"
```

---

## 2. Test Connectivity

```bash
curl -s https://demo.actiontxt.org/ping \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

A healthy API will respond with:

```json
{ "message": "pong" }
```

---

## 3. Schedule a Demo

Use a unique **Idempotency-Key** and **X-Agent-Run-Id** for each request.
If your system can generate UUIDs, set them in environment variables:

```bash
export IDEMP_KEY=$(uuidgen)
export RUN_ID=$(uuidgen)
```

Then make the request:

```bash
curl -s -X POST https://demo.actiontxt.org/demos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMP_KEY" \
  -H "X-Agent-Run-Id: $RUN_ID" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "time_window": "2025-08-16T09:00Z/2025-08-18T17:00Z"
  }' \
  | jq .
```

---

## 4. Check Order Status

```bash
curl -s https://demo.actiontxt.org/orders/ORD-ABC123/status \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

---

## 5. Create Sandbox Quote

```bash
curl -s -X POST https://demo.actiontxt.org/quotes/sandbox \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "SKU-123",
    "quantity": 5
  }' \
  | jq .
```

---

## 6. Explore More Endpoints

See the API Reference for details on:

* Checking order status
* Creating sandbox quotes
* Error formats and response codes
* Rate limiting and retry behavior

**API Reference:**
- **Machine-readable spec:** [`/spec/openapi.json`](../spec/openapi.json)
- **Human-readable docs:** [`/spec/docs/api.md`](../spec/docs/api.md)
- **Examples:** [`/examples/openapi.json`](../examples/openapi.json)

---

## 7. Running Locally

If you want to test with our reference implementation locally:

```bash
cd server-node
npm install
cp .env.example .env
npm run dev
```

Then test the endpoints:

```bash
# Test ping (no auth required)
curl -s http://localhost:4242/ping | jq .

# Test with authentication
export TOKEN="dev-token"
curl -s http://localhost:4242/orders/ORD-ABC123/status \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test idempotency
export IDEMP_KEY=$(uuidgen)
curl -s -X POST http://localhost:4242/demos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMP_KEY" \
  -d '{"name":"Jane Doe","email":"jane@example.com","time_window":"2025-08-16T09:00Z/2025-08-18T17:00Z"}' | jq .

# Run comprehensive test suite
./test-server.sh
```

---

## 8. Using the Test Scripts

We provide ready-to-use test scripts for all endpoints:

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

---

## What's Next?

- **Learn the API:** Check out the [API Reference](../spec/docs/api.md)
- **Understand the spec:** Read the [OpenAPI specification](../spec/openapi.json)
- **Build your own:** See our [reference implementation](../README.md#for-contributors--local-dev)
- **Explore examples:** Browse the [examples directory](../examples/)
