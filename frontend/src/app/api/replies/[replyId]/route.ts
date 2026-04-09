import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { invalidateUsersFeedCache } from "@/lib/security/feed-cache"

export async function DELETE(_req: Request, { params }: { params: Promise<{ replyId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { replyId } = await params

  const reply = await prisma.reply.findUnique({
    where: { id: replyId },
    select: {
      id: true,
      authorId: true,
      comment: { select: { post: { select: { authorId: true } } } },
    },
  })

  if (!reply) {
    return NextResponse.json({ error: "Reply not found" }, { status: 404 })
  }

  if (reply.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.reply.delete({ where: { id: replyId } })
  await invalidateUsersFeedCache([session.user.id, reply.comment.post.authorId])

  return NextResponse.json({ deleted: true })
}
