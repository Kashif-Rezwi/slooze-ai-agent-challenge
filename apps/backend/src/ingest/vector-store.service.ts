import { Injectable } from '@nestjs/common'

interface StoredChunk {
    embedding: number[]
    document: string
    documentId: string
    chunkIndex: number
}

export interface AddChunksArgs {
    embeddings: number[][]
    documents: string[]
    metadatas: Array<{ documentId: string; chunkIndex: number }>
}

export interface QueryChunksArgs {
    embedding: number[]
    nResults: number
    documentId: string
}

export interface QueryChunksResult {
    documents: string[]
    metadatas: Array<{ documentId: string; chunkIndex: number }>
}

/** Dot product of two equal-length vectors. */
function dot(a: number[], b: number[]): number {
    let sum = 0
    for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
    return sum
}

/** L2 magnitude of a vector. */
function magnitude(a: number[]): number {
    return Math.sqrt(dot(a, a))
}

/** Cosine similarity in [-1, 1]. Higher = more similar. */
function cosineSimilarity(a: number[], b: number[]): number {
    const denom = magnitude(a) * magnitude(b)
    return denom === 0 ? 0 : dot(a, b) / denom
}

/**
 * Zero-dependency in-memory vector store.
 *
 * Stores all chunks in a flat array and performs brute-force cosine similarity
 * at query time. Suitable for take-home demo scale (hundreds of chunks).
 * For production, swap this service for a persistent vector DB (ChromaDB, Pinecone, etc.)
 * without touching any other file — IngestService and RagService depend only on this interface.
 */
@Injectable()
export class VectorStoreService {
    private readonly chunks: StoredChunk[] = []

    addChunks({ embeddings, documents, metadatas }: AddChunksArgs): void {
        for (let i = 0; i < embeddings.length; i++) {
            this.chunks.push({
                embedding: embeddings[i],
                document: documents[i],
                documentId: metadatas[i].documentId,
                chunkIndex: metadatas[i].chunkIndex,
            })
        }
    }

    queryChunks({ embedding, nResults, documentId }: QueryChunksArgs): QueryChunksResult {
        const scored = this.chunks
            .filter(c => c.documentId === documentId)
            .map(c => ({ chunk: c, score: cosineSimilarity(embedding, c.embedding) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, nResults)

        return {
            documents: scored.map(s => s.chunk.document),
            metadatas: scored.map(s => ({
                documentId: s.chunk.documentId,
                chunkIndex: s.chunk.chunkIndex,
            })),
        }
    }
}
