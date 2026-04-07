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

@Injectable()
export class TavilyService {
    private readonly apiKey: string

    constructor(private readonly config: ConfigService<Env, true>) {
        this.apiKey = this.config.get('TAVILY_API_KEY')
    }

    async search(query: string): Promise<TavilyResult[]> {
        let response: Response
        try {
            response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: this.apiKey,
                    query,
                    max_results: 5,
                    search_depth: 'basic',
                }),
            })
        } catch {
            throw new ServiceUnavailableException(
                'Web search is currently unavailable. Please try again later.'
            )
        }

        if (!response.ok) {
            throw new ServiceUnavailableException(
                `Web search returned an error (${response.status}). Please try again later.`
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
