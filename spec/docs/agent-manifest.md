love it. here’s a crisp, shippable companion doc you can drop into the repo as
`spec/docs/agent-manifest.md` (it references the schema at `spec/schemas/agent.manifest.v1.json`).

---

# Action.txt — Agent Manifest (v1) Guide

*Companion to `spec/schemas/agent.manifest.v1.json`*

## Purpose

The **agent manifest** (`/.well-known/agent.json`) is a machine-readable index of safe, callable **actions** on a site/service. It complements `llms.txt` (content map) and links to the site’s **OpenAPI** description (source of truth for HTTP details).

Design goals:

* **Discoverable** (`.well-known`)
* **Interoperable** (OpenAPI, JSON Schema)
* **Safe by default** (auth scopes, rate limits, human review)
* **Performant** (small, cacheable, resolvable in one network roundtrip)

---

## File Location & Transport

* Path: `/.well-known/agent.json`
* Content-Type: `application/json`
* CORS: enable `GET` for `*` (read-only)
* Caching: set `ETag` and `Cache-Control: max-age=300`
* Security: **no secrets**; it’s public metadata

---

## Top-Level Structure (recap)

```json
{
  "version": "1.0",
  "name": "ACME Agent Actions",
  "description": "Safe, auditable actions exposed to AI agents.",
  "contact": { "email": "devrel@acme.com", "url": "https://acme.com/dev" },
  "links": {
    "openapi": "https://api.acme.com/openapi.json",
    "terms": "https://acme.com/terms",
    "privacy": "https://acme.com/privacy",
    "apiCatalog": "https://acme.com/.well-known/api-catalog"
  },
  "auth": {
    "type": "oauth2",
    "issuer": "https://id.acme.com",
    "flows": ["client_credentials"],
    "scopes": { "demo:schedule": "Schedule a product demo" }
  },
  "actions": [ /* see below */ ],
  "schemas": { /* embedded JSON Schemas referenced by actions */ }
}
```

### Field-by-field intent & considerations

#### `version` (required)

* SemVer **major.minor** for manifest schema version (e.g., `"1.0"`).
* **Rule:** breaking changes bump **major**; additive fields bump **minor**.
* **Consumer behavior:** reject unknown major; warn on newer minor.

#### `name`, `description` (required)

* Human-friendly identifiers (≤120 chars / ≤2000 chars).
* Useful for logs, UIs, ecosystem directories.

#### `contact` (optional)

* Where integrators report issues/security concerns.
* Keep accurate; surfaces in validator output.

#### `links` (required: `openapi`)

* `openapi` **must** point to OpenAPI 3.0+ JSON/YAML.
* `terms`, `privacy` aid compliance and legal review.
* `apiCatalog` optionally points to RFC 9727 API Catalog.

#### `auth` (recommended)

* `"type"`: `"none" | "api_key" | "oauth2"`.
* `"flows"`: OAuth2 flows you support (`client_credentials`, `authorization_code`).
* `"scopes"`: map of **action scopes** → description.
* **Guidance:** prefer OAuth2 with least-privilege scopes; support API key for demos only.

#### `actions` (required, non-empty)

Each action describes a callable capability and maps to an **OpenAPI operation**.

```json
{
  "id": "schedule_demo",
  "title": "Schedule a product demo",
  "description": "Creates a demo request and returns a calendar link.",
  "operationId": "Demos_Create",
  "auth_scope": "demo:schedule",
  "rate_limit": "60/min",           // see RL grammar below
  "idempotency": "supported",       // "supported" | "required" | "none"
  "human_review": "optional",       // "required" | "optional" | "none"
  "safety": { "pii": "disallowed", "sandbox": false },
  "input_schema": { "$ref": "#/schemas/ScheduleDemoInput" },
  "output_schema": { "$ref": "#/schemas/ScheduleDemoOutput" }
}
```

**Key constraints**

* `id`: kebab/snake/period OK, ASCII `[a-z0-9_.-]`; globally unique **within** manifest.
* `operationId`: **must** resolve to a single operation in linked OpenAPI.
* `input_schema`/`output_schema`: **JSON Schema Draft 2020-12** or later.
* `auth_scope`: SHOULD map to `auth.scopes` and to OpenAPI security.
* `human_review: required` → server SHOULD return `202 Accepted` with `review_url` and complete asynchronously (webhook/polling).
* `idempotency`: for **non-idempotent** POSTs, support/require `Idempotency-Key`.

#### `schemas` (optional, but recommended)

* Container for embedded JSON Schemas referenced from actions via `"$ref": "#/schemas/…"` to avoid long inlined schemas.
* **Performance:** smaller manifests resolve faster; keep schemas concise or `$ref` to your OpenAPI `components.schemas` if you prefer (both are allowed).

---

## OpenAPI Compatibility Rules

**Why:** The manifest is the AI-friendly layer; OpenAPI remains the transport contract.

Validator MUST:

1. **Fetch & parse** `links.openapi`.
2. **Resolve** each `action.operationId` → (method, path).
3. **Check security**: operation or global security must include a scheme compatible with `auth.type`; if `auth_scope` is set, it must be representable via that scheme.
4. **Schema compatibility**:

   * **Input**: `action.input_schema` must be a **superset** of the request contract (query/path/body). Practical rule of thumb: validator ensures *no required field is missing* from the union of OpenAPI params + requestBody schema.
   * **Output**: `action.output_schema` must accept the primary success response (2xx) body as a **subset** or equal (i.e., consumer won’t be surprised by missing fields). Recommended: reference the exact OpenAPI schema.
5. **Errors**: operation SHOULD define `401`, `403`, `429`, and a canonical `Error` schema.

**Note:** OpenAPI remains the authoritative source for URLs, methods, headers, content types, and error models.

---

## Rate Limit Grammar

String form: `"<count>/<window>"`, where:

* `<count>`: positive int
* `<window>`: `sec|min|hour|day` (singular or plural)
  Examples: `“60/min”`, `“10/sec”`, `“1000/day”`
* **Server** SHOULD emit `429` with `Retry-After` and, if possible, a `RateLimit-*` header family.

---

## Idempotency Semantics

* **Header:** `Idempotency-Key: <opaque-uuid>`
* **`supported`**: server de-duplicates retried requests with the same key for a bounded time window.
* **`required`**: server rejects non-idempotent requests missing the header (`400`).
* **Storage:** keep a small record `(key, actionId, hash(payload), status, response)`; expire after N hours.
* **Guidance:** only for non-idempotent operations (create, charge, place order).

---

## Human Review Workflow

When `human_review: required`:

* Synchronous request returns:

  ```json
  { "status":"pending", "review_url":"https://acme.com/review/abc", "ticket_id":"abc" }
  ```
* Completion via:

  * **Webhook**: POST to integrator callback with final result, or
  * **Polling**: `GET /actions/{ticket_id}` returns terminal state + output
* **Auditability:** include `X-Agent-Run-Id` in both directions for traceability.

---

## Safety Metadata

```json
"safety": {
  "pii": "disallowed | allowed_with_consent",
  "sandbox": true | false
}
```

* **PII**: signals payload sensitivity. Consumers may gate or refuse execution without explicit user consent.
* **sandbox**: indicates that an action only impacts test systems (never production).

---

## Headers & Observability (recommended)

* **`X-Agent-Run-Id`**: UUID for correlating multi-step workflows.
* **`User-Agent`**: identify the agent SDK (`ActionTxtClient/1.0 (+url)`).
* **`X-Client-Name` / `X-Client-Version`**: optional product identity.
* Log `(timestamp, actionId, subject, runId, caller, latency, outcome)`.

---

## Performance Considerations

* Keep manifest **small** (<100KB ideal).
* Prefer **embedded** concise schemas or `$ref` to OpenAPI `components`.
* Serve with gzip/br and a short **max-age** (e.g., 5 minutes) + strong `ETag`.
* Avoid per-request auth discovery: cache tokens by `auth_scope`.

**Consumer discovery algorithm (1 RTT path):**

1. `GET /.well-known/agent.json` (cacheable)
2. If new/changed, `GET links.openapi` (cacheable)
3. Resolve `operationId` and call

---

## Extensibility

* Unknown fields MUST be ignored by consumers.
* Vendors MAY add namespaced fields under `"x-"` prefix, e.g., `"x-billing": {...}`.
* Future spec versions may add fields; avoid tight JSON validators that reject unknown properties.

---

## Internationalization

* Text fields (`title`, `description`) SHOULD be English by default.
* For multi-locale: expose **per-locale manifests** at `/.well-known/agent.en.json`, `agent.es.json` and link them from `llms.txt` **or** use [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288) `Link: rel="alternate"; hreflang="…"` headers (optional enhancement).

---

## Security Checklist (producers)

* [ ] No secrets in manifest
* [ ] TLS everywhere
* [ ] OAuth2 or API key (demo) configured
* [ ] Scopes per action
* [ ] Rate limits enforced; `429` with `Retry-After`
* [ ] Idempotency for non-idempotent ops
* [ ] Human-review flow implemented for `required`
* [ ] Abuse contact published (`/.well-known/security.txt`)
* [ ] Logging & anomaly detection

---

## Consumer Responsibilities

* Validate manifest against schema.
* Validate input payloads against `input_schema` **before calling**.
* Respect `rate_limit`, `human_review`, and `safety` flags.
* Use `Idempotency-Key` for non-idempotent calls.
* Propagate `X-Agent-Run-Id` across steps.
* Back off on `429` per `Retry-After`.

---

## Conformance Levels (summary)

* **L1 – Discoverable:** valid manifest, OpenAPI link, ≥1 read-only action
* **L2 – Safe:** auth scopes, rate limits, idempotency for non-idempotent ops
* **L3 – Governed:** human review pipeline, audit headers, sandbox endpoints, API catalog link

A validator can badge sites: `L1` / `L2` / `L3`.

---

## Testing Strategy

* **Schema tests:** good manifest, unknown fields, missing required
* **Linkage tests:** broken `openapi`, missing `operationId`, security mismatch
* **Compat tests:** input/output schema compatibility
* **Runtime tests:** RL, idempotency, human-review path

---

## Common Pitfalls

* Overloading `input_schema` with UI-only fields (keep it API-relevant).
* Drifting from OpenAPI (update both together).
* Publishing without rate limits (will be flagged by validator).
* Marking `human_review: required` but returning `200` synchronously.

---

## Minimal “Hello, World” Manifest

```json
{
  "version": "1.0",
  "name": "Hello Actions",
  "description": "A tiny, read-only demo.",
  "links": { "openapi": "https://hello.example.com/openapi.json" },
  "auth": { "type": "none" },
  "actions": [{
    "id": "ping",
    "title": "Ping",
    "description": "Returns a simple pong.",
    "operationId": "Ping_Get",
    "rate_limit": "10/sec",
    "idempotency": "none",
    "human_review": "none",
    "safety": { "pii": "disallowed", "sandbox": true },
    "input_schema": { "type": "object", "additionalProperties": false },
    "output_schema": {
      "type": "object",
      "required": ["message"],
      "properties": { "message": { "type": "string", "const": "pong" } }
    }
  }]
}
```