import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD, APP_FILTER } from '@nestjs/core'
import { validateEnv } from './env.validation'
import { ChatModule } from './chat/chat.module'
import { GlobalExceptionFilter } from './common/filters/http-exception.filter'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
        }),
        // 20 requests per 60 seconds globally across all routes.
        // ttl is in milliseconds in @nestjs/throttler v6.
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
        ChatModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        // Registered via APP_FILTER token so NestJS DI manages it — allows
        // future injection of ConfigService or other providers into the filter.
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
    ],
})
export class AppModule {}
