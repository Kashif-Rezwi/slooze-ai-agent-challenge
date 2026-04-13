import { Injectable, BadGatewayException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
    generateText as aiGenerateText,
    streamText as aiStreamText,
    embed as aiEmbed,
    embedMany as aiEmbedMany,
} from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { AI_CONFIG } from './ai.config'
import { Env } from '../env.validation'

/** Single point of contact for all AI SDK calls — swap the provider here only. */
@Injectable()
export class AIService {
    private readonly openai: ReturnType<typeof createOpenAI>

    constructor(private readonly config: ConfigService<Env, true>) {
        this.openai = createOpenAI({ apiKey: this.config.get('OPENAI_API_KEY') })
    }

    /**
     * Non-streaming text generation — for short internal utility calls
     * (e.g. query reformulation). Uses a small token budget for speed.
     */
    async generateText(system: string, user: string): Promise<string> {
        try {
            const { text } = await aiGenerateText({
                model: this.openai(AI_CONFIG.chatModel),
                system,
                prompt: user,
                maxOutputTokens: AI_CONFIG.maxQueryTokens,
            })
            return text.trim()
        } catch (err) {
            throw new BadGatewayException(
                `AI text generation unavailable: ${err instanceof Error ? err.message : 'Unknown error'}`,
            )
        }
    }

    /** Streaming text generation — tokens delivered to the SSE controller as they arrive. */
    streamText(system: string, user: string): AsyncIterable<string> {
        try {
            const result = aiStreamText({
                model: this.openai(AI_CONFIG.chatModel),
                system,
                prompt: user,
                maxOutputTokens: AI_CONFIG.maxOutputTokens,
            })
            return result.textStream
        } catch (err) {
            throw new BadGatewayException(
                `AI streaming unavailable: ${err instanceof Error ? err.message : 'Unknown error'}`,
            )
        }
    }

    async embed(text: string): Promise<number[]> {
        try {
            const { embedding } = await aiEmbed({
                model: this.openai.embedding(AI_CONFIG.embeddingModel),
                value: text,
            })
            return embedding
        } catch (err) {
            throw new BadGatewayException(
                `AI embedding unavailable: ${err instanceof Error ? err.message : 'Unknown error'}`,
            )
        }
    }

    async embedMany(texts: string[]): Promise<number[][]> {
        try {
            const { embeddings } = await aiEmbedMany({
                model: this.openai.embedding(AI_CONFIG.embeddingModel),
                values: texts,
            })
            return embeddings
        } catch (err) {
            throw new BadGatewayException(
                `AI embedding unavailable: ${err instanceof Error ? err.message : 'Unknown error'}`,
            )
        }
    }
}
