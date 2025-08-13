# Action.txt — Architecture & Data Flows

This document explains how **Action.txt** fits into your stack, how agents discover and call capabilities, and how producers/consumers should handle auth, idempotency, and rate limits.

> Diagrams use Mermaid, which renders natively on GitHub. You can later export to SVG/PNG if needed.

---

## 1) High-Level System Overview

```mermaid
flowchart LR
  subgraph Site["API Provider (Your Service)"]
    LLMS["llms.txt"]
    MANIFEST["/.well-known/agent.json"]
    OPENAPI["/spec/openapi.(json|yaml)"]
    API["HTTP API (per OpenAPI)"]
  end

  Agent["AI Agent / Client SDK"]
  User["End User"]

  User -->|Intent: schedule demo| Agent
  Agent -->|Discover| LLMS
  Agent -->|Find actions link| MANIFEST
  Agent -->|Resolve operations| OPENAPI
  Agent -->|Invoke action with auth headers| API

  classDef agent fill:#eef,stroke:#66f,stroke-width:1px;
  classDef user fill:#efe,stroke:#5b5,stroke-width:1px;
  class Agent agent;
  class User user;
```

**Key roles**

* `llms.txt` → tells agents *where* actions live.
* `/.well-known/agent.json` → lists *what* actions exist (ids, schemas, safety).
* `openapi.(json|yaml)` → defines *how* to call them (paths, methods, headers).
* API → implements behavior with auth, rate limits, and idempotency.

---

## 2) Discovery & Invocation (Happy Path)

```mermaid
sequenceDiagram
  autonumber
  participant A as Agent/SDK
  participant W as Website
  participant M as WellKnownAgentJson
  participant O as OpenAPI
  participant S as ServiceAPI

  A->>W: GET /llms.txt (or site root)
  W-->>A: 200 contains link to /.well-known/agent.json

  A->>M: GET /.well-known/agent.json
  M-->>A: 200 version + actions + links.openapi

  A->>O: GET /spec/openapi.json
  O-->>A: 200 OpenAPI 3.x

  Note over A: Validate action.operationId maps to OpenAPI operation

  A->>S: POST /demos\nHeaders: Authorization, Idempotency-Key, X-Agent-Run-Id\nBody: ScheduleDemoInput
  S-->>A: 201 ScheduleDemoOutput or 202 pending human review
```

**Performance notes**

* Cache `agent.json` and OpenAPI (`ETag`, `max-age ~5m`).
* Pre-validate payloads client-side against `input_schema`.

---

## 3) Minimal Integration Architecture (Node/TS)

```mermaid
flowchart TB
  subgraph Repo
    subgraph server-node/src
      IDX[index.ts]
      MW_auth[middleware/auth.ts]
      MW_rl[middleware/rateLimit.ts]
      MW_err[middleware/errorHandler.ts]
      LIB_idem[lib/idempotency.ts]
      R_static[routes/static.ts]
      R_ping[routes/ping.ts]
      R_orders[routes/orders.ts]
      R_demos[routes/demos.ts]
      R_quotes[routes/quotes.ts]
    end
    EX_manifest[examples/.well-known/agent.json]
    SPEC_json[spec/openapi.json]
    SPEC_yaml[spec/openapi.yaml]
  end

  IDX --> R_static
  IDX --> R_ping
  IDX --> R_orders
  IDX --> R_demos
  IDX --> R_quotes
  R_orders --> MW_auth
  R_demos --> MW_auth
  R_quotes --> MW_auth
  R_demos --> MW_rl
  R_orders --> MW_rl
  R_quotes --> MW_rl
  R_demos --> LIB_idem
  R_static --> EX_manifest
  R_static --> SPEC_json
  R_static --> SPEC_yaml
```

**Responsibilities**

* `routes/*` match OpenAPI operations.
* `auth.ts` enforces Bearer token (JWT optional).
* `rateLimit.ts` sets per-action buckets + `Retry-After`.
* `idempotency.ts` caches POST `/demos` responses by `Idempotency-Key`.
* `errorHandler.ts` returns `{code,message,details?}` per `Error` schema.

---

## 4) Idempotency & Rate Limit Semantics

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant M as Middleware
  participant S as Service

  C->>M: POST /demos (Idempotency-Key: K, Body: B)
  M->>M: Compute hash H(B); lookup K
  alt Cache hit and same hash
    M-->>C: 201/202 cached response
  else No cache entry
    M->>S: Forward request
    S-->>M: 201/202 response
    M->>M: Store {K, H, response}
    M-->>C: 201/202 response
  end
```

Rate limiting

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant M as RateLimiter
  participant S as Service

  loop Burst requests
    C->>M: POST /demos
    alt Over limit
      M-->>C: 429 Too Many Requests\nHeader: Retry-After
    else Under limit
      M->>S: Forward
      S-->>M: 2xx
      M-->>C: 2xx
    end
  end
```

**Rules**

* **Idempotency-Key** is **required** on non-idempotent POSTs.
* Cache lifetime = `IDEMP_TTL_SECONDS`.
* If **same key, different payload hash** → **recommend 409 Conflict** (or treat as independent; document behavior).

---

## 5) Error Model & Negative Paths

```mermaid
flowchart LR
  A[Agent] -->|No/Bad token| S[Service]
  S -->|401 Unauthorized| A
  A -->|Too many requests| S
  S -->|429 Rate Limited<br/>Retry-After: 30| A
  A -->|Schema mismatch| S
  S -->|400 Bad Request| A

  class S,A default
```

**Error payload (canonical):**

```json
{
  "code": "string",
  "message": "human-readable",
  "details": { "context": "optional object" }
}
```

**OpenAPI alignment**

* Reuse `components.schemas.Error` in all named responses (`Unauthorized`, `RateLimited`, etc.).

---

## 6) Data Contracts: Manifest ↔ OpenAPI ↔ Runtime

```mermaid
flowchart TB
  subgraph Manifest["agent.json (Manifest layer)"]
    A1[id, title, description]
    A2[operationId]
    A3[input_schema / output_schema]
    A4[auth_scope, rate_limit, idempotency, human_review, safety]
  end

  subgraph OpenAPI["openapi.json (Transport layer)"]
    O1[paths + methods]
    O2[parameters + requestBody]
    O3[responses + components.schemas]
    O4[securitySchemes + scopes]
  end

  subgraph Runtime["Service (Execution layer)"]
    R1[Auth middleware]
    R2[Rate limiter]
    R3[Idempotency store]
    R4[Handlers]
  end

  A2 --> O1
  A3 --> O2
  A3 --> O3
  A4 --> O4
  O1 --> R4
  O2 --> R4
  O3 --> R4
  O4 --> R1
  A4 --> R2
  A4 --> R3
```

**Validator checks**

* Every `action.operationId` exists in OpenAPI.
* `input_schema` covers required request fields; `output_schema` matches 2xx response.
* `auth_scope` appears in OpenAPI security.

---

## 7) Observability & Headers

```mermaid
sequenceDiagram
  participant Agent
  participant API
  Agent->>API: POST /demos<br/>Authorization, Idempotency-Key, X-Agent-Run-Id
  API-->>Agent: 201 + Location<br/>Headers: Retry-After (when 429), ETag (optional)
  Note over API: Log fields: {actionId, runId, caller, status, latencyMs, payloadHash}
```

**Required/Recommended headers**

* `Authorization: Bearer <token>` (required except `/ping`)
* `Idempotency-Key: <uuid>` (required on POST `/demos`)
* `X-Agent-Run-Id: <uuid>` (optional correlation)
* `Retry-After` on `429` responses
* `Content-Type: application/json` and consistent charset

---

## 8) Deployment Topology (Examples)

```mermaid
flowchart LR
  CDN["CDN / Edge Cache"]
  WAF["WAF / Firewall"]
  GW["API Gateway / rate limit & auth"]
  APP["App Service (Express)"]
  DB["Backing Store"]
  FILES["Static Files: agent.json and openapi"]

  CDN --> WAF --> GW --> APP --> DB
  APP --> FILES
```

**Recommendations**

* Serve `agent.json` & `openapi` via static hosting/CDN.
* Put rate limiting either at gateway or middleware (or both).
* Keep idempotency store in memory for demo; use Redis for production.

---

## 9) Security & Privacy Considerations

* **Auth**: Prefer OAuth2 client-credentials; accept API keys only for demo/sandbox.
* **PII**: Use `safety.pii` in manifest to signal handling rules; mask PII in logs.
* **Scopes**: Map `action.auth_scope` → OpenAPI security → gateway policy.
* **Human review**: For `human_review: required`, return `202` + `review_url` and finalize asynchronously.

---

## 10) End-to-End Validation Flow

```mermaid
stateDiagram-v2
  [*] --> Start
  Start --> StaticFiles: GET /.well-known/agent.json and /spec/openapi.json
  StaticFiles --> Ping: GET /ping
  Ping --> AuthNeg: GET /orders/... without token -> 401
  AuthNeg --> Orders: GET /orders/... with token -> 200
  Orders --> Demos1: POST /demos with Idempotency-Key
  Demos1 --> Demos2: repeat same key -> cached 201 or 202
  Demos2 --> RL: exceed rate limit -> 429
  RL --> Sandbox: POST /quotes:sandbox -> 200
  Sandbox --> [*]
```

**Cross-check with:**

* `/docs/quickstart.md` cURL
* `examples/site/scripts/*.sh`
* `spec/openapi.(json|yaml)`
* `spec/schemas/agent.manifest.v1.json`

---

## 13) Reference Implementation Architecture

Our Node.js + TypeScript server demonstrates the complete Action.txt architecture:

### Server Structure
```
server-node/
├── src/
│   ├── config.ts              # Environment configuration
│   ├── index.ts               # Express server with middleware
│   ├── lib/                   # Core utilities
│   │   ├── errors.ts          # Error handling & schemas
│   │   ├── log.ts             # Pino structured logging
│   │   ├── ajv.ts             # JSON Schema validation
│   │   └── idempotency.ts     # Idempotency store with TTL
│   ├── middleware/             # Express middleware
│   │   ├── auth.ts            # Bearer token authentication
│   │   ├── rateLimit.ts       # Per-route rate limiting
│   │   └── errorHandler.ts    # Central error handling
│   └── routes/                 # API endpoints
│       ├── static.ts           # Static file serving
│       ├── ping.ts             # Health check
│       ├── orders.ts           # Order status
│       ├── demos.ts            # Demo scheduling
│       └── quotes.ts           # Quote generation
```

### Performance Characteristics
- **Response Time**: <10ms for simple endpoints
- **Rate Limiting**: Configurable per-endpoint (e.g., 10/sec, 60/min)
- **Idempotency**: TTL-based with automatic cleanup
- **Memory Usage**: ~50MB baseline, scales with request volume

### Key Implementation Features
- **OpenAPI Compliance**: Full 3.0.3 specification implementation
- **Authentication**: OAuth2 Bearer token with scope validation
- **Rate Limiting**: Express-rate-limit with Retry-After headers
- **Idempotency**: In-memory store with payload hashing and TTL
- **Error Handling**: Centralized middleware with consistent Error schema
- **Logging**: Pino structured logging with request correlation
- **Security**: Helmet, CORS, and comprehensive input validation

### Testing & Validation
- **Automated Test Suite**: `./test-server.sh` covers all endpoints
- **Mock Data**: Realistic test scenarios for development
- **Error Simulation**: Tests for rate limiting, validation, and auth failures
- **Performance Testing**: Response time and memory usage validation

---

## 11) File Map & Links

* Manifest: `/.well-known/agent.json` → `examples/.well-known/agent.json`
* OpenAPI: `/spec/openapi.json` / `/spec/openapi.yaml`
* Validator Rules: `spec/docs/validator-rules.md`
* Agent Manifest Guide: `spec/docs/agent-manifest.md`
* Quickstart (cURL): `docs/quickstart.md`

---

## 12) Appendix — Rendering & Exporting Diagrams

* GitHub renders Mermaid automatically.
* To export locally:

  * Install Mermaid CLI: `npm i -g @mermaid-js/mermaid-cli`
  * Convert: `mmdc -i docs/ARCHITECTURE.md -o diagrams/overview.svg` (or copy code blocks to `.mmd` files)

---

**Last updated:** 2025-08-13