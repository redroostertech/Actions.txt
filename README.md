# Action.txt  

**An open standard for making the web agent-friendly.**  

Action.txt lets any website safely expose **machine-readable actions** to AI agents.  
Where [`llms.txt`](https://github.com/AnswerDotAI/llms-txt) guides AI to *content*, **Action.txt** guides AI to *capabilities*.  

---

## 📑 Table of Contents
- [🌟 Why We Created Action.txt](#-why-we-created-actiontxt)
- [🚀 Why Action.txt?](#-why-actiontxt)
- [🔮 Vision](#-vision)
- [📂 How It Works](#-how-it-works)
- [📝 Example](#-example)
- [📐 Architecture at a Glance](#-architecture-at-a-glance)
- [🚀 Quick Start](#-quick-start)
  - [For API Consumers](#for-api-consumers)
  - [For Contributors / Local Dev](#for-contributors--local-dev)
- [🔒 Safety by Design](#-safety-by-design)
- [📜 Specification](#-specification)
- [🤝 Contributing](#-contributing)
- [📣 Community & Adoption](#-community--adoption)
- [❓ FAQ (Quick Answers)](#-faq-quick-answers)
  - [View Full FAQ's ](docs/FAQ.md)
- [📄 License](#-license)

---

## 🌟 Why We Created Action.txt

The web was built for humans, but AI agents are becoming an active part of it.

Right now, most AI agents interact with the web the same way humans did in 1995 — by reading pages and trying to guess what to click or fill out.  
It works for content, but it’s fragile and risky for actions like scheduling, ordering, or retrieving private data.

**We saw a gap:**

- No open, vendor-neutral way to tell an AI what it *can* do on your site.
- No safe, structured way to expose capabilities with authentication, rate limits, and human oversight.
- No common language across platforms, so every vendor reinvents their own manifest.

**Action.txt** closes that gap by:

- Pairing with `llms.txt` to tell AI both *what* your site says and *what* it can do.
- Defining an open, machine-readable manifest (`agent.json`) for actions, grounded in web standards.
- Putting site owners in full control of what’s exposed — and how.

---

## 🚀 Why Action.txt?

- **Discoverability** — Let AI agents find and understand what actions your site supports.  
- **Safety** — Define authentication, rate limits, and human-review requirements per action.  
- **Interoperability** — Vendor-neutral, built on open web standards like OpenAPI, JSON Schema, and `.well-known` URIs.  
- **Control** — You decide exactly which actions are exposed, and how they can be used.  

---

## 🔮 Vision

We imagine a future where:

- Every website and API that wants to be agent-friendly can be, with just two small files.
- AI agents — from personal assistants to enterprise bots — can discover and execute safe, approved actions without custom integrations.
- Open standards prevent fragmentation between AI ecosystems, just like RSS and sitemaps did for content.
- Safety and governance are built-in from the start, so the agent-driven web is transparent, controllable, and trustworthy.

Action.txt is the first step toward that future.

---

## 📂 How It Works

1. **Add an `## Actions` section to your `llms.txt`**

   Example:
   ```markdown
   ## Actions
   For automated capabilities, see:
   - /.well-known/agent.json```

2. **Publish a machine-readable manifest at `.well-known/agent.json`**

   * Lists each action you want to expose.
   * Defines input/output schemas, auth requirements, and safety flags.
   * Links to your OpenAPI spec for implementation details.

3. **(Optional)** Publish `/.well-known/api-catalog` (RFC 9727) linking to your `agent.json` and OpenAPI description.

---

## 📝 Example

**`llms.txt`**

```markdown
# About ExampleCo
We provide product data, order tracking, and demo scheduling.

## Actions
For machine-readable actions, see:
- /.well-known/agent.json
```

**`/.well-known/agent.json`**

```json
{
  "version": "1.0",
  "name": "ExampleCo Agent Actions",
  "description": "Safe, auditable actions for AI agents.",
  "links": {
    "openapi": "https://api.example.com/openapi.json",
    "terms": "https://example.com/terms",
    "privacy": "https://example.com/privacy"
  },
  "auth": {
    "type": "oauth2",
    "flows": ["client_credentials"],
    "scopes": {
      "demo:schedule": "Schedule a demo",
      "order:status": "Check order status"
    }
  },
  "actions": [
    {
      "id": "schedule_demo",
      "title": "Schedule a product demo",
      "operationId": "Demos_Create",
      "input_schema": { "$ref": "#/schemas/ScheduleDemoInput" },
      "output_schema": { "$ref": "#/schemas/ScheduleDemoOutput" },
      "auth_scope": "demo:schedule",
      "rate_limit": "60/min",
      "human_review": "optional",
      "safety": { "pii": "disallowed" }
    }
  ],
  "schemas": {
    "ScheduleDemoInput": {
      "type": "object",
      "required": ["name", "email", "time_window"],
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "time_window": { "type": "string", "description": "ISO8601 interval" }
      }
    },
    "ScheduleDemoOutput": {
      "type": "object",
      "properties": {
        "ticket_id": { "type": "string" },
        "calendar_link": { "type": "string", "format": "uri" }
      }
    }
  }
}
```

---

## 📐 Architecture at a Glance

The **ActionTxt API** follows a clean, modular design for scalability, security, and ease of integration.

**Core Components:**

* **Client Applications** → Make secure calls using OAuth2.
* **API Gateway** → Handles authentication, rate limiting, and routing.
* **Core API Services** → Implements business logic and endpoint processing.
* **Data Layer** → Stores persistent entities (e.g., demos, orders).
* **Spec & Schema** → `openapi.json` and JSON Schemas ensure consistent contracts.

**Flow Overview:**

1. Client requests an OAuth2 token.
2. Token-authenticated requests hit the API Gateway.
3. Gateway routes to Core API Services.
4. Services validate against schemas → persist or retrieve data.
5. Response returned in standardized JSON format.

**Visual Diagram:**
![Architecture Diagram](./spec/docs/architecture-diagram.png)

🔗 **Full Details:** See [Architecture.md](./docs/ARCHITECTURE.md) for component descriptions, data flow diagrams, and integration notes.

---

## 🚀 Quick Start

### For API Consumers
If you just want to use the **ActionTxt Demo API**, follow the [detailed Quick Start](docs/quickstart.md).  
Here’s the condensed version:

```bash
# 1. Get a token (replace CLIENT_ID / CLIENT_SECRET)
curl -s -X POST "https://id.demo.actiontxt.org/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  | jq .

# 2. Export it
export TOKEN="your_access_token_here"

# 3. Test the API
curl -s https://demo.actiontxt.org/ping \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
````

**API Reference:**

* Machine-readable spec: [`/spec/openapi.json`](spec/openapi.json)
* Human-readable docs: [`/spec/docs/api.md`](spec/docs/api.md)
* Examples: [`/examples/openapi.json`](examples/openapi.json)

---

### For Contributors / Local Dev

If you're working on Action.txt itself:

```bash
git clone https://github.com/<your-org>/action-txt.git
cd action-txt/server-node
npm install
cp .env.example .env
npm run dev
```

This runs a **production-ready Node.js + TypeScript server** that implements:
- All endpoints from the OpenAPI specification
- OAuth2 Bearer token authentication
- Per-route rate limiting with Retry-After headers
- Idempotency support for safe retries
- Structured logging and error handling
- Static file serving for agent.json and OpenAPI specs

**Server Features**:
- ✅ OpenAPI 3.0.3 Compliance
- ✅ Authentication & Authorization
- ✅ Rate Limiting & Idempotency
- ✅ Security Middleware (Helmet, CORS)
- ✅ Mock Data for Testing
- ✅ Comprehensive Error Handling

**Quick Test**:
```bash
# Test ping (no auth required)
curl -s http://localhost:4242/ping | jq .

# Test with authentication
export TOKEN="dev-token"
curl -s http://localhost:4242/orders/ORD-ABC123/status \
  -H "Authorization: Bearer $TOKEN" | jq .

# Run comprehensive test suite
./test-server.sh
```

---

## 🔒 Safety by Design

* **Authentication scopes** per action.
* **Rate limits** to prevent abuse.
* **Human-review flags** for sensitive operations.
* **Sandbox support** for testing integrations.
* **Idempotency keys** for safe retries.

---

## 📜 Specification

The full specification is maintained in [`/spec/README.md`](spec/README.md).
It defines:

* The `llms.txt` Actions section format.
* The `.well-known/agent.json` manifest schema.
* Required vs optional fields.
* Security and interoperability guidelines.

---

## 🤝 Contributing

We welcome proposals, feedback, and implementations from the community.
See [`/CONTRIBUTING.md`](CONTRIBUTING.md) for details.

---

## 📣 Community & Adoption

* **Website:** *(coming soon)*
* **Directory of sites with Action.txt:** *(coming soon)*
* **Discussion:** Join us on [Discord](#) or [GitHub Discussions](#).

---

## ❓ FAQ (Quick Answers)

**Q: What is Action.txt?**  
A: An open standard that lets any website safely expose machine-readable actions to AI agents.  
`llms.txt` guides AI to *content* — Action.txt guides AI to *capabilities*.

**Q: Why would I use it?**  
A: To make your site agent-friendly, increase API discovery, and control exactly which actions are available — with built-in safety and authentication.

**Q: Is it safe?**  
A: Yes. Action.txt is opt-in and includes safety flags, rate limits, sandbox endpoints, and required auth scopes.

**Q: Do I have to support every AI vendor?**  
A: No. Action.txt is vendor-neutral and based on open web standards.

**Q: What if I don’t want AI interacting with my service?**  
A: Simply don’t publish an Action.txt file or `.well-known/agent.json`.

**Q: How is this different from an API catalog?**  
A: It’s a profile of existing discovery standards like `/.well-known/api-catalog` and OpenAPI, extended with AI-specific metadata such as human-review requirements and safety classifications.

📚 **Full FAQ:** See [FAQ.md](FAQ.md) for detailed answers and common objections.

View full faq [here](/docs/FAQ.md).

---

## 📄 License

- **Specification text** (`/spec`): Licensed under [CC BY 4.0](LICENSE-spec.md)

- **Code samples & SDKs** (`/examples`, `/tools`): Licensed under [MIT](LICENSE-code.md)
