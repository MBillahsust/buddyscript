/**
 * Upload Routes
 *
 * POST /upload/sign — generate Cloudinary signed upload parameters
 */
import { Router } from 'express';
import { protect } from '@middlewares/auth';
import { UploadController } from '@controllers/uploadController';

export const uploadRouter = Router();

uploadRouter.post('/sign', protect(), UploadController.sign);
