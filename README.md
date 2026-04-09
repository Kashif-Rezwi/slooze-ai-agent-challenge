# Slooze AI Challenge

A unified AI chat application that combines real-time web search and PDF Q&A into a single streaming interface — built as a take-home engineering assignment for Slooze.

---

## Challenges

| | Challenge A | Challenge B |
|---|---|---|
| **Feature** | AI Web Search Agent | PDF Q&A (RAG) |
| **Input** | Any question | Upload a PDF, then ask questions |
| **Pipeline** | Tavily → GPT-4o-mini | pdf-parse → chunk → embed → vector search → GPT-4o-mini |
| **Output** | Streamed answer + source URLs | Streamed answer grounded in document |

Both challenges share a single chat UI that auto-routes based on whether a `documentId` is active.

---

## Stack

**Backend** — `apps/backend`
- NestJS 11 (TypeScript, CommonJS)
- Vercel AI SDK 6 — `streamText`, `embed`, `embedMany`
- OpenAI `gpt-4o-mini` (chat) + `text-embedding-3-small` (embeddings)
- Tavily API — real-time web search
- pdf-parse v2 — PDF text extraction
- In-memory cosine similarity vector store (zero dependencies, swap-ready)
- Zod v4 — env validation + request validation
- `@nestjs/throttler` — 20 req/min rate limiting

**Frontend** — `apps/frontend`
- Next.js 15 App Router + React 19
- Tailwind CSS v4 (`@theme` tokens, no config file)
- `react-markdown` + `rehype-highlight` — rendered markdown with syntax highlighting
- Custom SSE `useChat` hook — real-time streaming with optimistic UI

**Shared** — `packages/shared`
- Zod schemas + inferred TypeScript types shared between backend and frontend

---

## Project Structure

```
slooze-ai-challenge/
├── apps/
│   ├── backend/               NestJS API (port 3001)
│   │   └── src/
│   │       ├── ai/            AIService — all OpenAI calls
│   │       ├── chat/          ChatController, ChatService, UploadController
│   │       ├── search/        TavilyService, SearchService (Challenge A)
│   │       ├── ingest/        IngestService, VectorStoreService (Challenge B)
│   │       ├── rag/           RagService (Challenge B)
│   │       └── common/        ZodValidationPipe, HttpExceptionFilter
│   └── frontend/              Next.js app (port 3000)
│       ├── app/               layout, page, globals.css
│       ├── components/        Header, ChatWindow, MessageBubble, ChatInput…
│       ├── hooks/             useChat — SSE stream consumer
│       └── lib/               uploadPdf API helper
└── packages/
    └── shared/                Zod schemas + TypeScript types
```

---

## Setup

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- OpenAI API key — [platform.openai.com](https://platform.openai.com)
- Tavily API key — [tavily.com](https://tavily.com) (free tier: 1 000 searches/month)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env` and fill in your API keys:

```
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
```

### 3. Start dev servers

```bash
pnpm dev
```

This starts both servers concurrently:
- Backend → `http://localhost:3001/api`
- Frontend → `http://localhost:3000`

Open **http://localhost:3000** in your browser.

---

## How It Works

### Challenge A — Web Search

1. User types a question → `POST /api/chat` with `{ message }`
2. Backend fetches top-5 results from Tavily
3. Results are passed as context to GPT-4o-mini via AI SDK `streamText`
4. Answer streams back as Server-Sent Events — tokens appear in real time
5. Source URLs render as favicon chips once streaming completes

### Challenge B — PDF Q&A (RAG)

1. User uploads a PDF → `POST /api/upload`
   - Text extracted with pdf-parse
   - Split into 500-char overlapping chunks
   - All chunks embedded in one batch (`text-embedding-3-small`)
   - Stored in the in-memory vector store with `documentId` tag
2. User asks a question → `POST /api/chat` with `{ message, documentId }`
   - Query is embedded
   - Top-5 nearest chunks retrieved via cosine similarity search
   - GPT-4o-mini streams a grounded answer using those chunks as context

> **Note:** The vector store is in-memory. Uploaded PDFs persist for the lifetime of the backend process.

---

## API Reference

### `POST /api/chat`

Streams a Server-Sent Events response.

**Request body:**
```json
{ "message": "What is React?" }
{ "message": "Summarise section 3", "documentId": "uuid" }
```

**SSE event stream:**
```
data: {"type":"meta","sources":["https://..."],"mode":"web"}
data: {"type":"text","chunk":"React"}
data: {"type":"text","chunk":" is..."}
data: {"type":"done"}
```

### `POST /api/upload`

Accepts `multipart/form-data` with a `file` field (PDF, max 20 MB).

**Response:**
```json
{ "documentId": "3f2504e0-...", "filename": "report.pdf" }
```

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start both servers concurrently |
| `pnpm dev:backend` | Backend only |
| `pnpm dev:frontend` | Frontend only |
| `pnpm typecheck` | Type-check all packages |
| `pnpm build` | Production build all packages |
