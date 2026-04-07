import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPostSchema } from "@/lib/validations"

const PAGE_SIZE = 10

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined

  const posts = await prisma.post.findMany({
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  let nextCursor: string | null = null
  if (posts.length > PAGE_SIZE) {
    nextCursor = posts[PAGE_SIZE].id
    posts.pop()
  }

  return NextResponse.json({ posts, nextCursor })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createPostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { content, imageUrl, visibility } = parsed.data

  const post = await prisma.post.create({
    data: {
      content,
      imageUrl: imageUrl ?? null,
      visibility,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  return NextResponse.json(post, { status: 201 })
}
