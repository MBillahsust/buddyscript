import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ replyId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { replyId } = await params

  const reply = await prisma.reply.findUnique({
    where: { id: replyId },
    select: {
      id: true,
      comment: { select: { post: { select: { authorId: true, visibility: true } } } },
    },
  })

  if (!reply) {
    return NextResponse.json({ error: "Reply not found" }, { status: 404 })
  }

  const canView = reply.comment.post.visibility === "PUBLIC" || reply.comment.post.authorId === session.user.id
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const likers = await prisma.like.findMany({
    where: { replyId },
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
