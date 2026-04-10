import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import multer from 'multer'
import { IngestService } from '../ingest/ingest.service'

@Controller('upload')
export class UploadController {
    constructor(private readonly ingestService: IngestService) {}

    /**
     * POST /api/upload
     * Accepts a PDF file (multipart/form-data, field name "file").
     * Parses, chunks, embeds, and stores it in the ChromaDB Cloud vector store.
     * Returns { documentId, filename } on success.
     *
     * Constraints (enforced by Multer):
     *   - MIME type: application/pdf only
     *   - Max size: 20 MB
     */
    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: multer.memoryStorage(),
            limits: { fileSize: 20 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                if (file.mimetype !== 'application/pdf') {
                    cb(new BadRequestException('Only PDF files are accepted'), false)
                } else {
                    cb(null, true)
                }
            },
        }),
    )
    async upload(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded')
        }

        return this.ingestService.ingest(file.buffer, file.originalname)
    }
}
