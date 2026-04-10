import { z } from 'zod'

const envSchema = z.object({
    PORT: z.coerce.number().default(3001),
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
    TAVILY_API_KEY: z.string().min(1, 'TAVILY_API_KEY is required'),
    CHROMA_API_KEY: z.string().min(1, 'CHROMA_API_KEY is required'),
    CHROMA_TENANT: z.string().min(1, 'CHROMA_TENANT is required'),
    CHROMA_DATABASE: z.string().min(1, 'CHROMA_DATABASE is required'),
    CHUNK_SIZE: z.coerce.number().default(500),
    CHUNK_OVERLAP: z.coerce.number().default(50),
    TOP_K_RESULTS: z.coerce.number().default(5),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>): Env {
    const result = envSchema.safeParse(config)
    if (!result.success) {
        const issues = result.error.issues
            .map(i => `  ${i.path.join('.') || 'root'}: ${i.message}`)
            .join('\n')
        throw new Error(`Environment validation failed:\n${issues}`)
    }
    return result.data
}
