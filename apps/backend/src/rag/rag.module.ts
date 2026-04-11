import { Module } from '@nestjs/common'
import { AIModule } from '../ai/ai.module'
import { IngestModule } from '../ingest/ingest.module'
import { RagService } from './rag.service'

@Module({
    imports: [AIModule, IngestModule],
    providers: [RagService],
    exports: [RagService],
})
export class RagModule {}
