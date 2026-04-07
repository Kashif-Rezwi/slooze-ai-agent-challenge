import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { generateText as aiGenerateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { AI_CONFIG } from './ai.config'
import { Env } from '../env.validation'

/**
 * Central abstraction over all AI SDK calls.
 * No other module imports from 'ai' or '@ai-sdk/openai' directly — they all go through here.
 * Swapping the provider means changing this file only.
 */
@Injectable()
export class AIService {
    private readonly openai: ReturnType<typeof createOpenAI>

    constructor(private readonly config: ConfigService<Env, true>) {
        this.openai = createOpenAI({
            apiKey: this.config.get('OPENAI_API_KEY'),
        })
    }

    async generateText(system: string, user: string): Promise<string> {
        // AI SDK v6: system is a top-level param, not part of the messages array.
        // ModelMessage = UserModelMessage | AssistantModelMessage | ToolModelMessage — no system role.
        const { text } = await aiGenerateText({
            model: this.openai(AI_CONFIG.chatModel),
            system,
            prompt: user,
            maxOutputTokens: AI_CONFIG.maxOutputTokens,
        })
        return text
    }

    // Streaming wired in Phase 4. Signature matches generateText for easy swap.
    async *streamText(_system: string, _user: string): AsyncGenerator<string> {
        throw new Error('AIService.streamText not yet implemented — wired in Phase 4')
    }

    async embed(_text: string): Promise<number[]> {
        throw new Error('AIService.embed not yet implemented — wired in Phase 5')
    }

    async embedMany(_texts: string[]): Promise<number[][]> {
        throw new Error('AIService.embedMany not yet implemented — wired in Phase 5')
    }
}
