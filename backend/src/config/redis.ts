import { Redis } from 'ioredis';
import { env } from './environment';
import { logger } from './logger';

const redisClient = new Redis(env.redis.url, {
  lazyConnect: true,          // We connect explicitly via connectRedis()
  enableOfflineQueue: false,
  retryStrategy: (times: number) => {
    if (times > 5) {
      logger.error('[Redis] Max reconnect attempts reached — giving up');
      return null;
    }
    const delay = Math.min(200 * 2 ** (times - 1), 10_000);
    logger.warn(`[Redis] Reconnect attempt ${times} in ${delay}ms`);
    return delay;
  },
  tls: env.redis.url.startsWith('rediss://') ? {} : undefined,
});

redisClient.on('error', (err) =>
  logger.error('[Redis] Runtime error', { error: err.message })
);
redisClient.on('close', () => logger.warn('[Redis] Connection closed'));
redisClient.on('reconnecting', () => logger.info('[Redis] Reconnecting…'));

/**
 * Explicitly connect to Redis. Must be called in startServer()
 * before rate limiters are initialized.
 *
 * Throws in production so the server never starts with a degraded rate limiter.
 */
export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
    logger.info('[Redis] Connected successfully');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (env.nodeEnv === 'production') {
      logger.error('[Redis] Failed to connect — aborting startup', { error: msg });
      throw err;
    } else {
      logger.warn('[Redis] Failed to connect — rate limiters will use in-memory store', { error: msg });
    }
  }
}

export { redisClient };
