import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { SearchModule } from '../search/search.module'
import { RagModule } from '../rag/rag.module'

@Module({
    imports: [SearchModule, RagModule],
    controllers: [ChatController],
    providers: [ChatService],
})
export class ChatModule {}
