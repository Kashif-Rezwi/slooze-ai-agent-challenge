import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    app.setGlobalPrefix('api')

    // NOTE: NestFactory.create() runs before ConfigModule initialises, so
    // ConfigService is not yet available here. Reading process.env directly
    // is intentional. The default matches env.validation.ts's FRONTEND_URL default.
    app.enableCors({
        origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })

    app.useGlobalFilters(new GlobalExceptionFilter())

    const port = process.env.PORT ?? 3001
    await app.listen(port)
    console.log(`Backend running on http://localhost:${port}/api`)
}

bootstrap()

