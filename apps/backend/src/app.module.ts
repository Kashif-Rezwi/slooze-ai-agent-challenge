import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD, APP_FILTER } from '@nestjs/core'
import { validateEnv } from './env.validation'
import { ChatModule } from './chat/chat.module'
import { GlobalExceptionFilter } from './common/filters/http-exception.filter'

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]), // 20 req / 60 s globally
        ChatModule,
    ],
    providers: [
        { provide: APP_GUARD,  useClass: ThrottlerGuard },
        { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    ],
})
export class AppModule {}
