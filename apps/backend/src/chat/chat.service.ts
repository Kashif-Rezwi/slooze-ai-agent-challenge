import { Injectable, BadRequestException } from '@nestjs/common'
import { SearchService, SearchStream } from '../search/search.service'
import { RagService, RagStream } from '../rag/rag.service'
import { ChatRequestDto } from './dto/chat.dto'

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

    async streamHandle(dto: ChatRequestDto): Promise<SearchStream | RagStream> {
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
