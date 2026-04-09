import { NextResponse } from "@/lib/next-server"
import { redis } from "@/lib/redis"

export async function GET() {
  const configured = Boolean(process.env.REDIS_URL)

  if (!redis) {
    return NextResponse.json({
      configured,
      connected: false,
      mode: "memory-fallback",
      ping: null,
      latencyMs: null,
      message: configured
        ? "REDIS_URL exists but Redis client is unavailable."
        : "REDIS_URL is not set. Using in-memory fallback.",
    })
  }

  const started = Date.now()

  try {
    const ping = await redis.ping()
    const key = `health:redis:${Date.now()}`
    await redis.set(key, "ok", "EX", 10)
    const value = await redis.get(key)

    return NextResponse.json({
      configured,
      connected: ping === "PONG" && value === "ok",
      mode: "redis",
      ping,
      latencyMs: Date.now() - started,
      message: "Redis is reachable and read/write test passed.",
    })
  } catch (error) {
    return NextResponse.json(
      {
        configured,
        connected: false,
        mode: "memory-fallback",
        ping: null,
        latencyMs: Date.now() - started,
        message: "Redis ping failed. Falling back to in-memory mode.",
        error: error instanceof Error ? error.message : "Unknown Redis error",
      },
      { status: 500 }
    )
  }
}


