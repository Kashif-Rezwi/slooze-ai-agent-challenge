import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { validateEnv } from './env.validation'
import { AIModule } from './ai/ai.module'
import { ChatModule } from './chat/chat.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
        }),
        // 20 requests per minute globally across all routes
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
        AIModule,
        ChatModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}
