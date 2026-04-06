import { Controller, Post, Body, Res, UsePipes } from '@nestjs/common'
import { Response } from 'express'
import { ChatRequestSchema } from '@slooze/shared'
import { ChatService } from './chat.service'
import { ChatRequestDto } from './dto/chat.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    /**
     * POST /api/chat
     * Accepts a chat message (plain query or PDF question) and returns a response.
     * Streaming (SSE) is wired in Phase 4. For now returns a stub 200.
     */
    @Post()
    @UsePipes(new ZodValidationPipe(ChatRequestSchema))
    chat(@Body() _dto: ChatRequestDto, @Res() res: Response) {
        // Phase 2: delegate to ChatService and return non-streaming response
        // Phase 4: switch to streaming SSE response
        res.json({ message: 'stub — Phase 2 coming' })
    }
}
