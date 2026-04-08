import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common'
import { Response } from 'express'

/**
 * Catches all unhandled exceptions and returns a consistent JSON error shape.
 * Named "Global" because @Catch() (no args) intercepts everything — not just
 * HttpExceptions. HttpExceptions get their status code; anything else gets 500.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name)

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const res = ctx.getResponse<Response>()

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR

        const message =
            exception instanceof HttpException
                ? exception.message
                : 'Internal server error'

        if (status >= 500) {
            this.logger.error(exception instanceof Error ? exception.stack : String(exception))
        }

        res.status(status).json({ error: message, code: status })
    }
}
