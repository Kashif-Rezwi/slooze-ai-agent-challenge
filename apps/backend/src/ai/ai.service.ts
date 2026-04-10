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

/** Max texts per embedding request — avoids hitting OpenAI's per-request limits. */
const EMBEDDING_BATCH_SIZE = 100

/** Single point of contact for all AI SDK calls — swap the provider here only. */
@Injectable()
export class AIService {
    private readonly openai: ReturnType<typeof createOpenAI>

    constructor(private readonly config: ConfigService<Env, true>) {
        this.openai = createOpenAI({ apiKey: this.config.get('OPENAI_API_KEY') })
    }

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

    /** Sends texts in batches to stay within OpenAI's per-request limits. */
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
