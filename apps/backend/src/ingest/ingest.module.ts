import { Module } from '@nestjs/common'
import { AIModule } from '../ai/ai.module'
import { VectorStoreService } from './vector-store.service'
import { IngestService } from './ingest.service'
import { UploadController } from './upload.controller'

@Module({
    imports: [AIModule],
    controllers: [UploadController],
    providers: [VectorStoreService, IngestService],
    exports: [VectorStoreService, IngestService],
})
export class IngestModule {}
