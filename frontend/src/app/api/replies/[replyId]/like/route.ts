import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logSecurityEvent } from "@/lib/security/audit"
import { getClientIp, RATE_LIMITS, hitRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit"
import { invalidateUsersFeedCache } from "@/lib/security/feed-cache"

export async function POST(req: NextRequest, { params }: { params: Promise<{ replyId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const clientIp = getClientIp(req)
  const limit = await hitRateLimit(`like:reply:user:${session.user.id}`, RATE_LIMITS.toggleLike)
  if (!limit.allowed) {
    logSecurityEvent({
      event: "rate_limit_exceeded",
      userId: session.user.id,
      ip: clientIp,
      route: "/api/replies/[replyId]/like",
      metadata: { method: "POST", retryAfterSeconds: limit.retryAfterSeconds },
    })
    return NextResponse.json(
      { error: "Too many like actions. Please wait a moment." },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  const { replyId } = await params

  const reply = await prisma.reply.findUnique({
    where: { id: replyId },
    select: {
      id: true,
      comment: {
        select: {
          post: { select: { authorId: true, visibility: true } },
        },
      },
    },
  })

  if (!reply) {
    return NextResponse.json({ error: "Reply not found" }, { status: 404 })
  }

  const canView = reply.comment.post.visibility === "PUBLIC" || reply.comment.post.authorId === session.user.id
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const existing = await prisma.like.findUnique({
    where: { userId_replyId: { userId: session.user.id, replyId } },
  })

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } })
    const likeCount = await prisma.like.count({ where: { replyId } })
    await invalidateUsersFeedCache([session.user.id, reply.comment.post.authorId])
    return NextResponse.json({ liked: false, likeCount }, { headers: rateLimitHeaders(limit) })
  }

  await prisma.like.create({ data: { userId: session.user.id, replyId } })
  const likeCount = await prisma.like.count({ where: { replyId } })
  await invalidateUsersFeedCache([session.user.id, reply.comment.post.authorId])

  return NextResponse.json({ liked: true, likeCount }, { headers: rateLimitHeaders(limit) })
}
