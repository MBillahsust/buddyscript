/**
 * Rate Limiter Middleware
 *
 * All limiters are Redis-backed, sharing counters across processes & restarts.
 * initializeRateLimiters() MUST be called in startServer() after connectRedis()
 * resolves to ensure Redis is ready before any store is built.
 *
 */

import { RequestHandler } from 'express';
import {rateLimit, RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '@config/redis';
import { logger } from '@config/logger';
import {
  RATE_LIMIT_WINDOWS,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_MESSAGES,
  RATE_LIMIT_ERROR_CODE,
} from '@constants/rateLimiter';

interface Limiters {
  global:   RateLimitRequestHandler;
  strict:   RateLimitRequestHandler;
  register: RateLimitRequestHandler;
  token:    RateLimitRequestHandler;
}

const buildLimiter = (windowMs: number, max: number, message: string, prefix: string): RateLimitRequestHandler =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, error: { code: RATE_LIMIT_ERROR_CODE, message } },
    store: new RedisStore({
      sendCommand: (...args: string[]) =>
        (redisClient as unknown as { call: (...args: string[]) => Promise<number> }).call(...args),
      prefix: `${prefix}:`,
    }),
    standardHeaders: true,
    legacyHeaders: false,
  });

let _limiters: Limiters | null = null;

// ─── Initialization ───────────────────────────────────────────────────────

export function initializeRateLimiters(): void {
  logger.info(`[RateLimiter] Initializing — store: ${redisClient.status === 'ready' ? 'Redis' : 'memory'}`);

  _limiters = {
    global:   buildLimiter(RATE_LIMIT_WINDOWS.FIFTEEN_MINUTES, RATE_LIMIT_MAX_REQUESTS.GLOBAL,   RATE_LIMIT_MESSAGES.GENERIC,  'global'),
    strict:   buildLimiter(RATE_LIMIT_WINDOWS.FIFTEEN_MINUTES, RATE_LIMIT_MAX_REQUESTS.STRICT,   RATE_LIMIT_MESSAGES.STRICT,   'strict'),
    register: buildLimiter(RATE_LIMIT_WINDOWS.ONE_HOUR,        RATE_LIMIT_MAX_REQUESTS.REGISTER, RATE_LIMIT_MESSAGES.REGISTER, 'register'),
    token:    buildLimiter(RATE_LIMIT_WINDOWS.ONE_HOUR,        RATE_LIMIT_MAX_REQUESTS.TOKEN,    RATE_LIMIT_MESSAGES.TOKEN,    'token'),
  };

  logger.info('[RateLimiter] All limiters initialized');
}

// ─── Guard ────────────────────────────────────────────────────────────────

const getLimiter = (key: keyof Limiters): RateLimitRequestHandler => {
  if (!_limiters) throw new Error('[RateLimiter] Not initialized. Call initializeRateLimiters() first.');
  return _limiters[key];
};

// ─── Exported Middleware ───────────────────────────────────────────────────

export const globalLimiter:   RequestHandler = (req, res, next) => getLimiter('global')(req, res, next);
export const strictLimiter:   RequestHandler = (req, res, next) => getLimiter('strict')(req, res, next);
export const registerLimiter: RequestHandler = (req, res, next) => getLimiter('register')(req, res, next);
export const tokenLimiter:    RequestHandler = (req, res, next) => getLimiter('token')(req, res, next);
