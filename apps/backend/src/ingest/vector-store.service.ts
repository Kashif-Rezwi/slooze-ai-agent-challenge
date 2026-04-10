import { Injectable, OnModuleInit, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CloudClient } from 'chromadb'
import type { Collection, EmbeddingFunction } from 'chromadb'
import { Env } from '../env.validation'

export interface AddChunksArgs {
    embeddings: number[][]
    documents: string[]
    metadatas: Array<{ documentId: string; chunkIndex: number; filename: string }>
}

export interface QueryChunksArgs {
    embedding: number[]
    nResults: number
    documentId: string
}

export interface QueryChunksResult {
    documents: string[]
    metadatas: Array<{ documentId: string; chunkIndex: number; filename: string }>
}

const COLLECTION_NAME = 'slooze_documents'

// Typed no-op stub — we always supply pre-computed embeddings; ChromaDB never calls this.
const noopEmbeddingFunction: EmbeddingFunction = {
    generate: (_texts: string[]): Promise<number[][]> => Promise.resolve([]),
}

/**
 * ChromaDB Cloud vector store (v3 CloudClient, no local server).
 * Credentials: CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE — see trychroma.com dashboard.
 * A failed connection does not crash the app — only PDF RAG routes return 503.
 */
@Injectable()
export class VectorStoreService implements OnModuleInit {
    private readonly logger = new Logger(VectorStoreService.name)
    private collection: Collection | null = null

    constructor(private readonly config: ConfigService<Env, true>) {}

    async onModuleInit() {
        try {
            const apiKey   = this.config.get('CHROMA_API_KEY')
            const tenant   = this.config.get('CHROMA_TENANT')
            const database = this.config.get('CHROMA_DATABASE')

            if (!apiKey || !tenant || !database) {
                this.logger.warn(
                    'ChromaDB credentials not set — PDF RAG is unavailable. ' +
                    'Set CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE to enable it.',
                )
                return
            }

            const client = new CloudClient({ apiKey, tenant, database })

            this.collection = await client.getOrCreateCollection({
                name: COLLECTION_NAME,
                embeddingFunction: noopEmbeddingFunction,
            })

            this.logger.log(
                `ChromaDB connected | tenant: ${tenant} | db: ${database} | collection "${COLLECTION_NAME}" ready`,
            )
        } catch (err) {
            this.logger.error(
                `ChromaDB connection failed: ${err instanceof Error ? err.message : String(err)}`,
            )
            this.logger.warn('PDF RAG is unavailable. Check CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE.')
        }
    }

    /** Throws 503 if ChromaDB is not connected. */
    private assertConnected(): Collection {
        if (!this.collection) {
            throw new ServiceUnavailableException(
                'Vector store is not connected. Check CHROMA_API_KEY, CHROMA_TENANT, and CHROMA_DATABASE.',
            )
        }
        return this.collection
    }

    /** Upsert is idempotent — safe to retry on partial failure. */
    async addChunks({ embeddings, documents, metadatas }: AddChunksArgs): Promise<void> {
        const collection = this.assertConnected()
        const ids = metadatas.map((m, i) => `${m.documentId}_${i}`)
        await collection.upsert({ ids, embeddings, documents, metadatas })
    }

    async queryChunks({ embedding, nResults, documentId }: QueryChunksArgs): Promise<QueryChunksResult> {
        const collection = this.assertConnected()

        let results
        try {
            results = await collection.query({
                queryEmbeddings: [embedding],
                nResults,
                where: { documentId: { $eq: documentId } },
            })
        } catch (err) {
            // ChromaDB throws when nResults exceeds the indexed count for this document.
            this.logger.warn(
                `ChromaDB query failed (nResults=${nResults}, doc="${documentId}"): ` +
                `${err instanceof Error ? err.message : String(err)}`,
            )
            return { documents: [], metadatas: [] }
        }

        const rawDocs  = results.documents[0] ?? []
        const rawMetas = results.metadatas[0]  ?? []

        const documents: string[] = []
        const metas: QueryChunksResult['metadatas'] = []

        for (let i = 0; i < rawDocs.length; i++) {
            const doc  = rawDocs[i]
            const meta = rawMetas[i]
            if (doc == null || meta == null) continue
            documents.push(doc)
            metas.push({
                documentId: String(meta['documentId']),
                chunkIndex: Number(meta['chunkIndex']),
                filename:   String(meta['filename']),
            })
        }

        return { documents, metadatas: metas }
    }
}
