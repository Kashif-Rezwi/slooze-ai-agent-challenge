import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AIService } from '../ai/ai.service'
import { AI_CONFIG } from '../ai/ai.config'
import { VectorStoreService } from '../ingest/vector-store.service'
import { Env } from '../env.validation'
import type { ChatStream } from '../chat/chat.service'

@Injectable()
export class RagService {
    private readonly topK: number

    constructor(
        private readonly ai: AIService,
        private readonly vectorStore: VectorStoreService,
        private readonly config: ConfigService<Env, true>,
    ) {
        this.topK = this.config.get('TOP_K_RESULTS')
    }

    async streamAnswer(documentId: string, query: string): Promise<ChatStream> {
        // 1. Embed the user's query
        const queryEmbedding = await this.ai.embed(query)

        // 2. Retrieve the nearest chunks for this specific document
        const { documents, metadatas } = this.vectorStore.queryChunks({
            embedding: queryEmbedding,
            nResults: this.topK,
            documentId,
        })

        if (documents.length === 0) {
            return {
                stream: (async function* () {
                    yield "I couldn't find relevant content in the document for that question."
                })(),
                sources: [],
                mode: 'pdf',
            }
        }

        // 3. Build context and stream a grounded answer.
        // All retrieved chunks belong to the same document, so a single filename
        // is the correct and complete source attribution.
        const context = documents.map((doc, i) => `[${i + 1}] ${doc}`).join('\n\n')
        const userPrompt = `Context from document:\n\n${context}\n\nQuestion: ${query}`
        const sources = metadatas.length > 0 ? [metadatas[0].filename] : []

        return {
            stream: this.ai.streamText(AI_CONFIG.systemPrompts.rag, userPrompt),
            sources,
            mode: 'pdf',
        }
    }
}
