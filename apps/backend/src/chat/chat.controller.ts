import { Controller, Post, Body, Req, Res, UsePipes } from '@nestjs/common'
import { Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { ChatRequestSchema } from '@slooze/shared'
import { ChatService } from './chat.service'
import { ChatRequestDto } from './dto/chat.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    /**
     * POST /api/chat — returns a Server-Sent Events stream.
     *
     * Note: @Res() is required for SSE but disables NestJS interceptors on this endpoint.
     *
     * Event shapes:
     *   { type: 'meta',  sources: string[], mode: string }  — first, before any tokens
     *   { type: 'text',  chunk: string }                    — one per AI token
     *   { type: 'done' }                                    — stream complete
     *   { type: 'error', message: string }                  — mid-stream failure only
     *
     * Pre-stream errors (4xx / 503) are returned as plain JSON with a meaningful status code.
     */
    @Post()
    @UsePipes(new ZodValidationPipe(ChatRequestSchema))
    async chat(@Body() dto: ChatRequestDto, @Req() req: Request, @Res() res: Response) {
        const requestId = (req.headers['x-request-id'] as string | undefined) ?? randomUUID()

        try {
            // HttpExceptions thrown here reach the global filter as JSON (headers not yet sent).
            const { stream, sources, mode } = await this.chatService.streamHandle(dto)

            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache, no-transform')
            res.setHeader('Connection', 'keep-alive')
            res.setHeader('X-Accel-Buffering', 'no') // prevent nginx buffering SSE
            res.setHeader('x-request-id', requestId)
            res.flushHeaders()

            res.write('retry: 0\n\n') // disable browser auto-reconnect (no resume semantics)
            res.write(`data: ${JSON.stringify({ type: 'meta', sources, mode })}\n\n`)

            for await (const chunk of stream) {
                res.write(`data: ${JSON.stringify({ type: 'text', chunk })}\n\n`)
            }

            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        } catch (err) {
            if (!res.headersSent) throw err // pre-stream error → global filter handles it

            const message = err instanceof Error ? err.message : 'Streaming error'
            res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
        } finally {
            if (res.headersSent && !res.writableEnded) res.end()
        }
    }
}
