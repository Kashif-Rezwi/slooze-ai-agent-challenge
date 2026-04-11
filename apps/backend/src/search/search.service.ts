import { Injectable, Logger } from '@nestjs/common'
import { AIService } from '../ai/ai.service'
import { AI_CONFIG } from '../ai/ai.config'
import { TavilyService, TavilyResult } from './tavily.service'
import type { ChatStream, HistoryTurn } from '../common/types'
import { formatHistoryBlock } from '../common/types'

export type { HistoryTurn }

/**
 * Builds the LLM user prompt.
 * History precedes search results so the model anchors on context before evidence,
 * preventing it from treating decontextualised follow-up questions as standalone queries.
 */
function buildUserPrompt(query: string, results: TavilyResult[], history: HistoryTurn[]): string {
    const searchSection = results
        .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`)
        .join('\n\n')
    return `${formatHistoryBlock(history)}Search results:\n\n${searchSection}\n\nQuestion: ${query}`
}

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name)

    constructor(
        private readonly tavily: TavilyService,
        private readonly ai: AIService,
    ) { }

    /**
     * Reformulates a follow-up question into a standalone search query before hitting Tavily.
     */
    private async reformulateQuery(query: string, history: HistoryTurn[]): Promise<string> {
        const prompt = `${formatHistoryBlock(history)}Follow-up question: ${query}\n\nStandalone search query:`
        try {
            const rewritten = await this.ai.generateText(AI_CONFIG.systemPrompts.queryReformulation, prompt)
            // Guard against empty or runaway output.
            return rewritten && rewritten.length < 200 ? rewritten : query
        } catch {
            this.logger.warn('Query reformulation failed — falling back to original query')
            return query
        }
    }

    async streamSearch(query: string, history: HistoryTurn[] = []): Promise<ChatStream> {
        const searchQuery = history.length > 0 ? await this.reformulateQuery(query, history) : query
        const results = await this.tavily.search(searchQuery)

        if (results.length === 0) {
            return {
                stream: (async function* () {
                    yield "I couldn't find relevant web results for that query. Please try rephrasing."
                })(),
                sources: [],
                mode: 'web',
            }
        }

        // Use the original query (not the reformulated one) in the LLM prompt —
        // the response should address what the user literally asked, not the search rewrite.
        return {
            stream: this.ai.streamText(AI_CONFIG.systemPrompts.webSearch, buildUserPrompt(query, results, history)),
            sources: results.map(r => r.url),
            mode: 'web',
        }
    }
}
