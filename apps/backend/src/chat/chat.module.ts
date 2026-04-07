import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { UploadController } from './upload.controller'
import { ChatService } from './chat.service'
import { SearchModule } from '../search/search.module'

@Module({
    imports: [SearchModule],
    controllers: [ChatController, UploadController],
    providers: [ChatService],
})
export class ChatModule {}
