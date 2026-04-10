import { Injectable, BadRequestException } from '@nestjs/common'
import { SearchService } from '../search/search.service'
import { RagService } from '../rag/rag.service'
import { ChatRequestDto } from './dto/chat.dto'
import type { Mode } from '@slooze/shared'

/**
 * Shared return shape for both pipeline branches.
 * `stream` is AsyncIterable<string> — satisfied by both the AI SDK's textStream
 * and inline async generators used for fallback messages.
 * `sources` are URL strings (web) or a filename string (PDF).
 * `mode` identifies which pipeline answered.
 */
export interface ChatStream {
    stream: AsyncIterable<string>
    sources: string[]
    mode: Mode
}

/**
 * Routes incoming chat requests to the correct pipeline:
 *   documentId present → RagService  (Challenge B)
 *   plain text only    → SearchService (Challenge A)
 */
@Injectable()
export class ChatService {
    constructor(
        private readonly searchService: SearchService,
        private readonly ragService: RagService,
    ) {}

    async streamHandle(dto: ChatRequestDto): Promise<ChatStream> {
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
