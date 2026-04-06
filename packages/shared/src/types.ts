import { z } from 'zod'
import {
    ModeSchema,
    ChatMessageSchema,
    ChatRequestSchema,
    ChatResponseSchema,
    UploadResponseSchema
} from './schemas'

export type Mode = z.infer<typeof ModeSchema>
export type ChatMessage = z.infer<typeof ChatMessageSchema>
export type ChatRequest = z.infer<typeof ChatRequestSchema>
export type ChatResponse = z.infer<typeof ChatResponseSchema>
export type UploadResponse = z.infer<typeof UploadResponseSchema>