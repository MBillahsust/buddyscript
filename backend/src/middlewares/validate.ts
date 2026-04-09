import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '@utils/errors';

export const validate = (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map(issue => ({
        field:   issue.path.join('.'),
        message: issue.message,
      }));
      return next(AppError.badRequest('Validation failed', details));
    }
    req.body = result.data;
    next();
  };
