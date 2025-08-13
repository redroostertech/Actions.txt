# Action.txt — Full FAQ

This FAQ combines launch questions and common objections with detailed responses.

---

## What is Action.txt?
Action.txt is an open standard that lets any website safely expose machine-readable actions for AI agents.  
Where [`llms.txt`](https://github.com/AnswerDotAI/llms-txt) points AI to content, Action.txt points them to capabilities.

---

## How does it work?
1. Add an `## Actions` section to your `llms.txt` pointing to `.well-known/agent.json`.
2. Publish a machine-readable manifest (`agent.json`) describing your actions, input/output schemas, and safety rules.
3. Optionally link it via `.well-known/api-catalog` for standards-based discovery.

---

## Is it safe?
Yes — the spec is opt-in and includes:
- **Authentication scopes** per action.
- **Rate limits** to prevent abuse.
- **Sandbox endpoints** for safe testing.
- **Human-review flags** for sensitive operations.
- **Idempotency key support** to prevent replay attacks.

---

## What’s the difference between Action.txt and `llms.txt`?
- **`llms.txt`** — Human-readable content guidance for AI.
- **Action.txt** — Machine-readable action definitions for AI.

They complement each other to make a site fully agent-ready.

---

## Isn’t this just another API catalog?
No. Action.txt is a profile of existing discovery standards like `/.well-known/api-catalog` and OpenAPI, but adds AI-specific metadata for safe autonomous execution.

---

## Do I have to support every AI vendor?
No. Action.txt is vendor-neutral and designed to work with any agent ecosystem.

---

## Can I start with safe, read-only actions?
Absolutely. Many sites will begin with read-only actions before exposing transactional capabilities.

---

## What if I don’t want AI automating my service?
Then simply don’t publish Action.txt or `.well-known/agent.json`. It’s entirely opt-in.

---

# Common Objections & Responses

### 1. “We already have discovery standards”
Action.txt builds on existing standards (OpenAPI, JSON Schema, RFC 9727) — it’s not reinventing the wheel, it’s a profile with AI-specific fields.

### 2. “Security surface is too big”
Only sites that opt in are discoverable. The spec requires strong auth, rate limits, and human-review flags for high-risk operations.

### 3. “This encourages LLMs to act without oversight”
Safety is first-class: you can mark actions as read-only, sandboxed, or requiring human approval.

### 4. “Vendors will ignore it”
Grassroots adoption through open-source agents will create pressure for wider vendor support.

### 5. “We can already link APIs in `llms.txt`”
Yes, but `llms.txt` is for humans. Action.txt is machine-parseable for automated execution.

### 6. “We don’t want AI automating our service”
Don’t publish it. Participation is 100% optional.

### 7. “This will fragment the web”
Action.txt exists to prevent fragmentation — one open schema instead of many competing formats.

### 8. “This is just for LLMs”
It’s model-agnostic — any agent, multimodal system, or automation platform can consume it.

---
