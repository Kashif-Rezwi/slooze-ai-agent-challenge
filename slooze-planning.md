# Slooze AI Challenge — Planning Document

---

## 1. Problem Statement

### Role
**Software Engineer — AI**

### Overview
This take-home assignment contains two technical challenges designed to evaluate a candidate's ability to build AI-powered systems using LLMs, external tools, and retrieval pipelines.

The goal is to assess:
- Understanding of LLM integration
- System design for AI agents
- Data retrieval and processing
- Code structure and maintainability

Candidates may implement solutions for any or all of the challenges below, in **Python or Node.js**.

---

### Challenge A — AI Web Search Agent

#### Objectives
Build an AI agent capable of searching the web and generating answers based on live internet information. The system should demonstrate the ability to:
- Integrate an LLM
- Use external tools for information retrieval
- Synthesize responses using retrieved data
- Provide source references

#### Tasks to be Performed
1. Build an agent that accepts a natural language query from a user.
2. Implement a web search tool integration using any provider such as DuckDuckGo, Tavily, SerpAPI, or any search API of your choice.
3. Retrieve the top relevant search results.
4. Pass the retrieved content to an LLM to generate a summarized answer.
5. Return a response that includes a clear answer and a list of sources used.

#### Example
```
Input:  What are the latest specs in MacBook this year?

Output:
Answer: Recent MacBook Pro models feature Apple's latest M5 family chips
        for enhanced AI performance and efficiency. New models became
        available starting March 11, 2026.

Sources:
  - https://example.com/article1
  - https://example.com/article2
```

#### Expected Features
- Query processing
- Search tool integration
- Retrieval of relevant results
- LLM-based answer generation
- Source attribution

---

### Challenge B — AI Agent for PDF Summarization and Question Answering

#### Objectives
Build an AI system capable of reading a PDF document, summarizing its content, and answering questions about the document. The system should demonstrate:
- Document ingestion
- Text extraction
- Retrieval-Augmented Generation (RAG)
- Context-aware question answering

#### Tasks to be Performed
1. Accept a PDF file as input.
2. Extract text content from the document.
3. Split the extracted text into smaller chunks for processing.
4. Generate embeddings for the chunks.
5. Store the embeddings in a vector store (e.g., FAISS, Chroma, Pinecone).
6. When a user asks a question:
   - Retrieve the most relevant document chunks
   - Provide them as context to an LLM
   - Generate a grounded answer

#### Example
```
Input:  Summarize the document. What methodology was used in the study?

Output:
Summary:     The document discusses the impact of AI-driven automation in
             enterprise workflows and evaluates productivity improvements
             across multiple organizations.

Methodology: The study used case studies combined with experimental
             evaluations across three enterprise environments.
```

#### Expected Features
- PDF text extraction
- Chunking and embedding generation
- Vector similarity search
- Context-based answer generation
- Document summarization

---

### Submission Requirements
Provide a public or private GitHub repository containing:
- `README.md` with setup instructions, how to run, dependencies, architecture overview, and design decisions and trade-offs
- `agent/` directory containing all source code
- `requirements.txt` or `package.json`

> **Tip from Slooze:** Creativity in your data analysis approach and depth in your insights will be rewarded. Think of this as a mini day-to-day job at Slooze.

---

## 2. Brainstormed Implementation Idea

### Core Insight
Rather than building two separate isolated tools, the assignment is treated as a **product design problem**. The solution is a **unified AI chat interface** that automatically routes between web search (Challenge A) and PDF Q&A (Challenge B) based on the nature of the user's input.

This mirrors real AI products like Perplexity — one input box, multiple intelligent sources — and demonstrates product thinking alongside engineering execution.

---

### The Unified Chat Concept

```
User types a question         →  Web Search pipeline (Challenge A)
User uploads a PDF            →  PDF ingestion pipeline (Challenge B)
User asks about uploaded PDF  →  RAG query pipeline (Challenge B)
```

No mode switching buttons. No separate pages. The agent detects intent from the shape of the request and dispatches accordingly. A subtle badge on each AI response (`🌐 Web` or `📄 PDF`) makes the routing visible without requiring the user to think about it.

---

### Routing Logic

```
Incoming request
      │
      ├── has file attached?        →  ingest PDF → return documentId
      │
      ├── has documentId in body?   →  RAG query (Challenge B)
      │
      └── plain text only?          →  web search (Challenge A)
```

Routing is pure request-shape detection — no LLM needed for dispatch. Fast and deterministic.

---

### Frontend Strategy
- **Single Next.js app** with one chat interface
- Home page not needed — the chat IS the product
- PDF upload via paperclip icon in the input bar
- When a PDF is loaded, a badge shows: `Talking to: report.pdf` with a clear button to reset
- Sources rendered as chips below each AI message
- Streaming responses for real-time feel

### Backend Strategy
- **Single NestJS app** with two feature modules — not two separate services
- One `POST /api/chat` endpoint — single contract for the frontend
- `ChatService` acts as the router, delegating to `SearchService` or `RagService`
- `AIService` is a dedicated module wrapping all AI SDK calls — both services inject it, neither imports from `ai` directly
- Swap OpenAI for any provider by changing one file

### Why This Approach Impresses Employers
- Shows **product thinking** — building one coherent thing, not two homework scripts
- Shows **system design judgment** — clean module separation without over-distributing into microservices
- Shows **AI engineering maturity** — dedicated AI abstraction layer, proper RAG pipeline
- The README story becomes: *"A unified AI assistant that automatically routes between live web search and document Q&A"*

---

## 3. Architecture

### High-Level Overview

```
┌─────────────────────────────────────────┐
│         Next.js Frontend                │
│   Single chat UI — file upload + SSE   │
└──────────────────┬──────────────────────┘
                   │ POST /api/chat
┌──────────────────▼──────────────────────┐
│         NestJS Backend                  │
│                                         │
│  ChatController → ChatService (router)  │
│         │                   │           │
│   SearchService         RagService      │
│   (Challenge A)         (Challenge B)   │
│         │                   │           │
│         └──────┬────────────┘           │
│            AIService                    │
│        (Vercel AI SDK + OpenAI)         │
└──────────────────┬──────────────────────┘
                   │
       ┌───────────┴───────────┐
  Tavily API            ChromaDB (local)
  (web search)          (vector store)
```

---

### Request Flow — Challenge A (Web Search)

```
User query (text only)
       ↓
POST /api/chat { message: "..." }
       ↓
ChatService detects: no file, no documentId
       ↓
SearchService.search(query)
       ↓
TavilyService.search(query) → top 5 results (snippet + URL)
       ↓
AIService.stream(buildSearchPrompt(query, results))
       ↓
StreamText response → SSE to frontend
       ↓
{ answer: "...", sources: [...urls], mode: "web" }
```

---

### Request Flow — Challenge B (PDF Ingestion)

```
User uploads PDF
       ↓
POST /api/chat { file: <pdf> }
       ↓
ChatService detects: file present
       ↓
RagService.ingest(file)
       ↓
pdf-parse → raw text
       ↓
chunk(text, { size: 500, overlap: 50 })
       ↓
AIService.embedMany(chunks) → float32[] per chunk
       ↓
ChromaDB.collection.add(embeddings, chunks, metadata)
       ↓
{ documentId: "uuid", filename: "report.pdf" }
```

---

### Request Flow — Challenge B (PDF Query)

```
User asks question about loaded PDF
       ↓
POST /api/chat { message: "...", documentId: "uuid" }
       ↓
ChatService detects: documentId present
       ↓
RagService.query(documentId, message)
       ↓
AIService.embed(message) → query vector
       ↓
ChromaDB.collection.query(queryVector, topK: 5) → relevant chunks
       ↓
AIService.stream(buildRagPrompt(message, chunks))
       ↓
StreamText response → SSE to frontend
       ↓
{ answer: "...", sources: [chunk refs], mode: "pdf" }
```

---

### Module Dependency Graph

```
AppModule
├── ChatModule
│   ├── ChatController   (POST /api/chat, POST /api/upload)
│   └── ChatService      (routing logic)
│
├── SearchModule
│   ├── SearchService    (Challenge A orchestration)
│   └── TavilyService    (web search tool)
│
├── RagModule
│   ├── IngestService    (PDF → chunks → embeddings → Chroma)
│   └── QueryService     (embed question → similarity search → LLM)
│
└── AIModule
    ├── AIService         (generateText, streamText, embed, embedMany)
    └── ai.config.ts      (model names, token limits, system prompts)
```

---

## 4. File Structure

```
slooze-ai-challenges/
│
├── apps/
│   │
│   ├── frontend/                          # Next.js 14 (App Router)
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                   # Chat UI (single page)
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.tsx         # message list
│   │   │   │   ├── ChatInput.tsx          # input bar + file upload
│   │   │   │   ├── MessageBubble.tsx      # user / AI message
│   │   │   │   ├── SourceChips.tsx        # source URL chips
│   │   │   │   └── ModeBadge.tsx          # 🌐 Web / 📄 PDF badge
│   │   │   └── pdf/
│   │   │       └── PdfSessionBanner.tsx   # "Talking to: report.pdf"
│   │   ├── hooks/
│   │   │   └── useChat.ts                 # TanStack Query + SSE logic
│   │   ├── lib/
│   │   │   └── api.ts                     # typed API client
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── backend/                           # NestJS
│       ├── src/
│       │   │
│       │   ├── chat/                      # router layer
│       │   │   ├── chat.module.ts
│       │   │   ├── chat.controller.ts     # POST /api/chat
│       │   │   ├── chat.service.ts        # routing logic
│       │   │   └── dto/
│       │   │       └── chat.dto.ts        # ChatRequestDto (Zod + class-validator)
│       │   │
│       │   ├── search/                    # Challenge A
│       │   │   ├── search.module.ts
│       │   │   ├── search.service.ts      # orchestrates search + LLM
│       │   │   └── tavily.service.ts      # Tavily API wrapper
│       │   │
│       │   ├── rag/                       # Challenge B
│       │   │   ├── rag.module.ts
│       │   │   ├── ingest.service.ts      # PDF → chunks → vectors
│       │   │   ├── query.service.ts       # similarity search + LLM
│       │   │   └── vector-store.ts        # ChromaDB wrapper
│       │   │
│       │   ├── ai/                        # AI abstraction layer
│       │   │   ├── ai.module.ts
│       │   │   ├── ai.service.ts          # generateText, streamText, embed
│       │   │   └── ai.config.ts           # model names, prompts, limits
│       │   │
│       │   ├── common/
│       │   │   ├── filters/
│       │   │   │   └── http-exception.filter.ts
│       │   │   └── pipes/
│       │   │       └── zod-validation.pipe.ts
│       │   │
│       │   └── main.ts                    # bootstrap, CORS, multer config
│       │
│       ├── .env.example
│       └── package.json
│
├── packages/
│   └── shared/                            # @slooze/shared
│       ├── src/
│       │   ├── schemas.ts                 # Zod schemas (ChatRequest, etc.)
│       │   └── types.ts                   # shared TS interfaces
│       └── package.json
│
├── pnpm-workspace.yaml
├── .env.example                           # root env reference
├── .gitignore
└── README.md
```

---

## 5. Technology Stack

### Frontend

| Layer | Technology | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, file-based routing, modern React |
| Language | TypeScript | Type safety across monorepo |
| Styling | Tailwind CSS | Fast, utility-first, no context switch |
| State / fetching | TanStack Query | Proven in prior projects, cache + loading states |
| HTTP client | Native fetch | No extra dependency for simple requests |
| File upload | Native HTML input | Multipart form — no library needed |
| Streaming UI | Vercel AI SDK `useChat` | Handles SSE + streaming out of the box |

---

### Backend

| Layer | Technology | Reason |
|---|---|---|
| Framework | NestJS | Module system maps perfectly to this architecture |
| Language | TypeScript | Consistent across monorepo |
| Runtime | Node.js | Same ecosystem as frontend |
| Validation | Zod + class-validator | Zod in shared package, class-validator for DTOs |
| File handling | Multer | Built into NestJS, handles multipart uploads |
| Config | @nestjs/config | Clean environment variable management |
| CORS | Built-in NestJS | Configured in `main.ts` |

---

### AI Layer

| Layer | Technology | Reason |
|---|---|---|
| AI SDK | Vercel AI SDK v4 | Provider-agnostic, modern, supports streaming |
| Provider | OpenAI | Existing API access |
| Chat model | `gpt-4o-mini` | Fast, cost-effective, capable |
| Embedding model | `text-embedding-3-small` | Best price/performance for RAG use case |
| Search tool | Tavily API | Used in prior projects, high-quality results |

---

### Challenge B Specific

| Layer | Technology | Reason |
|---|---|---|
| PDF parsing | `pdf-parse` | Simple, battle-tested Node.js library |
| Text chunking | Custom utility | Sliding window — no library needed |
| Vector store | ChromaDB JS client | First-class Node.js support, in-memory mode |
| Similarity search | ChromaDB built-in | Cosine similarity out of the box |

> **Note on FAISS vs ChromaDB:** FAISS has no official JS client and requires Python bindings — a significant complexity for a Node.js project. ChromaDB has a first-class JS client, runs fully in-memory with zero external setup, and is production-grade. Clear winner for this stack.

---

### Monorepo Tooling

| Tool | Choice | Reason |
|---|---|---|
| Package manager | pnpm | Workspace support, fast, disk-efficient |
| Monorepo | pnpm workspaces | Lightweight, no Turborepo complexity needed |
| Shared package | `@slooze/shared` | Zod schemas, TypeScript types, constants |
| Build | `tsc` | Sufficient for take-home, no bundler overhead |

---

### Dev Tooling

| Tool | Choice | Reason |
|---|---|---|
| Linting | ESLint | Standard |
| Formatting | Prettier | Standard |
| Git hooks | — | Overkill for take-home |
| Testing | — | Not required by assignment |

---

## 6. Key Design Decisions & Trade-offs

### 1. Unified chat over two separate UIs
**Decision:** Single chat interface routing between both challenges.
**Trade-off:** Slightly more complex frontend state (tracking `documentId`, current mode). Worth it — mirrors real product thinking and is far more impressive to evaluate.

### 2. Single NestJS app over two separate services
**Decision:** One backend, two feature modules, one `/api/chat` endpoint.
**Trade-off:** Both challenges share the same process. In production you'd separate them. For a take-home, co-location makes it easier to run locally (`npm run start:dev` once) and easier to review.

### 3. Dedicated AIModule
**Decision:** All AI SDK calls go through `AIService`. No other module imports from `ai` or `@ai-sdk/openai` directly.
**Trade-off:** Adds one layer of indirection. Benefit: swap OpenAI for any provider in one file. Directly addresses the assignment's "maintainability" criterion.

### 4. ChromaDB in-memory over FAISS
**Decision:** Use ChromaDB's JS client in ephemeral mode.
**Trade-off:** Vectors are lost on server restart — not production-ready. Noted in README. Benefit: zero external setup, works out of the box on any machine, no Python dependency.

### 5. Request-shape routing over LLM-based intent detection
**Decision:** Route based on request shape (file present? documentId present?) not LLM classification.
**Trade-off:** Less "agentic" than LLM-based routing. Benefit: deterministic, zero latency, impossible to misclassify. Right call for a take-home where reliability matters.

### 6. gpt-4o-mini over gpt-4o
**Decision:** Use the smaller, cheaper model for both tasks.
**Trade-off:** Slightly less capable on complex reasoning. For web search summarization and document Q&A, `gpt-4o-mini` is more than sufficient and demonstrates cost-awareness.

---

## 7. Environment Variables

```bash
# apps/backend/.env

# OpenAI
OPENAI_API_KEY=sk-...

# Tavily (Challenge A)
TAVILY_API_KEY=tvly-...

# App
PORT=3001
FRONTEND_URL=http://localhost:3000

# RAG config
CHUNK_SIZE=500
CHUNK_OVERLAP=50
TOP_K_RESULTS=5
```

---

## 8. API Contract

### POST /api/chat

**Request (plain query — Challenge A):**
```json
{
  "message": "What are the latest MacBook specs?"
}
```

**Request (PDF question — Challenge B):**
```json
{
  "message": "Summarize this document",
  "documentId": "uuid-here"
}
```

**Request (PDF upload — Challenge B ingestion):**
```
Content-Type: multipart/form-data
file: <pdf binary>
```

**Response (streaming SSE):**
```json
{
  "answer": "...",
  "sources": ["https://...", "https://..."],
  "mode": "web" | "pdf",
  "documentId": "uuid (only on upload)"
}
```

---

*This document was prepared as a planning reference before implementation begins.*
