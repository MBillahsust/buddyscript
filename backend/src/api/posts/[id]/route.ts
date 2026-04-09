import { NextRequest, NextResponse } from "@/lib/next-server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logSecurityEvent } from "@/lib/security/audit"
import { getClientIp, RATE_LIMITS, hitRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit"
import { invalidateUsersFeedCache } from "@/lib/security/feed-cache"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clientIp = getClientIp(req)
  const limit = await hitRateLimit(`posts:delete:user:${session.user.id}`, RATE_LIMITS.createPost)
  if (!limit.allowed) {
    logSecurityEvent({
      event: "rate_limit_exceeded",
      userId: session.user.id,
      ip: clientIp,
      route: "/api/posts/[id]",
      metadata: { method: "DELETE", retryAfterSeconds: limit.retryAfterSeconds },
    })
    return NextResponse.json(
      { error: "Too many delete actions. Please wait a moment." },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  const { id } = await params

  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } })
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (post.authorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.post.delete({ where: { id } })
  await invalidateUsersFeedCache([session.user.id, post.authorId])
  return NextResponse.json({ deleted: true }, { headers: rateLimitHeaders(limit) })
}


