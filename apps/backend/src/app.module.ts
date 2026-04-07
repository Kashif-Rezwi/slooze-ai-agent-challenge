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
        // 20 requests per 60 seconds globally across all routes.
        // ttl is in milliseconds in @nestjs/throttler v6.
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
