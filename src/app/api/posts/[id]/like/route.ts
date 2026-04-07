import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: postId } = await params

  try {
    await prisma.like.create({ data: { userId: session.user.id, postId } })
    return NextResponse.json({ liked: true })
  } catch {
    return NextResponse.json({ error: "Already liked or post not found" }, { status: 409 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: postId } = await params

  await prisma.like.deleteMany({ where: { userId: session.user.id, postId } })
  return NextResponse.json({ liked: false })
}
