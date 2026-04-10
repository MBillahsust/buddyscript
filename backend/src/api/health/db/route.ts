import { NextResponse } from "@/lib/next-server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const configured = Boolean(process.env.DATABASE_URL)
  const started = Date.now()

  if (!configured) {
    return NextResponse.json(
      {
        configured,
        connected: false,
        latencyMs: null,
        message: "DATABASE_URL is not set.",
      },
      { status: 500 }
    )
  }

  try {
    // Simple no-op query to verify DB connectivity.
    await prisma.$queryRaw`SELECT 1`
    const [users, posts, comments, replies] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.reply.count(),
    ])

    return NextResponse.json({
      configured,
      connected: true,
      latencyMs: Date.now() - started,
      message: "PostgreSQL is reachable.",
      counts: { users, posts, comments, replies },
    })
  } catch (error) {
    return NextResponse.json(
      {
        configured,
        connected: false,
        latencyMs: Date.now() - started,
        message: "PostgreSQL connection check failed.",
        error: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 }
    )
  }
}
