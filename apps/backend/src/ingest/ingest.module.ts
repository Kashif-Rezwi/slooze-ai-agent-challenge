import { Module } from '@nestjs/common'
import { AIModule } from '../ai/ai.module'
import { VectorStoreService } from './vector-store.service'
import { IngestService } from './ingest.service'

@Module({
    imports: [AIModule],
    providers: [VectorStoreService, IngestService],
    exports: [VectorStoreService, IngestService],
})
export class IngestModule {}
