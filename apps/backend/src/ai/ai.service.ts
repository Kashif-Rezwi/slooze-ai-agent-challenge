import { Injectable, BadGatewayException } from '@nestjs/common'
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
 * Maximum texts sent to the embedding API in one request.
 * Guards against hitting OpenAI's per-request item/token limits on large PDFs.
 */
const EMBEDDING_BATCH_SIZE = 100

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

    /**
     * Returns the SDK's AsyncIterable<string> token stream directly.
     * No generator wrapper needed — AsyncIterable is sufficient for `for await`.
     * Runtime streaming errors bubble to ChatController which sends an SSE error event.
     */
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
                `AI text generation unavailable: ${err instanceof Error ? err.message : 'Unknown error'}`,
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

    /**
     * Embeds texts in batches of EMBEDDING_BATCH_SIZE to avoid hitting
     * the OpenAI API's per-request token/item limits on large documents.
     */
    async embedMany(texts: string[]): Promise<number[][]> {
        const results: number[][] = []

        for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
            const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE)
            try {
                const { embeddings } = await aiEmbedMany({
                    model: this.openai.embedding(AI_CONFIG.embeddingModel),
                    values: batch,
                })
                results.push(...embeddings)
            } catch (err) {
                throw new BadGatewayException(
                    `AI embedding unavailable: ${err instanceof Error ? err.message : 'Unknown error'}`,
                )
            }
        }

        return results
    }
}
