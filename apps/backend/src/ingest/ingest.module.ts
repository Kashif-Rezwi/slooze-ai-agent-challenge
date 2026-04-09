import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AIModule } from '../ai/ai.module'
import { VectorStoreService } from './vector-store.service'
import { IngestService } from './ingest.service'

@Module({
    imports: [ConfigModule, AIModule],
    providers: [VectorStoreService, IngestService],
    exports: [VectorStoreService, IngestService],
})
export class IngestModule {}
