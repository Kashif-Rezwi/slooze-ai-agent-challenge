import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Env } from '../env.validation'

export interface TavilyResult {
    title: string
    url: string
    snippet: string
}

interface TavilyApiResponse {
    results: Array<{
        title: string
        url: string
        content: string
    }>
}

interface TavilyErrorBody {
    message?: string
    error?: string
}

/** Abort fetch after this many milliseconds to prevent indefinite SSE hangs. */
const FETCH_TIMEOUT_MS = 10_000

@Injectable()
export class TavilyService {
    private readonly apiKey: string
    private readonly maxResults: number

    constructor(private readonly config: ConfigService<Env, true>) {
        this.apiKey = this.config.get('TAVILY_API_KEY')
        this.maxResults = this.config.get('TOP_K_RESULTS')
    }

    async search(query: string): Promise<TavilyResult[]> {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

        let response: Response
        try {
            response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: this.apiKey,
                    query,
                    max_results: this.maxResults,
                    search_depth: 'basic',
                }),
                signal: controller.signal,
            })
        } catch (err) {
            const isTimeout = err instanceof Error && err.name === 'AbortError'
            throw new ServiceUnavailableException(
                isTimeout
                    ? 'Web search timed out. Please try again.'
                    : 'Web search is currently unavailable. Please try again later.',
            )
        } finally {
            clearTimeout(timer)
        }

        if (!response.ok) {
            // Read Tavily's error body for a specific diagnostic message
            // (e.g. "Invalid API key" on 401, rate-limit detail on 429).
            let detail = ''
            try {
                const body = (await response.json()) as TavilyErrorBody
                detail = body.message ?? body.error ?? ''
            } catch { /* ignore parse errors — body may not be JSON */ }

            throw new ServiceUnavailableException(
                `Web search returned an error (${response.status})${detail ? `: ${detail}` : '. Please try again later.'}`,
            )
        }

        const data = (await response.json()) as TavilyApiResponse

        return (data.results ?? []).map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.content,
        }))
    }
}
