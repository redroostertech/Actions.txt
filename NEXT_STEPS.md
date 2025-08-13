# Next Steps / Roadmap

This roadmap outlines planned enhancements and priorities for the ActionTxt Demo API project.  
It’s intended for maintainers, contributors, and future planning.

---

## 1. API Enhancements
- [ ] **Consolidate OpenAPI Schemas**  
  Merge duplicate `/components/schemas` entries into a single, well-structured schema section.
- [ ] **Expand Error Models**  
  Add clear, consistent error response formats in `components.responses` with example payloads.
- [ ] **Add Pagination Support**  
  Implement standard pagination parameters (`limit`, `offset` or `cursor`) for list endpoints.
- [ ] **Webhook/Event Support**  
  Add webhook callbacks for real-time demo status updates.

---

## 2. Documentation Improvements
- [ ] **Quick Start Integration**  
  Combine server run instructions with the existing cURL Quick Start into `/docs/quickstart.md`.
- [ ] **API Reference Publishing**  
  Serve `/spec/openapi.json` via GitHub Pages and render it with Redoc or Swagger UI.
- [ ] **Request/Response Flow Diagram**  
  Add visual diagrams for authentication, idempotent requests, and demo scheduling flows.
- [ ] **Error Handling Guide**  
  Document common error codes, their meaning, and how to handle them.

---

## 3. Developer Experience
- [ ] **Runnable Examples**  
  Turn all cURL examples into runnable shell scripts under `/examples/scripts/`.
- [ ] **Postman Collection**  
  Provide a ready-to-import Postman collection with pre-filled environment variables.
- [ ] **Environment Template**  
  Add `.env.example` for local token storage and configuration.
- [ ] **Makefile Commands**  
  Add `make` targets for common tasks (e.g., `make run`, `make test`, `make lint`).

---

## 4. Community & Contribution
- [ ] **CONTRIBUTING.md**  
  Add contribution guidelines, coding style, and PR process.
- [ ] **GitHub Issue Templates**  
  Add templates for bug reports, feature requests, and documentation updates.
- [ ] **Changelog Maintenance**  
  Create and maintain a `CHANGELOG.md` following semantic versioning.
- [ ] **Discussions or Q&A**  
  Enable GitHub Discussions for developer support and knowledge sharing.

---

## 5. Future Features (Exploratory)
- [ ] **Sandbox Ordering API**  
  Expand demo API into a sandbox ordering workflow with mock data.
- [ ] **CLI Tool**  
  Provide a Node.js or Python CLI wrapper for calling the API.
- [ ] **WebSocket Streaming**  
  Add optional WebSocket connection for live updates instead of polling.

---

**Last Updated:** 2025-08-13