import { Injectable } from '@nestjs/common'

/**
 * Central abstraction over all AI SDK calls.
 * No other module imports from 'ai' or '@ai-sdk/openai' directly — they all go through here.
 * Swapping the provider means changing this file only.
 *
 * Stubs are in place for Phase 1. Real implementations are wired in:
 *   - generateText / streamText → Phase 2 (Challenge A)
 *   - embed / embedMany        → Phase 5 (Challenge B)
 */
@Injectable()
export class AIService {
    async generateText(_prompt: string): Promise<string> {
        throw new Error('AIService.generateText not yet implemented — wired in Phase 2')
    }

    // Explicit return type annotation is required because without a yield
    // TypeScript infers AsyncGenerator<never>. The throw is the entire body.
    async *streamText(_prompt: string): AsyncGenerator<string> {
        throw new Error('AIService.streamText not yet implemented — wired in Phase 4')
    }

    async embed(_text: string): Promise<number[]> {
        throw new Error('AIService.embed not yet implemented — wired in Phase 5')
    }

    async embedMany(_texts: string[]): Promise<number[][]> {
        throw new Error('AIService.embedMany not yet implemented — wired in Phase 5')
    }
}
