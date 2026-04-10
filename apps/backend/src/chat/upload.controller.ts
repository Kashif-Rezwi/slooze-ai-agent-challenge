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

/**
 * Strips characters that are unsafe in filenames and caps length at 255 bytes.
 * Keeps alphanumerics, spaces, dots, hyphens, and underscores.
 * Falls back to 'upload.pdf' if the result is empty after stripping.
 */
function sanitiseFilename(name: string): string {
    return (
        name
            .replace(/[^a-zA-Z0-9 ._-]/g, '_')
            .slice(0, 255)
            .trim() || 'upload.pdf'
    )
}

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
        // `file` is undefined when no file was sent OR when Multer's fileFilter
        // rejected it (e.g. wrong MIME type). Both cases are handled here since
        // the fileFilter error is not always propagated by the FileInterceptor.
        if (!file) {
            throw new BadRequestException(
                'No valid PDF file received. Ensure the field name is "file" and the file is a valid PDF (application/pdf).',
            )
        }

        const filename = sanitiseFilename(file.originalname)
        return this.ingestService.ingest(file.buffer, filename)
    }
}
