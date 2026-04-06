import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name)

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
