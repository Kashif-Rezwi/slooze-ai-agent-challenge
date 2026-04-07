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
     * Phase 2: returns plain JSON { answer, sources, mode }.
     * Phase 4: switches to streaming SSE response.
     */
    @Post()
    @UsePipes(new ZodValidationPipe(ChatRequestSchema))
    async chat(@Body() dto: ChatRequestDto, @Res() res: Response) {
        const result = await this.chatService.handle(dto)
        res.json(result)
    }
}
