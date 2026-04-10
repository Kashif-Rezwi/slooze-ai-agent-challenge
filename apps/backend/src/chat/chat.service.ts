import { Injectable, BadRequestException } from '@nestjs/common'
import type { ChatRequest } from '@slooze/shared'
import { SearchService } from '../search/search.service'
import { RagService } from '../rag/rag.service'
import type { ChatStream } from '../common/types'

/**
 * Routes chat requests to the correct pipeline:
 *   documentId present → RagService (PDF RAG)
 *   no documentId      → SearchService (web search)
 */
@Injectable()
export class ChatService {
    constructor(
        private readonly searchService: SearchService,
        private readonly ragService: RagService,
    ) {}

    async streamHandle(dto: ChatRequest): Promise<ChatStream> {
        // Multi-turn: only the last message is used — history is not forwarded to the AI.
        const query = dto.message ?? dto.messages?.at(-1)?.content
        if (!query?.trim()) {
            throw new BadRequestException('No message content found in request')
        }

        if (dto.documentId) {
            return this.ragService.streamAnswer(dto.documentId, query)
        }

        return this.searchService.streamSearch(query)
    }
}
