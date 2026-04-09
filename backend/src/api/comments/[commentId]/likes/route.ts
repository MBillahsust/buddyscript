import { NextRequest, NextResponse } from "@/lib/next-server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { commentId } = await params

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, post: { select: { authorId: true, visibility: true } } },
  })

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 })
  }

  const canView = comment.post.visibility === "PUBLIC" || comment.post.authorId === session.user.id
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const likers = await prisma.like.findMany({
    where: { commentId },
    orderBy: { createdAt: "desc" },
    select: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  })

  return NextResponse.json({
    likers: likers.map((like) => like.user),
    total: likers.length,
  })
}


