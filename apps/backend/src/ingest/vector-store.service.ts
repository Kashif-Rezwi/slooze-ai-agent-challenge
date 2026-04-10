import { Injectable, OnModuleInit, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CloudClient } from 'chromadb'
import type { Collection } from 'chromadb'
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

/** All documents share one collection, filtered by documentId at query time. */
const COLLECTION_NAME = 'slooze_documents'

/**
 * ChromaDB Cloud vector store.
 *
 * Uses the v3 CloudClient — a dedicated class for https://api.trychroma.com.
 * No local server needed. Embeddings are persisted in the cloud and survive
 * server restarts.
 *
 * Get your credentials free at https://trychroma.com → Dashboard → API Keys:
 *   CHROMA_API_KEY  — from Settings → API Keys
 *   CHROMA_TENANT   — your tenant ID (shown on the dashboard home)
 *   CHROMA_DATABASE — your database name (default: "default_database")
 *
 * IMPORTANT: A failed connection does NOT crash the app — web search (Challenge A)
 * is unaffected. PDF routes return 503 with a clear message until ChromaDB
 * credentials are fixed.
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

            // CloudClient wires host (api.trychroma.com), port 443, ssl, and
            // the x-chroma-token auth header automatically.
            const client = new CloudClient({ apiKey, tenant, database })

            this.collection = await client.getOrCreateCollection({
                name: COLLECTION_NAME,
                // Suppress the DefaultEmbeddingFunction warning — we always
                // pass pre-computed embeddings so no embedding function is needed.
                embeddingFunction: null as never,
            })

            this.logger.log(
                `ChromaDB Cloud connected | tenant: ${tenant} | db: ${database} | collection "${COLLECTION_NAME}" ready`,
            )
        } catch (err) {
            // Log clearly but do NOT rethrow — a misconfigured vector store must
            // not take down web search (Challenge A), which is independent.
            this.logger.error(
                `ChromaDB Cloud connection failed: ${err instanceof Error ? err.message : String(err)}`,
            )
            this.logger.warn(
                'PDF RAG (Challenge B) is unavailable. Check CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE.',
            )
        }
    }

    /** Throws 503 if ChromaDB is not connected — surfaces a clear user-facing message. */
    private assertConnected(): Collection {
        if (!this.collection) {
            throw new ServiceUnavailableException(
                'Vector store is not connected. Check your CHROMA_API_KEY, CHROMA_TENANT, and CHROMA_DATABASE environment variables.',
            )
        }
        return this.collection
    }

    async addChunks({ embeddings, documents, metadatas }: AddChunksArgs): Promise<void> {
        const collection = this.assertConnected()
        const ids = metadatas.map((m, i) => `${m.documentId}_${i}`)
        await collection.add({ ids, embeddings, documents, metadatas })
    }

    async queryChunks({ embedding, nResults, documentId }: QueryChunksArgs): Promise<QueryChunksResult> {
        const collection = this.assertConnected()

        let results
        try {
            results = await collection.query({
                queryEmbeddings: [embedding],
                nResults,
                // Scope results to this document only.
                where: { documentId: { $eq: documentId } },
            })
        } catch {
            // ChromaDB throws when nResults > number of indexed vectors for the
            // given document. Return empty so the caller surfaces a graceful message.
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
