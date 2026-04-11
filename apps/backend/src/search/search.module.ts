import { Module } from '@nestjs/common'
import { AIModule } from '../ai/ai.module'
import { TavilyService } from './tavily.service'
import { SearchService } from './search.service'

@Module({
    imports: [AIModule],
    providers: [TavilyService, SearchService],
    exports: [SearchService],
})
export class SearchModule {}
