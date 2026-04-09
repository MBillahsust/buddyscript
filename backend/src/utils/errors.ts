export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown[]
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown[]) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message: string) {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message: string) {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message: string) {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message);
  }
}