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

/**
 * Splits plain text into overlapping fixed-size character-based chunks.
 *
 * Guards against misconfigured parameters defensively — even though
 * env.validation.ts enforces CHUNK_OVERLAP < CHUNK_SIZE at startup, this
 * function is self-defending so it cannot loop infinitely if called directly
 * (e.g. in tests) with bad values.
 *
 * Returns an empty array if the text is blank.
 */
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
 * Normalises extracted PDF text while preserving paragraph structure.
 *
 * Raw pdf-parse output contains meaningful newlines (paragraph / section breaks)
 * that are valuable context signals for the LLM. Collapsing everything to a
 * single space (the previous approach) made chunks harder to parse.
 *
 * Strategy:
 *   - Collapse runs of spaces/tabs within a line → single space
 *   - Reduce 3+ consecutive newlines → paragraph break (\n\n)
 *   - Leave single and double newlines intact (sentence / paragraph boundaries)
 */
function normaliseText(raw: string): string {
    return raw
        .replace(/[ \t]+/g, ' ')       // collapse inline whitespace
        .replace(/\n{3,}/g, '\n\n')    // cap runs of blank lines at one paragraph break
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
        // 1. Parse PDF → plain text using pdf-parse v2 class API
        const parser = new PDFParse({ data: new Uint8Array(buffer) })
        const { text } = await parser.getText()
        const cleanText = normaliseText(text)

        // 2. Chunk
        const chunks = chunkText(cleanText, this.chunkSize, this.chunkOverlap)
        if (chunks.length === 0) {
            return { documentId: uuidv4(), filename }
        }

        const documentId = uuidv4()

        // 3. Embed all chunks — batched internally by AIService to stay within
        //    OpenAI's per-request limits (see AIService.embedMany).
        const embeddings = await this.ai.embedMany(chunks)

        // 4. Store in ChromaDB with documentId + chunkIndex metadata
        const metadatas = chunks.map((_, i) => ({ documentId, chunkIndex: i, filename }))

        await this.vectorStore.addChunks({ embeddings, documents: chunks, metadatas })

        this.logger.log(`Ingested "${filename}" → ${chunks.length} chunks (documentId: ${documentId})`)

        return { documentId, filename }
    }
}
