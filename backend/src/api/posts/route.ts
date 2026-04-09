import { NextRequest, NextResponse } from "@/lib/next-server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPostSchema } from "@/lib/validations"
import { logSecurityEvent } from "@/lib/security/audit"
import { logPerformanceEvent } from "@/lib/security/performance"
import { getClientIp, RATE_LIMITS, hitRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit"
import { getCachedFeedPage, invalidateUserFeedCache, setCachedFeedPage } from "@/lib/security/feed-cache"

const PAGE_SIZE = 10

export async function GET(req: NextRequest) {
  const startedAt = Date.now()
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const clientIp = getClientIp(req)
  const readLimit = await hitRateLimit(`posts:read:user:${userId}`, RATE_LIMITS.readFeed)
  if (!readLimit.allowed) {
    logSecurityEvent({
      event: "rate_limit_exceeded",
      userId,
      ip: clientIp,
      route: "/api/posts",
      metadata: { method: "GET", retryAfterSeconds: readLimit.retryAfterSeconds },
    })
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: rateLimitHeaders(readLimit) }
    )
  }

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined
  const cached = await getCachedFeedPage<{ posts: unknown[]; nextCursor: string | null }>(userId, cursor)
  if (cached) {
    logPerformanceEvent({
      route: "/api/posts",
      method: "GET",
      userId,
      statusCode: 200,
      totalMs: Date.now() - startedAt,
      cache: "HIT",
      payloadSizeBytes: JSON.stringify(cached).length,
      metadata: { cursor: cursor ?? null },
    })

    return NextResponse.json(cached, {
      headers: {
        ...rateLimitHeaders(readLimit),
        "X-Cache": "HIT",
        "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
      },
    })
  }

  const dbStartedAt = Date.now()
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { visibility: "PUBLIC" },
        { authorId: userId, visibility: "PRIVATE" },
      ],
    },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      likes: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
      _count: { select: { likes: true, comments: true } },
    },
  })

  let nextCursor: string | null = null
  if (posts.length > PAGE_SIZE) {
    nextCursor = posts[PAGE_SIZE].id
    posts.pop()
  }

  const postIds = posts.map((post) => post.id)
  const myLikes = postIds.length
    ? await prisma.like.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      })
    : []
  const likedPostIds = new Set(myLikes.map((like) => like.postId).filter((id): id is string => Boolean(id)))

  const normalizedPosts = posts.map((post) => {
    const { likes, ...rest } = post
    return {
      ...rest,
      likedByMe: likedPostIds.has(post.id),
      recentLikers: likes.map((like) => like.user),
    }
  })
  const payload = { posts: normalizedPosts, nextCursor }
  await setCachedFeedPage(userId, cursor, payload)

  const dbMs = Date.now() - dbStartedAt
  logPerformanceEvent({
    route: "/api/posts",
    method: "GET",
    userId,
    statusCode: 200,
    totalMs: Date.now() - startedAt,
    dbMs,
    cache: "MISS",
    payloadSizeBytes: JSON.stringify(payload).length,
    metadata: {
      cursor: cursor ?? null,
      postCount: normalizedPosts.length,
      nextCursor: nextCursor ?? null,
    },
  })

  return NextResponse.json(payload, {
    headers: {
      ...rateLimitHeaders(readLimit),
      "X-Cache": "MISS",
      "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
    },
  })
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const clientIp = getClientIp(req)
  const writeLimit = await hitRateLimit(`posts:create:user:${session.user.id}`, RATE_LIMITS.createPost)
  if (!writeLimit.allowed) {
    logSecurityEvent({
      event: "rate_limit_exceeded",
      userId: session.user.id,
      ip: clientIp,
      route: "/api/posts",
      metadata: { method: "POST", retryAfterSeconds: writeLimit.retryAfterSeconds },
    })
    return NextResponse.json(
      { error: "Posting too fast. Please wait and try again." },
      { status: 429, headers: rateLimitHeaders(writeLimit) }
    )
  }

  const body = await req.json()
  const parsed = createPostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { content, imageUrl, visibility } = parsed.data

  try {
    const dbStartedAt = Date.now()
    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        imageUrl: imageUrl ?? null,
        visibility,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })

    await invalidateUserFeedCache(session.user.id)

    const payload = { ...post, recentLikers: [], likedByMe: false }
    logPerformanceEvent({
      route: "/api/posts",
      method: "POST",
      userId: session.user.id,
      statusCode: 201,
      totalMs: Date.now() - startedAt,
      dbMs: Date.now() - dbStartedAt,
      payloadSizeBytes: JSON.stringify(payload).length,
      metadata: {
        hasImage: Boolean(imageUrl),
        visibility,
      },
    })

    return NextResponse.json(
      payload,
      { status: 201, headers: rateLimitHeaders(writeLimit) }
    )
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unknown post creation error"
    const dbUnavailable = rawMessage.includes("Can't reach database server")

    logSecurityEvent({
      event: "post_create_failed",
      userId: session.user.id,
      ip: clientIp,
      route: "/api/posts",
      level: "error",
      metadata: {
        dbUnavailable,
        error: rawMessage,
      },
    })

    logPerformanceEvent({
      route: "/api/posts",
      method: "POST",
      userId: session.user.id,
      statusCode: dbUnavailable ? 503 : 500,
      totalMs: Date.now() - startedAt,
      metadata: {
        dbUnavailable,
      },
    })

    return NextResponse.json(
      {
        error: dbUnavailable
          ? "Database is temporarily unreachable. Please try again in a moment."
          : "Failed to create post",
      },
      {
        status: dbUnavailable ? 503 : 500,
        headers: rateLimitHeaders(writeLimit),
      }
    )
  }
}


