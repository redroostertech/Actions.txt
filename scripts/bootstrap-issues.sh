#!/usr/bin/env bash
set -euo pipefail

REPO="redroostertech/Actions.txt"

# Optionally create milestones first (comment out if not desired)
create_milestone() {
  local title="$1" desc="$2" due="$3"
  gh api -X POST repos/$REPO/milestones \
    -f title="$title" \
    -f description="$desc" \
    -f due_on="$due" >/dev/null || true
}
# Uncomment if you want milestones:
# create_milestone "v1.1 API Improvements" "Incremental API and docs polish." "2025-09-30T00:00:00Z"
# create_milestone "v2.0 Feature Expansion" "New capabilities and breaking changes." "2026-01-31T00:00:00Z"

# Create labels (idempotent)
create_label() {
  local name="$1" color="$2" desc="$3"
  gh api -X POST repos/$REPO/labels \
    -f name="$name" -f color="$color" -f description="$desc" >/dev/null 2>&1 || true
}
create_label "api"          "0e8a16" "Backend/API related changes"
create_label "documentation" "1d76db" "Docs, guides, diagrams"
create_label "dx"           "5319e7" "Developer experience improvements"
create_label "community"    "fbca04" "Contribution & collaboration"
create_label "future"       "c0c0c0" "Exploratory / not yet prioritized"

create_issue() {
  local title="$1" body="$2" labels="$3" milestone="${4:-}"
  if [[ -n "$milestone" ]]; then
    gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$labels" --milestone "$milestone"
  else
    gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$labels"
  fi
}

# 1) API Enhancements
create_issue "Consolidate OpenAPI schemas (single components.schemas)" \
"**Goal**  
Ensure all schemas live under \`components.schemas\` once, referenced by \`components.responses\`.

**Tasks**
- Move/merge any duplicates
- Ensure \`Error\` is only defined once
- Validate references across all paths

**Refs**
- \`/spec/openapi.json\`, \`/spec/openapi.yaml\`  
- \`/spec/docs/api.md\`" \
"api"

create_issue "Expand error models with consistent examples" \
"**Goal**  
Standardize error payloads across endpoints with examples.

**Tasks**
- Ensure \`components.responses\` reuse \`Error\` schema
- Add example payloads and error codes
- Document handling guidance in \`/spec/docs/api.md\`

**Refs**: \`/spec/openapi.json\`, \`/spec/docs/api.md\`" \
"api,documentation"

create_issue "Add pagination support to list endpoints" \
"**Goal**  
Introduce pagination conventions for future list endpoints.

**Tasks**
- Choose pattern: \`limit/offset\` or \`cursor\`
- Define common parameters and response envelope
- Add to OpenAPI + docs

**Refs**: \`/spec/openapi.json\`, \`/spec/docs/api.md\`" \
"api,documentation"

create_issue "Implement webhook/event support for demo updates" \
"**Goal**  
Allow async status updates via webhook or polling.

**Tasks**
- Define webhook endpoint schema (headers, auth, retries)
- Add callback examples in OpenAPI
- Document in \`/spec/docs/api.md\`

**Refs**: \`/spec/openapi.json\`, \`spec/docs/agent-manifest.md\` (human_review section)" \
"api,documentation"

# 2) Documentation Improvements
create_issue "Integrate local server instructions with cURL Quick Start" \
"**Goal**  
Make \`/docs/quickstart.md\` the single entry point for API usage (live + local).

**Tasks**
- Keep cURL flow for demo server
- Link to README local dev section
- Cross-link OpenAPI + API reference

**Refs**: \`/docs/quickstart.md\`, \`/README.md\`" \
"documentation,dx"

create_issue "Publish API Reference with GitHub Pages (Redoc/Swagger UI)" \
"**Goal**  
Host a readable API reference.

**Tasks**
- Add \`/docs/index.html\` with Redoc (or Swagger UI)
- Point to \`/spec/openapi.yaml\`
- Enable GitHub Pages

**Refs**: \`/spec/docs/api.md\`, \`/spec/openapi.yaml\`" \
"documentation,dx"

create_issue "Add request/response flow diagram to docs" \
"**Goal**  
Visualize auth → request → idempotency → responses.

**Tasks**
- Create diagram (SVG/PlantUML/Mermaid)
- Embed in \`/docs/quickstart.md\` and \`/spec/docs/api.md\`" \
"documentation"

create_issue "Write Error Handling Guide with codes & resolutions" \
"**Goal**  
Give integrators a single place to understand failures.

**Tasks**
- Enumerate common HTTP codes (400/401/403/404/409/429)
- Provide remediation and examples
- Link from Quick Start and API reference

**Refs**: \`/spec/docs/api.md\`" \
"documentation"

# 3) Developer Experience
create_issue "Convert cURL examples to runnable scripts under /examples/site/scripts" \
"**Goal**  
Provide ready-to-run scripts for all examples.

**Tasks**
- \`ping.sh\`, \`order_status.sh\`, \`schedule_demo.sh\`, \`create_quote_sandbox.sh\`
- Add \`smoke.sh\` to run all
- Document in \`/docs/quickstart.md\`

**Refs**: \`/examples/site/scripts/\`, \`/docs/quickstart.md\`" \
"dx,documentation"

create_issue "Publish Postman/Insomnia collection" \
"**Goal**  
Make API testing easy without code.

**Tasks**
- Build Postman collection mapping to OpenAPI
- Include environment with \`BASE_URL\` and \`TOKEN\`
- Add docs and link in README" \
"dx,documentation"

create_issue "Add .env.example for local config" \
"**Goal**  
Standardize local env variables.

**Tasks**
- \`BASE_URL\`, \`TOKEN\`, optional \`CLIENT_ID/SECRET\`
- Document usage in README and Quick Start" \
"dx,documentation"

create_issue "Add Makefile commands for common tasks" \
"**Goal**  
One-liners for contributors.

**Tasks**
- \`make docs\`, \`make validate\`, \`make smoke\`
- Wire validator + scripts" \
"dx"

# 4) Community & Contribution
create_issue "Add CONTRIBUTING.md with PR/issue guidelines" \
"**Goal**  
Lower the bar for external contributors.

**Tasks**
- Coding style, commit format, PR checklist
- How to run tests/validator locally
- Code of Conduct link (optional)" \
"community,documentation"

create_issue "Create GitHub issue templates (bug/feature/docs)" \
"**Goal**  
Structured issue intake.

**Tasks**
- \`.github/ISSUE_TEMPLATE/bug_report.md\`
- \`.github/ISSUE_TEMPLATE/feature_request.md\`
- \`.github/ISSUE_TEMPLATE/docs_update.md\`" \
"community,documentation"

create_issue "Start and maintain CHANGELOG.md (SemVer)" \
"**Goal**  
Track changes for users of the spec.

**Tasks**
- Add \`CHANGELOG.md\` seeded with v1.0.0
- Update on each release" \
"community"

create_issue "Enable GitHub Discussions for Q&A" \
"**Goal**  
Centralize community support.

**Tasks**
- Enable Discussions in repo settings
- Seed categories: Q&A, Ideas, Announcements" \
"community"

# 5) Future Features (Exploratory)
create_issue "Sandbox Ordering API (mock data)" \
"**Goal**  
Extend demo beyond read-only to a safe transactional flow.

**Tasks**
- Define endpoints and schemas
- Provide deterministic mock data
- Scripts + docs" \
"future,api,documentation"

create_issue "CLI tool (Node or Python) for calling the API" \
"**Goal**  
Zero-setup calls for demos and CI.

**Tasks**
- Simple auth + invoke wrapper
- Commands: ping, schedule-demo, order-status, quote-sandbox
- Package and docs" \
"future,dx"

create_issue "WebSocket streaming for live updates (optional)" \
"**Goal**  
Demonstrate push-based status updates.

**Tasks**
- Define WS channel & message schema
- Add example client
- Document fallbacks (polling/webhooks)" \
"future,api,documentation"

echo "✅ Issues bootstrapped in $REPO"
