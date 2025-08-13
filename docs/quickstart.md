# Quick Start

Follow these steps to start using the ActionTxt Demo API.

---

## 1. Get an Access Token

Request a token using the **client credentials** flow. Replace `CLIENT_ID` and `CLIENT_SECRET` with your credentials.

```bash
curl -s -X POST "https://id.demo.actiontxt.org/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  | jq .
````

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

A healthy API will respond with something like:

```json
{ "ping": "pong" }
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

## 4. Explore More Endpoints

See the [API Reference](./openapi.json) for details on:

* Checking order status
* Creating sandbox quotes
* Error formats and response codes



Yes — they should be **combined**, but not in the sense of cramming all the server setup into `/docs/quickstart.md`.
Here’s the right split:

* **`/docs/quickstart.md`** → Should stay focused on **how to hit the live/demo API** (like your current cURL flow).
* **`README.md` Quick Start** → Can cover **local development** and running your own minimal Express server (helpful for contributors or self-hosters).

That way:

* New **API consumers** go to `/docs/quickstart.md` and follow the OAuth → cURL steps.
* **Developers/contributors** go to the root README and follow the `npm run dev` + local server instructions.

We just need to **link the two** and point both at the new `/spec/openapi.json` (and the `/examples/openapi.json` if it’s relevant).

Here’s how I’d update `/docs/quickstart.md` so it references the OpenAPI spec and stays API-consumer focused:

---

````md
# Quick Start

Follow these steps to start using the ActionTxt Demo API.

---

## 1. Get an Access Token

Request a token using the **client credentials** flow. Replace `CLIENT_ID` and `CLIENT_SECRET` with your credentials.

```bash
curl -s -X POST "https://id.demo.actiontxt.org/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  | jq .
````

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
{ "ping": "pong" }
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

## 4. Explore More Endpoints

See the API Reference for details on:

* Checking order status
* Creating sandbox quotes
* Error formats and response codes

- **Machine-readable spec:** [`/spec/openapi.json`](../spec/openapi.json)
- **Examples:** [`/examples/openapi.json`](../examples/openapi.json)
- **Human-readable docs:** Coming soon via Swagger UI / Redoc

---

## 5. Running Locally

If you want to spin up your own ActionTxt-compatible server for testing or development, see the **[Local Development Quick Start](../README.md#-quick-start)** in the root README.
