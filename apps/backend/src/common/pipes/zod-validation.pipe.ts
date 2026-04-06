import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import { z } from 'zod'

// ZodSchema / ZodType naming differs between Zod v3 and v4.
// Using z.ZodTypeAny covers both versions.
type AnyZodSchema = z.ZodTypeAny

/**
 * Validates a request body against a Zod schema.
 * Usage: @UsePipes(new ZodValidationPipe(MySchema))
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
    constructor(private readonly schema: AnyZodSchema) {}

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
