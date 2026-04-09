import { redis } from "@/lib/redis"

const FEED_CACHE_TTL_SECONDS = 30

function feedCacheKey(userId: string, cursor?: string) {
  return `feed:user:${userId}:cursor:${cursor ?? "first"}`
}

export async function getCachedFeedPage<T>(userId: string, cursor?: string): Promise<T | null> {
  if (!redis) return null

  const key = feedCacheKey(userId, cursor)
  let raw: string | null = null
  try {
    raw = await redis.get(key)
  } catch {
    return null
  }
  if (!raw) return null

  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setCachedFeedPage<T>(userId: string, cursor: string | undefined, payload: T) {
  if (!redis) return

  const key = feedCacheKey(userId, cursor)
  try {
    await redis.set(key, JSON.stringify(payload), "EX", FEED_CACHE_TTL_SECONDS)
  } catch {
    // Ignore cache set failures.
  }
}

async function deleteByPattern(pattern: string) {
  if (!redis) return

  let cursor = "0"
  try {
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100)
      cursor = nextCursor
      if (keys.length) {
        await redis.del(...keys)
      }
    } while (cursor !== "0")
  } catch {
    // Ignore cache invalidation failures.
  }
}

export async function invalidateUserFeedCache(userId: string) {
  await deleteByPattern(`feed:user:${userId}:cursor:*`)
}

export async function invalidateUsersFeedCache(userIds: Array<string | null | undefined>) {
  const uniqueIds = [...new Set(userIds.filter((id): id is string => Boolean(id)))]
  await Promise.all(uniqueIds.map((id) => invalidateUserFeedCache(id)))
}
