import { Injectable } from '@nestjs/common'
import { AIService } from '../ai/ai.service'
import { AI_CONFIG } from '../ai/ai.config'
import { TavilyService, TavilyResult } from './tavily.service'
import { ChatResponse } from '@slooze/shared'

@Injectable()
export class SearchService {
    constructor(
        private readonly tavily: TavilyService,
        private readonly ai: AIService,
    ) {}

    async search(query: string): Promise<ChatResponse> {
        const results = await this.tavily.search(query)

        if (results.length === 0) {
            return {
                answer: "I couldn't find relevant web results for that query. Please try rephrasing.",
                sources: [],
                mode: 'web',
            }
        }

        const user = this.buildUserPrompt(query, results)
        const answer = await this.ai.generateText(AI_CONFIG.systemPrompts.webSearch, user)

        return {
            answer,
            sources: results.map(r => r.url),
            mode: 'web',
        }
    }

    private buildUserPrompt(query: string, results: TavilyResult[]): string {
        const formatted = results
            .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`)
            .join('\n\n')

        return `Search results:\n\n${formatted}\n\nQuestion: ${query}`
    }
}
