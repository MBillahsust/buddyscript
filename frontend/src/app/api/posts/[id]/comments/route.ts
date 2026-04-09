import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: postId } = await params

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

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      likes: { where: { userId: session.user.id }, select: { id: true } },
      _count: { select: { likes: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          likes: { where: { userId: session.user.id }, select: { id: true } },
          _count: { select: { likes: true } },
        },
      },
    },
  })

  const normalized = comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: comment.author,
    likedByMe: comment.likes.length > 0,
    likeCount: comment._count.likes,
    replies: comment.replies.map((reply) => ({
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt,
      author: reply.author,
      likedByMe: reply.likes.length > 0,
      likeCount: reply._count.likes,
    })),
  }))

  return NextResponse.json({ comments: normalized })
}
