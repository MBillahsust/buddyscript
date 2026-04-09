import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/errors';
import { logger } from '@config/logger';
import { env } from '@config/environment';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isAppError = err instanceof AppError;

  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = isAppError ? err.message : 'Something went wrong';

  // logging with context
  logger[isAppError ? 'warn' : 'error']('Error', {
    code,
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    statusCode,
    stack: env.nodeEnv === 'development' ? err.stack : undefined,
  });

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(isAppError && err.details ? { details: err.details } : {}),
    }
  });
}