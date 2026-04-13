import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import multer from 'multer'
import { IngestService } from './ingest.service'

@Controller('upload')
export class UploadController {
    constructor(private readonly ingestService: IngestService) {}

    /**
     * POST /api/upload — accepts a PDF (field: "file", max 20 MB).
     * Returns { documentId, filename } on success.
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
        // Catches both missing-file and Multer MIME-rejection (fileFilter error isn't always propagated).
        if (!file) {
            throw new BadRequestException(
                'No valid PDF file received. Ensure the field name is "file" and the file is a valid PDF (application/pdf).',
            )
        }

        return this.ingestService.ingest(file.buffer, file.originalname)
    }
}
