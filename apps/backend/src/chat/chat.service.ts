import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { ChatResponse } from '@slooze/shared'
import { SearchService } from '../search/search.service'
import { ChatRequestDto } from './dto/chat.dto'

/**
 * Routes incoming chat requests to the correct pipeline:
 *   documentId present → RagService (Challenge B)  — wired in Phase 5
 *   plain text only    → SearchService (Challenge A)
 */
@Injectable()
export class ChatService {
    constructor(private readonly searchService: SearchService) {}

    async handle(dto: ChatRequestDto): Promise<ChatResponse> {
        // useChat sends messages[], direct calls send message string.
        // Extract the current query from whichever is present.
        const query = dto.message ?? dto.messages?.at(-1)?.content

        if (!query?.trim()) {
            throw new BadRequestException('No message content found in request')
        }

        if (dto.documentId) {
            throw new ServiceUnavailableException(
                'PDF Q&A not yet implemented — coming in Phase 5'
            )
        }

        return this.searchService.search(query)
    }
}
