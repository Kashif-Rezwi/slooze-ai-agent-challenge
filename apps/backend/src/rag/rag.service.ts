import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AIService } from '../ai/ai.service'
import { AI_CONFIG } from '../ai/ai.config'
import { VectorStoreService } from '../ingest/vector-store.service'
import { Env } from '../env.validation'
import type { ChatStream, HistoryTurn } from '../common/types'
import { formatHistoryBlock } from '../common/types'

// Summarize-intent queries retrieve up to 4× the default topK for broader document coverage.
const SUMMARIZE_RE = /\b(summarize|summarise|summary|overview|outline|brief|recap)\b/i

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

    async streamAnswer(documentIds: string[], query: string, history: HistoryTurn[] = []): Promise<ChatStream> {
        const queryEmbedding = await this.ai.embed(query)
        const nResults = SUMMARIZE_RE.test(query) ? Math.min(this.topK * 4, 20) : this.topK

        const { documents, metadatas } = await this.vectorStore.queryChunks({
            embedding: queryEmbedding,
            nResults,
            documentIds,
        })

        if (documents.length === 0) {
            return {
                stream: (async function* () {
                    yield "I couldn't find relevant content in the selected document(s) for that question."
                })(),
                sources: [],
                mode: 'pdf',
            }
        }

        // History precedes document excerpts so the model anchors on conversation context
        // before reading evidence — critical for follow-up questions to work correctly.
        const context = documents.map((doc, i) => `[${i + 1}] ${doc}`).join('\n\n')
        const userPrompt = `${formatHistoryBlock(history)}Document excerpts:\n\n${context}\n\nQuestion: ${query}`

        return {
            stream: this.ai.streamText(AI_CONFIG.systemPrompts.rag, userPrompt),
            sources: [...new Set(metadatas.map(m => m.filename))],
            mode: 'pdf',
        }
    }
}
