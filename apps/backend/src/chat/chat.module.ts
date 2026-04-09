import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { UploadController } from './upload.controller'
import { ChatService } from './chat.service'
import { SearchModule } from '../search/search.module'
import { RagModule } from '../rag/rag.module'
import { IngestModule } from '../ingest/ingest.module'

@Module({
    imports: [SearchModule, RagModule, IngestModule],
    controllers: [ChatController, UploadController],
    providers: [ChatService],
})
export class ChatModule {}
