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
 *
 * Registered via APP_FILTER token in AppModule so NestJS DI manages the instance.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name)

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const res = ctx.getResponse<Response>()

        // Guard: if SSE headers were already sent (e.g. error mid-stream),
        // there is nothing useful we can write — Express silently ignores
        // writes after res.end(), so return early to make intent explicit.
        if (res.headersSent) return

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR

        // getResponse() returns the full structured object for HttpExceptions
        // built with an object argument (e.g. new BadRequestException({ errors })).
        // Falling back to a plain string only for non-HTTP exceptions.
        const response =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error'

        const error =
            typeof response === 'string'
                ? response
                : (response as Record<string, unknown>)['message'] ?? response

        if (status >= 500) {
            this.logger.error(exception instanceof Error ? exception.stack : String(exception))
        } else {
            // Log 4xx as warnings so client errors are visible during debugging
            // without requiring a separate HTTP logging interceptor.
            this.logger.warn(`${status} ${String(error)}`)
        }

        res.status(status).json({ error, code: status })
    }
}
