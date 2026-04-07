import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AIModule } from '../ai/ai.module'
import { TavilyService } from './tavily.service'
import { SearchService } from './search.service'

@Module({
    imports: [ConfigModule, AIModule],
    providers: [TavilyService, SearchService],
    exports: [SearchService],
})
export class SearchModule {}
