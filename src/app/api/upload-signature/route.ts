import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateUploadSignature } from "@/lib/cloudinary"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const signature = generateUploadSignature()
  return NextResponse.json(signature)
}
