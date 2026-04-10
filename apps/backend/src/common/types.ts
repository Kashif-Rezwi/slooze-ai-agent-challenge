import type { Mode } from '@slooze/shared'

/**
 * Return shape shared by all chat pipelines.
 * Lives in common/ so search and rag modules don't import upward into chat.
 */
export interface ChatStream {
    stream: AsyncIterable<string>
    sources: string[]
    mode: Mode
}
