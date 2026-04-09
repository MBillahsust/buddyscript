import type { NextRequest } from "next/server"
import { redis } from "@/lib/redis"

type RateLimitConfig = {
  windowMs: number
  max: number
}

type Bucket = {
  count: number
  resetAt: number
}

type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
}

const globalForRateLimit = globalThis as unknown as {
  __rateLimitBuckets?: Map<string, Bucket>
}

const buckets = globalForRateLimit.__rateLimitBuckets ?? new Map<string, Bucket>()
if (!globalForRateLimit.__rateLimitBuckets) {
  globalForRateLimit.__rateLimitBuckets = buckets
}

function now() {
  return Date.now()
}

function cleanupExpiredBuckets(currentTime: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= currentTime) {
      buckets.delete(key)
    }
  }
}

export function getClientIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    return xff.split(",")[0].trim()
  }

  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()

  const cfIp = req.headers.get("cf-connecting-ip")
  if (cfIp) return cfIp.trim()

  return "unknown"
}

export async function hitRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  if (redis) {
    try {
      const storageKey = `rate:${key}`
      const count = await redis.incr(storageKey)

      if (count === 1) {
        await redis.pexpire(storageKey, config.windowMs)
      }

      const ttlMs = await redis.pttl(storageKey)
      const retryAfterSeconds = Math.max(Math.ceil((ttlMs > 0 ? ttlMs : config.windowMs) / 1000), 1)

      if (count > config.max) {
        return {
          allowed: false,
          limit: config.max,
          remaining: 0,
          retryAfterSeconds,
        }
      }

      return {
        allowed: true,
        limit: config.max,
        remaining: Math.max(config.max - count, 0),
        retryAfterSeconds,
      }
    } catch {
      // Redis unavailable: fallback to local in-memory limiter.
    }
  }

  const currentTime = now()
  cleanupExpiredBuckets(currentTime)

  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= currentTime) {
    buckets.set(key, { count: 1, resetAt: currentTime + config.windowMs })
    return {
      allowed: true,
      limit: config.max,
      remaining: Math.max(config.max - 1, 0),
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    }
  }

  if (existing.count >= config.max) {
    return {
      allowed: false,
      limit: config.max,
      remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil((existing.resetAt - currentTime) / 1000), 1),
    }
  }

  existing.count += 1
  buckets.set(key, existing)

  return {
    allowed: true,
    limit: config.max,
    remaining: Math.max(config.max - existing.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((existing.resetAt - currentTime) / 1000), 1),
  }
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "Retry-After": String(result.retryAfterSeconds),
  }
}

export const RATE_LIMITS = {
  authSignupIp: { windowMs: 15 * 60 * 1000, max: 10 },
  authSignupEmail: { windowMs: 15 * 60 * 1000, max: 5 },
  uploadSignature: { windowMs: 60 * 1000, max: 20 },
  createPost: { windowMs: 60 * 1000, max: 20 },
  createComment: { windowMs: 60 * 1000, max: 60 },
  createReply: { windowMs: 60 * 1000, max: 60 },
  toggleLike: { windowMs: 60 * 1000, max: 120 },
  readFeed: { windowMs: 60 * 1000, max: 120 },
} as const
