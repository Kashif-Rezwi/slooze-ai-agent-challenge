import { Injectable } from '@nestjs/common'
import { AIService } from '../ai/ai.service'
import { AI_CONFIG } from '../ai/ai.config'
import { TavilyService, TavilyResult } from './tavily.service'
import type { ChatStream } from '../common/types'

/** Formats Tavily results into the LLM user prompt. */
function buildUserPrompt(query: string, results: TavilyResult[]): string {
    const formatted = results
        .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`)
        .join('\n\n')

    return `Search results:\n\n${formatted}\n\nQuestion: ${query}`
}

@Injectable()
export class SearchService {
    constructor(
        private readonly tavily: TavilyService,
        private readonly ai: AIService,
    ) {}

    async streamSearch(query: string): Promise<ChatStream> {
        const results = await this.tavily.search(query)

        if (results.length === 0) {
            return {
                stream: (async function* () {
                    yield "I couldn't find relevant web results for that query. Please try rephrasing."
                })(),
                sources: [],
                mode: 'web',
            }
        }

        return {
            stream: this.ai.streamText(AI_CONFIG.systemPrompts.webSearch, buildUserPrompt(query, results)),
            sources: results.map(r => r.url),
            mode: 'web',
        }
    }
}
