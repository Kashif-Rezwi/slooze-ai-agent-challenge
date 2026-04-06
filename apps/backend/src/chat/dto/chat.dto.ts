import { ChatRequest } from '@slooze/shared'

/**
 * DTO type is inferred from the shared Zod schema.
 * Validation is applied at the controller via ZodValidationPipe(ChatRequestSchema).
 */
export type ChatRequestDto = ChatRequest
