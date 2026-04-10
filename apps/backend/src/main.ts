import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)
    const logger = new Logger('Bootstrap')

    app.setGlobalPrefix('api')

    // Enables graceful shutdown — NestJS flushes in-flight requests and fires
    // OnModuleDestroy hooks before the process exits on SIGTERM / SIGINT.
    app.enableShutdownHooks()

    // NOTE: NestFactory.create() runs before ConfigModule initialises, so
    // ConfigService is not yet available here. Reading process.env directly
    // is intentional. The default matches env.validation.ts's FRONTEND_URL default.
    app.enableCors({
        origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })

    const port = process.env.PORT ?? 3001
    await app.listen(port)
    logger.log(`Backend running on http://localhost:${port}/api`)
}

bootstrap()
