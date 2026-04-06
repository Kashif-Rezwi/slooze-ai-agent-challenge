import { Injectable } from '@nestjs/common'
import { ChatRequestDto } from './dto/chat.dto'

/**
 * Routes incoming chat requests to the correct pipeline:
 *   documentId present → RagService (Challenge B)  — wired in Phase 5
 *   plain text only    → SearchService (Challenge A) — wired in Phase 2
 */
@Injectable()
export class ChatService {
    handle(_dto: ChatRequestDto): never {
        throw new Error('ChatService.handle not yet implemented — wired in Phase 2')
    }
}
