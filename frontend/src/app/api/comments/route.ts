import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createCommentSchema } from "@/lib/validations"
import { logSecurityEvent } from "@/lib/security/audit"
import { getClientIp, RATE_LIMITS, hitRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit"
import { invalidateUsersFeedCache } from "@/lib/security/feed-cache"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const clientIp = getClientIp(req)
  const limit = await hitRateLimit(`comment:create:user:${session.user.id}`, RATE_LIMITS.createComment)
  if (!limit.allowed) {
    logSecurityEvent({
      event: "rate_limit_exceeded",
      userId: session.user.id,
      ip: clientIp,
      route: "/api/comments",
      metadata: { method: "POST", retryAfterSeconds: limit.retryAfterSeconds },
    })
    return NextResponse.json(
      { error: "Too many comments. Please slow down." },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  const body = await req.json()
  const parsed = createCommentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { postId, content } = parsed.data

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, visibility: true },
  })

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const canView = post.visibility === "PUBLIC" || post.authorId === session.user.id
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      postId,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      _count: { select: { likes: true } },
    },
  })

  await invalidateUsersFeedCache([session.user.id, post.authorId])

  return NextResponse.json(
    {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: comment.author,
      likedByMe: false,
      likeCount: comment._count.likes,
      replies: [],
    },
    { status: 201, headers: rateLimitHeaders(limit) }
  )
}
