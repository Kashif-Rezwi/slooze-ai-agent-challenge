import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { SearchService, SearchStream } from '../search/search.service'
import { ChatRequestDto } from './dto/chat.dto'

/**
 * Routes incoming chat requests to the correct pipeline:
 *   documentId present → RagService (Challenge B)  — wired in Phase 5
 *   plain text only    → SearchService (Challenge A)
 */
@Injectable()
export class ChatService {
    constructor(private readonly searchService: SearchService) {}

    private extractQuery(dto: ChatRequestDto): string {
        const query = dto.message ?? dto.messages?.at(-1)?.content
        if (!query?.trim()) {
            throw new BadRequestException('No message content found in request')
        }
        if (dto.documentId) {
            throw new ServiceUnavailableException('PDF Q&A not yet implemented — coming in Phase 5')
        }
        return query
    }

    async streamHandle(dto: ChatRequestDto): Promise<SearchStream> {
        const query = this.extractQuery(dto)
        return this.searchService.streamSearch(query)
    }
}
