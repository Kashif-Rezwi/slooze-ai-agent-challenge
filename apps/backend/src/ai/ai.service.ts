import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
    streamText as aiStreamText,
    embed as aiEmbed,
    embedMany as aiEmbedMany,
} from 'ai'
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

    async *streamText(system: string, user: string): AsyncGenerator<string> {
        const result = aiStreamText({
            model: this.openai(AI_CONFIG.chatModel),
            system,
            prompt: user,
            maxOutputTokens: AI_CONFIG.maxOutputTokens,
        })
        for await (const chunk of result.textStream) {
            yield chunk
        }
    }

    async embed(text: string): Promise<number[]> {
        const { embedding } = await aiEmbed({
            model: this.openai.embedding(AI_CONFIG.embeddingModel),
            value: text,
        })
        return embedding
    }

    async embedMany(texts: string[]): Promise<number[][]> {
        const { embeddings } = await aiEmbedMany({
            model: this.openai.embedding(AI_CONFIG.embeddingModel),
            values: texts,
        })
        return embeddings
    }
}
