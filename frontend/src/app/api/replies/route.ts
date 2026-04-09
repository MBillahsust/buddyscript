import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createReplySchema } from "@/lib/validations"
import { logSecurityEvent } from "@/lib/security/audit"
import { getClientIp, RATE_LIMITS, hitRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit"
import { invalidateUsersFeedCache } from "@/lib/security/feed-cache"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const clientIp = getClientIp(req)
  const limit = await hitRateLimit(`reply:create:user:${session.user.id}`, RATE_LIMITS.createReply)
  if (!limit.allowed) {
    logSecurityEvent({
      event: "rate_limit_exceeded",
      userId: session.user.id,
      ip: clientIp,
      route: "/api/replies",
      metadata: { method: "POST", retryAfterSeconds: limit.retryAfterSeconds },
    })
    return NextResponse.json(
      { error: "Too many replies. Please slow down." },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  const body = await req.json()
  const parsed = createReplySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { commentId, content } = parsed.data

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      post: { select: { authorId: true, visibility: true } },
    },
  })

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 })
  }

  const canView = comment.post.visibility === "PUBLIC" || comment.post.authorId === session.user.id
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const reply = await prisma.reply.create({
    data: {
      content: content.trim(),
      commentId,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      _count: { select: { likes: true } },
    },
  })

  await invalidateUsersFeedCache([session.user.id, comment.post.authorId])

  return NextResponse.json(
    {
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt,
      author: reply.author,
      likedByMe: false,
      likeCount: reply._count.likes,
    },
    { status: 201, headers: rateLimitHeaders(limit) }
  )
}
