import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import { z } from 'zod'

/**
 * Validates a request body against a Zod schema.
 * Usage: @UsePipes(new ZodValidationPipe(MySchema))
 *
 * z.ZodType is the correct base type in Zod v4 (ZodTypeAny was deprecated).
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
    constructor(private readonly schema: z.ZodType) {}

    transform(value: unknown) {
        const result = this.schema.safeParse(value)
        if (!result.success) {
            const messages = result.error.issues.map(
                i => `${i.path.join('.') || 'body'}: ${i.message}`
            )
            throw new BadRequestException(messages.join('; '))
        }
        return result.data
    }
}
