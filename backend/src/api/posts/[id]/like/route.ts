import { NextRequest, NextResponse } from "@/lib/next-server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logSecurityEvent } from "@/lib/security/audit"
import { getClientIp, RATE_LIMITS, hitRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit"
import { invalidateUsersFeedCache } from "@/lib/security/feed-cache"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clientIp = getClientIp(req)
  const limit = await hitRateLimit(`like:post:user:${session.user.id}`, RATE_LIMITS.toggleLike)
  if (!limit.allowed) {
    logSecurityEvent({
      event: "rate_limit_exceeded",
      userId: session.user.id,
      ip: clientIp,
      route: "/api/posts/[id]/like",
      metadata: { method: "POST", retryAfterSeconds: limit.retryAfterSeconds },
    })
    return NextResponse.json(
      { error: "Too many like actions. Please wait a moment." },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  const { id: postId } = await params

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } })
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: session.user.id, postId } },
  })

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } })
    const likeCount = await prisma.like.count({ where: { postId } })
    await invalidateUsersFeedCache([session.user.id, post.authorId])
    return NextResponse.json({ liked: false, likeCount }, { headers: rateLimitHeaders(limit) })
  }

  await prisma.like.create({ data: { userId: session.user.id, postId } })
  const likeCount = await prisma.like.count({ where: { postId } })
  await invalidateUsersFeedCache([session.user.id, post.authorId])
  return NextResponse.json({ liked: true, likeCount }, { headers: rateLimitHeaders(limit) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clientIp = getClientIp(req)
  const limit = await hitRateLimit(`like:post:user:${session.user.id}`, RATE_LIMITS.toggleLike)
  if (!limit.allowed) {
    logSecurityEvent({
      event: "rate_limit_exceeded",
      userId: session.user.id,
      ip: clientIp,
      route: "/api/posts/[id]/like",
      metadata: { method: "DELETE", retryAfterSeconds: limit.retryAfterSeconds },
    })
    return NextResponse.json(
      { error: "Too many like actions. Please wait a moment." },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  const { id: postId } = await params

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } })
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })

  await prisma.like.deleteMany({ where: { userId: session.user.id, postId } })
  const likeCount = await prisma.like.count({ where: { postId } })
  await invalidateUsersFeedCache([session.user.id, post.authorId])
  return NextResponse.json({ liked: false, likeCount }, { headers: rateLimitHeaders(limit) })
}


