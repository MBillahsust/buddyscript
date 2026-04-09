import Redis from "ioredis"

const globalForRedis = globalThis as unknown as {
  __redisClient?: Redis | null
}

function createRedisClient() {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: true,
  })

  client.on("error", (err) => {
    console.error(JSON.stringify({
      category: "infra",
      level: "warn",
      event: "redis_error",
      message: err.message,
      timestamp: new Date().toISOString(),
    }))
  })

  return client
}

export const redis = globalForRedis.__redisClient ?? createRedisClient()

if (!globalForRedis.__redisClient) {
  globalForRedis.__redisClient = redis
}
