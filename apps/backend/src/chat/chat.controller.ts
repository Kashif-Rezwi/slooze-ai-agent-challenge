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
     *
     * Returns a Server-Sent Events stream with three event shapes:
     *   { type: 'meta',  sources: string[], mode: string }   — first event, Tavily URLs + mode
     *   { type: 'text',  chunk: string }                     — one per AI token delta
     *   { type: 'done' }                                     — stream complete
     *   { type: 'error', message: string }                   — only if streaming fails mid-way
     *
     * Pre-stream errors (bad input, 503 for PDF) are returned as plain JSON before
     * SSE headers are set, so the HTTP status code is meaningful.
     */
    @Post()
    @UsePipes(new ZodValidationPipe(ChatRequestSchema))
    async chat(@Body() dto: ChatRequestDto, @Res() res: Response) {
        try {
            // streamHandle throws HttpExceptions before touching the response —
            // they propagate here before we set SSE headers, so NestJS exception
            // filter handles them as normal JSON 4xx/5xx responses.
            const { stream, sources, mode } = await this.chatService.streamHandle(dto)

            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache, no-transform')
            res.setHeader('Connection', 'keep-alive')
            res.setHeader('X-Accel-Buffering', 'no') // prevent nginx from buffering SSE
            res.flushHeaders()

            // First event: metadata (sources + mode) — available before first AI token
            res.write(`data: ${JSON.stringify({ type: 'meta', sources, mode })}\n\n`)

            for await (const chunk of stream) {
                res.write(`data: ${JSON.stringify({ type: 'text', chunk })}\n\n`)
            }

            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        } catch (err) {
            if (!res.headersSent) {
                // Normal HTTP error path — let the global exception filter respond
                throw err
            }
            // Error occurred during streaming after headers were sent
            const message = err instanceof Error ? err.message : 'Streaming error'
            res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
        } finally {
            if (res.headersSent && !res.writableEnded) {
                res.end()
            }
        }
    }
}
