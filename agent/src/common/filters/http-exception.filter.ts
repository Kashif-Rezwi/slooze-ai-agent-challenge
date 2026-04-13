import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common'
import { Response } from 'express'

/** Catches all exceptions — HttpExceptions keep their status, everything else becomes 500. */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name)

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const res = ctx.getResponse<Response>()

        if (res.headersSent) return // SSE already started — nothing left to write

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR

        // getResponse() preserves structured detail (e.g. { message, errors }).
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
            this.logger.warn(`${status} ${String(error)}`)
        }

        res.status(status).json({ error, code: status })
    }
}
