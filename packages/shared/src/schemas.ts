import { z } from 'zod'

export const ModeSchema = z.enum(['web', 'pdf'])

// id is optional because the Vercel AI SDK useChat hook does not include
// it in the wire format (sends { role, content } only).
export const ChatMessageSchema = z.object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    mode: ModeSchema.optional(),
    sources: z.array(z.string()).optional(),
    // z.date() rejects ISO strings coming from JSON; coerce handles both.
    createdAt: z.coerce.date().optional(),
})

// At least one of message or messages must be present.
// - message: used for direct API calls (curl, tests)
// - messages: used by useChat hook (sends full conversation history array)
export const ChatRequestSchema = z.object({
    message: z.string().min(1).optional(),
    messages: z.array(ChatMessageSchema).optional(),
    documentId: z.string().uuid().optional(),
}).refine(
    data => data.message || (data.messages && data.messages.length > 0),
    { message: 'Either message or messages (non-empty) must be provided' }
)

export const ChatResponseSchema = z.object({
    answer: z.string(),
    sources: z.array(z.string()),
    mode: ModeSchema,
})

export const UploadResponseSchema = z.object({
    documentId: z.string().uuid(),
    filename: z.string(),
})