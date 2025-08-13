# Action.txt  

**An open standard for making the web agent-friendly.**  

Action.txt lets any website safely expose **machine-readable actions** to AI agents.  
Where [`llms.txt`](https://github.com/AnswerDotAI/llms-txt) guides AI to *content*, **Action.txt** guides AI to *capabilities*.  

---

## 🚀 Why Action.txt?

- **Discoverability** — Let AI agents find and understand what actions your site supports.  
- **Safety** — Define authentication, rate limits, and human-review requirements per action.  
- **Interoperability** — Vendor-neutral, built on open web standards like OpenAPI, JSON Schema, and `.well-known` URIs.  
- **Control** — You decide exactly which actions are exposed, and how they can be used.  

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

## 📄 License

* Spec text: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
* Code examples: [MIT](LICENSE)
