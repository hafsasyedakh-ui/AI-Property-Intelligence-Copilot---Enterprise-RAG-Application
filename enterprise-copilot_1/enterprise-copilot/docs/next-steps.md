# Next steps

Scoped out of the one-day build on purpose. Each one slots into the existing
structure without a rewrite:

- **Auth (Clerk or Auth.js)** — `User`, `Document`, `Chat` already have
  `user_id` foreign keys. Add a `get_current_user` FastAPI dependency, filter
  every query by it, and gate the frontend routes with middleware.
- **Docker/CI** — a `docker-compose.yml` stub is included; add a
  `Dockerfile` per service and a GitHub Actions workflow that runs
  `pytest` + `npm run build` on push.
- **LangGraph multi-agent tool calling** — the current chat endpoint always
  does retrieve → answer. To make it agentic: define tools
  (`search_documents`, `list_documents`, `generate_report`,
  `maintenance_history`) as OpenAI function-calling tools, and wrap the
  retrieve/answer loop in a LangGraph `StateGraph` with a router node that
  decides whether to search, call a tool, or answer directly.
- **Analytics dashboard** — `Chat` and `Document` tables have timestamps
  already; add aggregate queries (documents/week, most-queried building) and
  render with Recharts on the dashboard.
- **Hybrid search** — combine the existing vector search with a Postgres
  full-text (`tsvector`) query and merge-rank results.
- **OCR for scanned PDFs** — `pdf_service.extract_pages` currently assumes a
  text layer; if `page.get_text()` returns empty, fall back to Tesseract or
  Azure Document Intelligence on a rasterized page image.
