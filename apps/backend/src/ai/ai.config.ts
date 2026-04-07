export const AI_CONFIG = {
    chatModel: 'gpt-4o-mini',
    embeddingModel: 'text-embedding-3-small',
    maxOutputTokens: 1024,
    systemPrompts: {
        webSearch: `You are a helpful assistant that answers questions using web search results.
Be concise and factual. Always ground your answer in the provided sources.
If the sources do not contain enough information, say so.`,
        rag: `You are a helpful assistant that answers questions about a provided document.
Answer only based on the context provided. If the answer is not in the document, say so clearly.
Do not speculate beyond what the document states.`,
    },
} as const
