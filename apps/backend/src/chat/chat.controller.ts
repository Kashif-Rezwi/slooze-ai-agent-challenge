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
     * POST /api/chat
     *
     * NOTE: @Res() gives direct Express response access required for SSE streaming,
     * but as a side-effect NestJS interceptors do NOT fire for this endpoint.
     *
     * Returns a Server-Sent Events stream with four event shapes:
     *   { type: 'meta',  sources: string[], mode: string }   — first event, sources + mode
     *   { type: 'text',  chunk: string }                     — one per AI token delta
     *   { type: 'done' }                                     — stream complete
     *   { type: 'error', message: string }                   — only if streaming fails mid-way
     *
     * Pre-stream errors (bad input, 503 for PDF) are returned as plain JSON before
     * SSE headers are set, so the HTTP status code is meaningful.
     */
    @Post()
    @UsePipes(new ZodValidationPipe(ChatRequestSchema))
    async chat(@Body() dto: ChatRequestDto, @Req() req: Request, @Res() res: Response) {
        // Read or generate a correlation ID — echoed in the response header so
        // client logs and server logs can be matched to the same request.
        const requestId =
            (req.headers['x-request-id'] as string | undefined) ?? randomUUID()

        try {
            // streamHandle throws HttpExceptions before touching the response —
            // they propagate here before SSE headers are set, so the global
            // exception filter handles them as normal JSON 4xx/5xx responses.
            const { stream, sources, mode } = await this.chatService.streamHandle(dto)

            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache, no-transform')
            res.setHeader('Connection', 'keep-alive')
            res.setHeader('X-Accel-Buffering', 'no') // prevent nginx from buffering SSE
            res.setHeader('x-request-id', requestId)
            res.flushHeaders()

            // retry: 0 disables browser auto-reconnect on disconnect. SSE streaming
            // chat has no partial-resume semantics — auto-reconnect would just
            // trigger a duplicate request and a second AI call.
            res.write('retry: 0\n\n')

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
            // Error occurred during streaming after SSE headers were already sent
            const message = err instanceof Error ? err.message : 'Streaming error'
            res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
        } finally {
            if (res.headersSent && !res.writableEnded) {
                res.end()
            }
        }
    }
}
