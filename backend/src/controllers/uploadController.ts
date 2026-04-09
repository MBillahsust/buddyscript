import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middlewares/auth';
import { UploadService } from '@services/uploadService';
import { successResponse } from '@utils/response';

/** POST /api/v1/upload/sign — returns signed params for a direct Cloudinary upload */
const sign = (_req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const params = UploadService.generateSignature();
    successResponse(res, params);
  } catch (error) {
    next(error);
  }
};

export const UploadController = { sign };
