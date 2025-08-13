# Action.txt — Validator Rules (v1 First Pass)

The validator ensures `agent.json` is correct, safe, and compatible with the linked OpenAPI spec.

## 1) Manifest Integrity
- [ ] JSON Schema validation passes against `agent.manifest.v1.json`.
- [ ] `version` is `major.minor`. Consumer rejects unknown `major`.
- [ ] No unknown top-level fields except `x-*`.
- [ ] Size < 100KB (warn if larger).
- [ ] Served with `Content-Type: application/json` (warn otherwise).

## 2) Links & Fetch
- [ ] `links.openapi` is a reachable URI (HTTP 200).
- [ ] OpenAPI is 3.0+ (reject < 3.0).
- [ ] If `links.apiCatalog` present, it is reachable (warn on failure).

## 3) Actions ↔ OpenAPI Linkage
For each action:
- [ ] `operationId` exists and uniquely identifies one operation.
- [ ] Operation defines at least one `2xx` response.
- [ ] Security:
  - If manifest `auth.type != none`, OpenAPI defines compatible security scheme.
  - If `auth_scope` set, it is representable in OpenAPI security (warn if mismatch).
- [ ] Rate limits:
  - `rate_limit` matches grammar `<count>/<window>`. (warn if missing)
- [ ] Idempotency:
  - If action is non-idempotent (heuristic: POST without `operationId` prefix `get/list`), then `idempotency` is `supported` or `required` (warn otherwise).

## 4) Schema Compatibility
- [ ] **Input**: `input_schema` is compatible with OpenAPI request:
  - Required fields present for `path` and `query` params.
  - If requestBody exists, all OpenAPI-required body fields are present in `input_schema`.
- [ ] **Output**: `output_schema` accepts the primary 2xx response:
  - If OpenAPI response schema is referenced, `output_schema` is equal or a superset (no missing required fields expected by the client).
  - Warn if response content-types differ from `application/json`.

## 5) Safety & Governance
- [ ] `human_review`:
  - If `required`, warn if OpenAPI response is not `202` or no `review_url` is documented in response schema.
- [ ] `safety.pii` present for actions likely to carry user data (heuristic: fields named email, ssn, phone).
- [ ] `safety.sandbox`:
  - If `true`, OpenAPI path SHOULD include a sandbox marker or be served from a sandbox subdomain (warn if ambiguous).

## 6) Auth Model Consistency
- [ ] If `auth.type = api_key`, `auth.in` and (`header` or `param`) must be provided.
- [ ] If `auth.type = oauth2`, `issuer` and at least one `flows[]` entry required.
- [ ] If `auth.scopes` present, each `action.auth_scope` SHOULD be listed.

## 7) Headers & Observability (Advisory)
- [ ] Server examples mention `Idempotency-Key` and `X-Agent-Run-Id`.
- [ ] OpenAPI documents 401, 403, 429 with a canonical `Error` schema (warn if missing).

## 8) Conformance Levels
- **L1 (Discoverable)** — Manifest valid; OpenAPI link valid; ≥1 read-only action; basic schemas present.
- **L2 (Safe)** — Auth configured; action scopes mapped; rate limits set; idempotency for non-idempotent ops.
- **L3 (Governed)** — Human-review flow implemented; audit/trace headers documented; sandbox endpoints available; API catalog linked.

The CLI SHOULD display the achieved level and suggestions to reach the next level.