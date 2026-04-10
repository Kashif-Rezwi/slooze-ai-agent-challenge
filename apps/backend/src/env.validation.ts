import { z } from 'zod'

const envSchema = z
    .object({
        PORT:         z.coerce.number().default(3001),
        FRONTEND_URL: z.string().default('http://localhost:3000'),

        OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
        TAVILY_API_KEY: z.string().min(1, 'TAVILY_API_KEY is required'),

        // ChromaDB Cloud credentials are optional at the env level.
        // VectorStoreService handles missing/invalid credentials gracefully at
        // runtime — the app starts normally and only PDF RAG routes return 503.
        CHROMA_API_KEY:  z.string().default(''),
        CHROMA_TENANT:   z.string().default(''),
        CHROMA_DATABASE: z.string().default(''),

        // CHUNK_OVERLAP must be strictly less than CHUNK_SIZE; otherwise the
        // chunkText loop in ingest.service.ts would never advance (infinite loop).
        CHUNK_SIZE:    z.coerce.number().min(100, 'CHUNK_SIZE must be at least 100').default(500),
        CHUNK_OVERLAP: z.coerce.number().min(0,   'CHUNK_OVERLAP must be non-negative').default(50),
        TOP_K_RESULTS: z.coerce.number().min(1,   'TOP_K_RESULTS must be at least 1').default(5),
    })
    .refine(data => data.CHUNK_OVERLAP < data.CHUNK_SIZE, {
        message: 'CHUNK_OVERLAP must be strictly less than CHUNK_SIZE',
        path: ['CHUNK_OVERLAP'],
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
