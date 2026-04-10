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
}

/** Splits text into overlapping fixed-size character chunks. Throws if overlap >= chunkSize. */
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
    if (chunkSize <= 0 || overlap >= chunkSize) {
        throw new Error(
            `Invalid chunk parameters: chunkSize=${chunkSize}, overlap=${overlap}. overlap must be < chunkSize.`,
        )
    }
    const chunks: string[] = []
    let start = 0
    while (start < text.length) {
        chunks.push(text.slice(start, start + chunkSize))
        start += chunkSize - overlap
    }
    return chunks
}

/**
 * Normalises PDF text while preserving paragraph structure for RAG quality.
 * Collapses inline whitespace (spaces/tabs) but keeps single/double newlines intact.
 */
function normaliseText(raw: string): string {
    return raw
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
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
        const parser = new PDFParse({ data: new Uint8Array(buffer) })
        const { text } = await parser.getText()
        const cleanText = normaliseText(text)

        const chunks = chunkText(cleanText, this.chunkSize, this.chunkOverlap)
        if (chunks.length === 0) {
            return { documentId: uuidv4(), filename }
        }

        const documentId = uuidv4()
        const embeddings = await this.ai.embedMany(chunks) // batched internally
        const metadatas = chunks.map((_, i) => ({ documentId, chunkIndex: i, filename }))

        await this.vectorStore.addChunks({ embeddings, documents: chunks, metadatas })

        this.logger.log(`Ingested "${filename}" → ${chunks.length} chunks (documentId: ${documentId})`)

        return { documentId, filename }
    }
}
