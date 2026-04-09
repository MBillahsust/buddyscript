import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import compression from 'compression';

import { validateEnv, env } from './config/environment';
import { initializeDatabase, closeDatabase } from '@config/db';
import { connectRedis, redisClient } from '@config/redis';
import { requestLogger } from '@middlewares/requestLogger';
import { errorHandler } from '@middlewares/errorHandler';
import { logger } from '@config/logger';
import { AppError } from '@utils/errors';
import { globalLimiter, initializeRateLimiters } from '@middlewares/rateLimiter';
import routes from '@routes/index';

validateEnv();

const app = express();

// SECURITY MIDDLEWARE
app.use(helmet());
app.use(cors({
  origin: env.allowedOrigins,
  credentials: true,
}));


// RATE LIMITING
app.use(globalLimiter);

// BODY PARSING & COOKIES
app.use(cookieParser());
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// HTTP PARAMETER POLLUTION
app.use(hpp());

// COMPRESSION & LOGGING
app.use(compression());
app.use(requestLogger);

// ROUTES
app.use('/api/v1', routes);

// HEALTH CHECK
app.get('/health', (_req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatus = dbStates[mongoose.connection.readyState] ?? 'unknown';
  const redisStatus = redisClient.status;
  const healthy = dbStatus === 'connected' && redisStatus === 'ready';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbStatus,
    redis: redisStatus,
    environment: env.nodeEnv,
    version: process.env.npm_package_version ?? '1.0.0',
  });
});

// 404 HANDLER — must come after all routes
app.use((_req, _res, next) => {
  next(AppError.notFound('The requested endpoint does not exist'));
});

// GLOBAL ERROR HANDLER — must be last
app.use(errorHandler);

// GRACEFUL SHUTDOWN
let server: ReturnType<typeof app.listen>;

const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server?.close(async () => {
    await closeDatabase();
    logger.info('MongoDB connection closed');
    await redisClient.quit();
    logger.info('Redis connection closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// PROCESS ERROR SAFETY NET
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection', { reason });
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception — shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

// SERVER BOOTSTRAP
export async function startServer() {
  try {
    await initializeDatabase();
    await connectRedis();
    initializeRateLimiters();
    // startCleanupJob();

    server = app.listen(env.port, () =>
      logger.info(`Server running on http://localhost:${env.port} [${env.nodeEnv}]`)
    );

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${env.port} is already in use. Stop the other process or set a different PORT in .env`);
      } else {
        logger.error('Server error', { error: err.message });
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

export default app;
