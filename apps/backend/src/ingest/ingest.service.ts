import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PDFParse } from 'pdf-parse'
import { v4 as uuidv4 } from 'uuid'
import { AIService } from '../ai/ai.service'
import { VectorStoreService } from './vector-store.service'
import { Env } from '../env.validation'

export interface IngestResult {
    documentId: string
    filename: string
    chunkCount: number
}

/**
 * Splits plain text into overlapping fixed-size chunks (character-based).
 * Returns an empty array if the text is blank.
 */
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = []
    let start = 0
    while (start < text.length) {
        chunks.push(text.slice(start, start + chunkSize))
        start += chunkSize - overlap
    }
    return chunks
}

@Injectable()
export class IngestService {
    private readonly logger = new Logger(IngestService.name)
    private readonly chunkSize: number
    private readonly chunkOverlap: number

    constructor(
        private readonly ai: AIService,
        private readonly vectorStore: VectorStoreService,
        private readonly config: ConfigService<Env, true>,
    ) {
        this.chunkSize = this.config.get('CHUNK_SIZE')
        this.chunkOverlap = this.config.get('CHUNK_OVERLAP')
    }

    async ingest(buffer: Buffer, filename: string): Promise<IngestResult> {
        // 1. Parse PDF → plain text using pdf-parse v2 class API
        const parser = new PDFParse({ data: new Uint8Array(buffer) })
        const { text } = await parser.getText()
        const cleanText = text.replace(/\s+/g, ' ').trim()

        // 2. Chunk
        const chunks = chunkText(cleanText, this.chunkSize, this.chunkOverlap)
        if (chunks.length === 0) {
            return { documentId: uuidv4(), filename, chunkCount: 0 }
        }

        const documentId = uuidv4()

        // 3. Embed all chunks in one batch call
        const embeddings = await this.ai.embedMany(chunks)

        // 4. Store in the vector store with documentId + chunkIndex metadata
        const metadatas = chunks.map((_, i) => ({ documentId, chunkIndex: i }))

        this.vectorStore.addChunks({ embeddings, documents: chunks, metadatas })

        this.logger.log(`Ingested "${filename}" → ${chunks.length} chunks (documentId: ${documentId})`)

        return { documentId, filename, chunkCount: chunks.length }
    }
}
