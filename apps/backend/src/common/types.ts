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

/** A single turn in the conversation history forwarded by the frontend. */
export type HistoryTurn = { role: 'user' | 'assistant'; content: string }

/**
 * Formats a history array as the "Conversation history:\n...\n\n" prompt block.
 * Returns an empty string when there is no history so callers can concatenate directly.
 */
export function formatHistoryBlock(history: HistoryTurn[]): string {
    if (history.length === 0) return ''
    const lines = history
        .map(t => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.content}`)
        .join('\n')
    return `Conversation history:\n${lines}\n\n`
}
