import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)
    const logger = new Logger('Bootstrap')

    app.setGlobalPrefix('api')
    app.enableShutdownHooks()

    // ConfigService is not yet available at this point — process.env is intentional.
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
