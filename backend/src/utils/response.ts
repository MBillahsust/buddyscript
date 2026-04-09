import { Response } from 'express';

/**
 * Unified success response wrapper.
 * Error responses are handled centrally by errorHandler middleware.
 *
 * Shape: { success: true, message?: string, data: T }
 */
export const successResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
): void => {
  res.status(statusCode).json({
    success: true,
    ...(message !== undefined ? { message } : {}),
    data,
  });
};
