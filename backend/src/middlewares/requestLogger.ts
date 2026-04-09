import { Request, Response, NextFunction } from 'express';
import { logger } from '@config/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint(); // precise timing

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '-';

    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${durationMs.toFixed(2)}ms`,
      ip,
      userAgent: req.headers['user-agent'] || '-',
    });
  });

  next();
}