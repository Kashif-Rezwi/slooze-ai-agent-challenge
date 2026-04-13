import { Injectable, BadRequestException } from '@nestjs/common'
import type { ChatRequest } from '@slooze/shared'
import { SearchService } from '../search/search.service'
import { RagService } from '../rag/rag.service'
import type { ChatStream, HistoryTurn } from '../common/types'

/**
 * Routes requests to the correct pipeline:
 *   documentIds present → RagService (PDF RAG)
 *   no documentIds      → SearchService (web search)
 *
 * dto.messages carries up to 6 prior turns so both pipelines answer follow-up questions correctly.
 */
@Injectable()
export class ChatService {
    constructor(
        private readonly searchService: SearchService,
        private readonly ragService: RagService,
    ) { }

    async streamHandle(dto: ChatRequest): Promise<ChatStream> {
        const query = dto.message ?? dto.messages?.at(-1)?.content
        if (!query?.trim()) {
            throw new BadRequestException('No message content found in request')
        }

        // Keep the last 6 turns and strip to wire fields only.
        const history: HistoryTurn[] = (dto.messages ?? [])
            .slice(-6)
            .filter(m => m.content.trim().length > 0)
            .map(m => ({ role: m.role, content: m.content }))

        if (dto.documentIds && dto.documentIds.length > 0) {
            return this.ragService.streamAnswer(dto.documentIds, query, history)
        }

        return this.searchService.streamSearch(query, history)
    }
}
