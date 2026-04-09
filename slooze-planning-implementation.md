## Refined Implementation Plan

**Strategy: Backend → Challenge A → Frontend A → E2E A → Challenge B → Frontend B → E2E B → Polish**

The key principle is an **end-to-end checkpoint after each challenge**. Before calling a challenge done, the full flow is verified: frontend talks to backend, backend calls the AI, response streams back correctly. This catches integration bugs early instead of at the very end.

> **Resolved decisions (from pre-implementation review):**
> - Two endpoints: `POST /api/chat` (JSON) and `POST /api/upload` (multipart) — not one merged endpoint.
> - Frontend uses `@ai-sdk/react` `useChat` hook — not TanStack Query or a custom fetch hook. The tech stack table in the planning doc still lists TanStack Query; the implementation uses `useChat` throughout.
> - `useChat` sends `{ messages: [...] }` to the backend (full history array), not `{ message: "..." }`. Attaching `documentId` uses the `body` option: `useChat({ body: { documentId } })`. The backend reads `dto.message ?? dto.messages?.at(-1)?.content` to extract the current query.
> - AIService returns `generateText` (non-streaming) through Phase 2; streaming added in Phase 4 and explicitly verified for Challenge B in Phase 6.
> - ChromaDB uses **folder persistence** in development (`path: "./chroma-data"`) — not in-memory. This survives NestJS hot-reloads. The planning doc §6.4 incorrectly describes this as "in-memory"; the folder persistence approach is the correct implementation decision.
> - NestJS streaming requires manual response piping. `StreamingTextResponse` from the Vercel AI SDK is a Web API `Response` object — NestJS cannot `return` it automatically. The controller must use `@Res({ passthrough: false })` and pipe the stream to `res` directly. See Phase 4.1 for the exact pattern.
> - ChromaDB JS client v1.8+ changed its API. All `collection.add()` / `collection.query()` calls use the named-parameter style: `{ ids, embeddings, documents, metadatas }`. Pin `chromadb` to `^1.9.0` and use this shape throughout.
> - Rate limiting (`@nestjs/throttler`) belongs in Phase 1, not Phase 5. It is a global infrastructure concern.

---

### Full Phase Breakdown

```
PHASE 0 — Monorepo setup
  ✅ 0.1  pnpm-workspace.yaml present (apps/*, packages/*)
  ✅ 0.2  Shared package scaffolded (@slooze/shared — package.json, tsconfig.json)
  ✅ 0.3  Zod schemas added: ChatMessageSchema, ChatRequestSchema,
             ChatResponseSchema, UploadResponseSchema
  ✅ 0.4  Shared types exported: Mode, ChatMessage, ChatRequest,
             ChatResponse, UploadResponse
  ✅ 0.5  Schema corrections applied (post-review):
             - ChatMessageSchema.id → optional (useChat wire format omits it)
             - ChatMessageSchema.createdAt → z.coerce.date() (JSON sends ISO strings)
             - ChatRequestSchema → .refine() requiring message OR messages
             - package.json → exports field added for Node16/bundler resolution
             - tsconfig.json → declarationMap: true added

PHASE 1 — Backend foundation ✅
  ✅ 1.1  apps/backend/ scaffolded manually (package.json, tsconfig, nest-cli.json)
  ✅ 1.2  @nestjs/config + env validation (env.validation.ts — Zod schema, fail-fast)
  ✅ 1.3  Global infrastructure in main.ts + app.module.ts:
              - Global prefix: /api
              - CORS: origin = FRONTEND_URL env var
              - Global HTTP exception filter → { error, code }
              - @nestjs/throttler: 20 req/60s (ttl in ms), global guard via APP_GUARD
            ⚠ Note: global ValidationPipe (class-validator) not added — validation is
              handled per-endpoint via ZodValidationPipe. This is intentional.
  ✅ 1.4  AIModule + AIService with stubs for all 4 methods
  ✅ 1.5  ChatModule with ChatController (POST /api/chat) + UploadController (POST /api/upload)
            Multer: memoryStorage, PDF-only MIME guard, 20MB limit
            multer added as direct runtime dependency (required by pnpm strict linking)
  ✅ 1.6  @slooze/shared: workspace:* in backend/package.json
            ChatRequestDto = type alias for ChatRequest from shared schemas
  ✅ 1.7  TypeScript config finalised:
            - module: commonjs, target: ES2022, lib: [ES2022, DOM]
            - DOM lib required for fetch + Response globals (used in TavilyService)
            - moduleResolution omitted (TS6 infers node10 for commonjs without error)
            - experimentalDecorators + emitDecoratorMetadata for NestJS DI

PHASE 2 — Challenge A (backend, non-streaming) ✅
  ✅ 2.1  TavilyService: search → top 5 results, graceful ServiceUnavailableException
  ✅ 2.2  SearchService: Tavily → buildUserPrompt → AIService.generateText → ChatResponse
  ✅ 2.3  AIService.generateText() wired:
            - system + prompt top-level params (AI SDK v6 — system not in messages array)
            - maxOutputTokens (renamed from maxTokens in AI SDK v5+)
  ✅ 2.4  ChatService routing: documentId → 503 stub; plain text → SearchService
  ✅ 2.5  Query extraction: dto.message ?? dto.messages?.at(-1)?.content
  ✅ 2.6  curl smoke test (run after pnpm install + shared build):
              curl -X POST http://localhost:3001/api/chat \
                -H "Content-Type: application/json" \
                -d '{"message":"What are the latest MacBook specs?"}'
              → expect { answer: "...", sources: [...], mode: "web" }

PHASE 3 — Frontend foundation ✅
  ✅ 3.1  apps/frontend/ scaffolded manually (Next.js 15, React 19, TypeScript 6)
            - next.config.ts: rewrites /api/* → http://localhost:3001/api/*
            - postcss.config.mjs: @tailwindcss/postcss (Tailwind v4 — no tailwind.config.ts)
            - globals.css: @import "tailwindcss" + @theme CSS variables (dark theme)
            - tsconfig.json: module esnext + moduleResolution bundler (valid for Next.js)
  ✅ 3.2  @slooze/shared: workspace:* in frontend/package.json
            lib/api.ts: postChat() and uploadPdf() typed against shared ChatResponse/UploadResponse
  ✅ 3.3  Chat UI shell:
              ChatWindow.tsx   — message list + auto-scroll + empty state + typing indicator
              MessageBubble.tsx — user (right/purple) / AI (left/dark) bubbles
              ChatInput.tsx    — auto-grow textarea, Enter to send, Shift+Enter newline
  ✅ 3.3b Stubs wired but dormant:
              ModeBadge.tsx        — renders 🌐 Web or 📄 PDF badge (fully wired Phase 4/6)
              SourceChips.tsx      — renders source URL chips (fully wired Phase 4/6)
              PdfSessionBanner.tsx — "Talking to: file.pdf" with clear button (Phase 6)
  ✅ 3.4  hooks/useChat.ts — custom hook (NOT @ai-sdk/react):
            ⚠ @ai-sdk/react v3 useChat has a completely different API from v4:
              - No input/handleInputChange/handleSubmit
              - Messages use parts[] not content string
              - Requires backend to respond in AI SDK stream protocol
              Phase 3 uses a custom fetch-based hook. Phase 4 swaps it for @ai-sdk/react
              useChat once both backend streaming and frontend are updated together.
            Custom hook API (stable — components need no changes in Phase 4):
              { messages, isLoading, error, sendMessage(text, documentId?) }
  ✅ 3.5  Verify:
              pnpm install && pnpm --filter @slooze/shared build
              pnpm --filter frontend typecheck   # zero errors
              pnpm --filter frontend dev
              → open http://localhost:3000, type a question, see AI answer in bubble

PHASE 4 — Challenge A end-to-end (streaming)
  └── 4.1  Backend: switch SearchService to use AIService.streamText()
            NestJS streaming pattern — this does NOT use return StreamingTextResponse:

              @Post('chat')
              async chat(@Body() dto: ChatRequestDto, @Res() res: Response) {
                const stream = await this.chatService.stream(dto)
                res.setHeader('Content-Type', 'text/event-stream')
                res.setHeader('Cache-Control', 'no-cache')
                res.setHeader('Connection', 'keep-alive')
                for await (const chunk of stream) {
                  res.write(`data: ${chunk}\n\n`)
                }
                res.end()
              }

            ⚠ Alternatively: use the Vercel AI SDK's toDataStreamResponse() helper
              and pipe it via res.pipe() — verify which approach works with useChat's
              expected SSE format before committing to one pattern.
  └── 4.2  Frontend: configure useChat to consume SSE stream
              useChat already handles SSE by default; verify tokens stream token-by-token
  └── 4.3  Frontend: pass sources as custom data via the AI SDK's data stream
              Backend sends: data: {"sources": [...]} before the text stream
              Frontend reads: const { data } = useChat(...) → parse sources from data
  └── 4.4  Frontend: wire SourceChips.tsx — render source URLs as chips below AI message
  └── 4.5  Frontend: wire ModeBadge.tsx — show 🌐 Web badge on AI messages
  └── 4.6  Full flow test ✅
              Type query → tokens stream in real-time → source chips appear → 🌐 badge

PHASE 5 — Challenge B (backend)
  └── 5.1  Setup Multer on POST /api/upload:
              MIME type guard: application/pdf only
              Size limit: 20MB
              Storage: memoryStorage (buffer passed to IngestService, not written to disk)
  └── 5.2  Build IngestService:
              ingest(file: Express.Multer.File): Promise<UploadResponse>
              pdf-parse(file.buffer) → raw text string
              chunkText(text, { size: CHUNK_SIZE, overlap: CHUNK_OVERLAP }) → string[]
              AIService.embedMany(chunks) → number[][]
              VectorStore.addChunks(documentId, chunks, embeddings)
              return { documentId: uuid(), filename: file.originalname }
  └── 5.3  Build VectorStore wrapper (ChromaDB):
              ⚠ Pin: chromadb@^1.9.0
              ⚠ API shape (named params — required by chromadb v1.8+):
                await collection.add({
                  ids: chunks.map((_, i) => `${documentId}_${i}`),
                  embeddings: embeddings,
                  documents: chunks,
                  metadatas: chunks.map((_, i) => ({
                    documentId,
                    chunkIndex: i,
                    pageEstimate: Math.floor(i / 4) + 1,
                    textPreview: chunks[i].slice(0, 80),
                  })),
                })
              Development persistence: new ChromaClient({ path: './chroma-data' })
              ⚠ README note: folder persistence is used in dev; in production
                replace with a persistent Chroma server or a managed vector DB.
  └── 5.4  Build QueryService:
              query(documentId: string, question: string): AsyncIterable<string>
              AIService.embed(question) → number[]
              VectorStore.query(documentId, queryVector, topK: TOP_K_RESULTS)
                → { documents, metadatas }
              buildRagPrompt(question, chunks, history?) → string
              AIService.streamText(prompt) → stream

              ⚠ Summarization special case: if the question matches a summarize
                intent (e.g. contains "summarize", "summary", "overview"), retrieve
                topK = ALL chunks (or a higher cap, e.g. 20) rather than the default 5.
                This prevents the RAG pipeline from returning a partial answer for
                the "summarize the document" use case that Challenge B explicitly requires.
  └── 5.5  Wire ChatService router: documentId present → QueryService
  └── 5.6  Test ingestion + query with curl ✅
              # Upload
              curl -X POST http://localhost:3001/api/upload \
                -F "file=@./test.pdf"
              # → { documentId: "uuid", filename: "test.pdf" }

              # Query
              curl -X POST http://localhost:3001/api/chat \
                -H "Content-Type: application/json" \
                -d '{"message":"Summarize this","documentId":"<id-from-upload>"}'
              # → streaming SSE response

PHASE 6 — Challenge B end-to-end (streaming)
  └── 6.1  Frontend: add paperclip icon to ChatInput
              Triggers hidden <input type="file" accept=".pdf" />
              On change: POST /api/upload (raw fetch, not useChat)
              Show upload progress indicator while awaiting response
  └── 6.2  Frontend: on upload success, store { documentId, filename } in state
  └── 6.3  Frontend: attach documentId to all subsequent chat messages:
              const [documentId, setDocumentId] = useState<string | null>(null)
              ...
              useChat({
                api: '/api/chat',
                body: { documentId },   ← sent on every request; backend ignores if null
              })
            ⚠ documentId in body is the correct useChat pattern — it is NOT part of
              the messages array. This is non-obvious and must be explicit.
  └── 6.4  Frontend: wire PdfSessionBanner
              Shown when documentId is set: "Talking to: report.pdf  ✕"
              Clear button: setDocumentId(null) + setFilename(null)
  └── 6.5  Frontend: wire ModeBadge.tsx — show 📄 PDF badge on RAG responses
  └── 6.6  Frontend: render chunk metadata as sources
              Show "Page ~N" from metadata.pageEstimate, or textPreview excerpt
              (not raw chunk index — these are meaningless to users)
  └── 6.7  Verify PDF query path uses streamText (not generateText) ✅
              SSE response matches Challenge A streaming pattern
  └── 6.8  Full flow test ✅
              Upload PDF → ask question → tokens stream → 📄 badge visible
              → source chips show page estimates

PHASE 7 — Conversation history (both challenges)
  └── 7.1  Frontend: useChat already maintains full messages array in state
              No frontend changes needed — messages are sent on every request
  └── 7.2  Backend: extend ChatRequestDto to accept optional messages?: ChatMessage[]
              (already in ChatRequestSchema from Phase 0)
  └── 7.3  SearchService: include last N message pairs in buildSearchPrompt context:
              const history = dto.messages?.slice(-6) ?? []
              Inject as: "Conversation so far:\n{history}\n\nNew question: {query}"
  └── 7.4  QueryService: include message history in buildRagPrompt as well
              ⚠ This was missing from the original plan — RAG answers are also
                context-dependent. "Which one is cheaper?" requires history in RAG too.
  └── 7.5  Test follow-up questions ✅
              Challenge A: "Which one is cheaper?" after MacBook query
              Challenge B: "Can you elaborate on the second point?" after a summary

PHASE 8 — README + submission polish
  └── 8.1  Write README.md:
              Architecture diagram (ASCII from planning doc §3)
              Product concept: unified chat routing — one interface, two AI backends
              Setup:
                cp apps/backend/.env.example apps/backend/.env
                # fill in OPENAI_API_KEY and TAVILY_API_KEY
                pnpm install
                pnpm --filter @slooze/shared build
                pnpm dev
              Key design decisions:
                - Two endpoints vs one merged endpoint
                - ChromaDB folder persistence (dev) vs in-memory
                - Dedicated AIModule abstraction (provider swap = one file)
                - gpt-4o-mini: cost-aware, sufficient for both tasks
                - Request-shape routing: deterministic, zero latency, zero misclassification
              Known limitations:
                - No auth / no user isolation on documentId
                - ChromaDB folder persistence is not production-grade
                - No PDF page number extraction (estimated from chunk index)
              ⚠ Assignment requires an agent/ directory. Map this clearly in the README:
                "Source code lives in apps/backend/ (server) and apps/frontend/ (UI),
                 corresponding to the agent/ directory described in the assignment."
  └── 8.2  Create apps/backend/.env.example and apps/frontend/.env.example
  └── 8.3  Final end-to-end smoke test on a fresh clone simulation ✅
              git clone ... && pnpm install && pnpm --filter @slooze/shared build && pnpm dev
              → both challenges work from scratch
  └── 8.4  Push to GitHub ✅
```

---

### How we work through each micro-step

For every micro-step:
1. **Explain the concept** — why we're doing this, what problem it solves
2. **Show the implementation** — exact code, no hand-waving
3. **Tell you how to verify it** — what to run, what to look for
4. **Connect it to the bigger picture** — how this step fits into the system

---

### One ground rule

We don't move to the next step until the current one works. If something breaks, we debug it together before proceeding. This is how real engineering teams work.
