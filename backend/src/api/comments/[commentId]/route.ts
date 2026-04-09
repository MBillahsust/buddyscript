import { NextResponse } from "@/lib/next-server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { invalidateUsersFeedCache } from "@/lib/security/feed-cache"

export async function DELETE(_req: Request, { params }: { params: Promise<{ commentId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { commentId } = await params

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
      post: { select: { authorId: true } },
    },
  })

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 })
  }

  if (comment.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.comment.delete({ where: { id: commentId } })
  await invalidateUsersFeedCache([session.user.id, comment.post.authorId])

  return NextResponse.json({ deleted: true })
}


