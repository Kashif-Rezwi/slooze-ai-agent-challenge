import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { UploadController } from './upload.controller'
import { ChatService } from './chat.service'
import { AIModule } from '../ai/ai.module'

@Module({
    imports: [AIModule],
    controllers: [ChatController, UploadController],
    providers: [ChatService],
})
export class ChatModule {}
