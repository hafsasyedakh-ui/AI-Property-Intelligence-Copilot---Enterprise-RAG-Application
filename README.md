# AI Property Intelligence Copilot

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-Embeddings%20%2B%20GPT-412991?logo=openai&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

An enterprise-style RAG copilot for property management documents (leases,
inspection reports, invoices, maintenance logs). Upload PDFs, ask questions
across the whole document set, and get answers cited to the exact filename
and page they came from — plus one-click executive summary reports.

**The problem:** property managers sit on thousands of PDFs and burn hours
manually searching them for answers like *"which buildings have overdue
elevator inspections?"* or *"summarize every HVAC repair over $20,000."*
This copilot answers that instantly, with the receipts to back it up.

## Features

- **PDF ingestion pipeline** — drag-and-drop upload, background processing, live status
- **Retrieval-Augmented Generation** — semantic search over every uploaded document, not keyword matching
- **Grounded citations** — every claim is traceable to `filename + page number`, never a hallucinated guess
- **One-click executive reports** — Key Findings, Risks, Recommendations, Dates, Financial Obligations, exported as PDF
- **Document type filtering** — scope search/reports to leases, inspections, invoices, or maintenance logs

## Screenshots

*Coming soon.*

## Implementation details

- **PDF upload & processing** — PyMuPDF text extraction, page-aware
  token chunking (500 tokens / 100 overlap, never spans pages), OpenAI
  embeddings, background ingestion so uploads don't block the UI.
- **RAG chat** — cosine-similarity vector search over stored chunks, top-5
  context sent to GPT with a prompt that forces citations and refuses to
  guess when the answer isn't in the documents.
- **Citations** — every chat answer and report is tied back to
  `filename + page number`, shown as pins in the UI.
- **Executive reports** — generates Key Findings / Risks / Recommendations /
  Important Dates / Financial Obligations from the document set, exportable
  as PDF.
- **Full UI** — Dashboard, Upload, Documents, Chat, Reports, built with
  Next.js 15 + TypeScript + Tailwind.

## What's intentionally scoped out (see "Next Steps")

Auth, Docker/CI, multi-agent LangGraph tool-calling, and analytics
dashboards aren't wired in yet. The codebase is structured so each of these
slots in without a rewrite — see `docs/next-steps.md`.

## Architecture

```
Next.js (App Router)  →  FastAPI  →  SQLite (dev) / Postgres+pgvector (prod)
                              ↓
                        OpenAI Embeddings + Chat Completions
```

RAG flow: `PDF → PyMuPDF extraction → chunking → OpenAI embeddings → stored
in DB → user question → embed query → cosine similarity search → top-5
chunks → GPT with citation-enforcing prompt → answer + sources`.

## Project structure

```
enterprise-copilot/
├── backend/
│   └── app/
│       ├── routers/       upload, documents, chat, report
│       ├── services/      pdf, chunking, embeddings, LLM, ingestion, PDF export
│       ├── models/        SQLAlchemy models
│       ├── schemas/       Pydantic request/response schemas
│       └── database/      DB session/engine
├── frontend/
│   ├── app/                Dashboard, Upload, Documents, Chat, Reports
│   ├── components/         Sidebar, PageHeader
│   └── lib/api.ts          typed API client
└── docs/
    └── next-steps.md
```

## Running it locally

### 1. Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # add your real OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for interactive API docs.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Visit `http://localhost:3000`.

### 3. Try it

1. Go to **Upload**, drop in a PDF (a lease, inspection report, etc.), pick a
   document type.
2. Wait for status to flip from `processing` → `ready` on the **Documents**
   page (polls every 3s).
3. Go to **AI Chat** and ask something like *"Which buildings have overdue
   inspections?"* — you'll get an answer with citation pins.
4. Go to **Reports**, generate an executive summary, download the PDF.

## Deploying

- **Frontend** → Vercel (`vercel deploy` in `frontend/`, set
  `NEXT_PUBLIC_API_URL` to your backend URL).
- **Backend** → Render or Railway (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
- **Database** → swap `DATABASE_URL` to a Neon Postgres connection string.
  To get real vector search at scale, enable the `pgvector` extension and
  change the `Chunk.embedding` column to `Vector(1536)` — the query in
  `embedding_service.search_similar` becomes a single `ORDER BY embedding <=> :query_vec`
  instead of in-Python cosine similarity. Everything else in the pipeline
  is unchanged.

## Known limitations (worth saying out loud in an interview)

- Vector search is in-Python cosine similarity over all chunks — fine for a
  demo/thousands of chunks, not for a production-scale corpus (that's what
  the pgvector migration above is for).
- No auth yet — every document/chat is global, not per-user. Schema already
  has `user_id` foreign keys ready for it.
- Chunking is token-count based, not structure-aware — a very dense table
  can still get split mid-row. Worth flagging as a known RAG failure mode.
- Report generation caps context at 60 chunks to control token/cost — a
  very large corpus would need a map-reduce summarization step instead.
