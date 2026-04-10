import type { Mode } from '@slooze/shared'

/**
 * Shared return shape for all chat pipeline branches (web search + PDF RAG).
 *
 * Defined here — in the common layer — so lower-level modules (search, rag)
 * can reference it without importing upward into the chat module, which would
 * create a circular dependency risk.
 *
 * `stream`  — AsyncIterable<string> satisfied by both the AI SDK's textStream
 *             and inline async generators used for no-results fallback messages.
 * `sources` — URL strings for web mode; filename string array for PDF mode.
 * `mode`    — identifies which pipeline produced the response.
 */
export interface ChatStream {
    stream: AsyncIterable<string>
    sources: string[]
    mode: Mode
}
