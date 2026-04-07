import {
    Controller,
    Post,
    Res,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import multer from 'multer'
import { Response } from 'express'

@Controller('upload')
export class UploadController {
    /**
     * POST /api/upload
     * Accepts a PDF file (multipart/form-data, field name "file").
     * IngestService wired in Phase 5. For now returns a stub 200.
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
                    // FileFilterCallback overloads: cb(error) OR cb(null, accept)
                    cb(new BadRequestException('Only PDF files are accepted'), false)
                } else {
                    cb(null, true)
                }
            },
        }),
    )
    upload(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
        if (!file) {
            throw new BadRequestException('No file uploaded')
        }
        // Phase 5: delegate to IngestService → return { documentId, filename }
        res.json({ message: 'stub — Phase 5 coming', filename: file.originalname })
    }
}
