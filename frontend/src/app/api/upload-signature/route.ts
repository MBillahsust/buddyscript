import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateUploadSignature } from "@/lib/cloudinary"
import { logSecurityEvent } from "@/lib/security/audit"
import { RATE_LIMITS, hitRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rate = await hitRateLimit(`upload-signature:user:${session.user.id}`, RATE_LIMITS.uploadSignature)
  if (!rate.allowed) {
    logSecurityEvent({
      event: "rate_limit_exceeded",
      userId: session.user.id,
      route: "/api/upload-signature",
      metadata: { retryAfterSeconds: rate.retryAfterSeconds },
    })
    return NextResponse.json(
      { error: "Too many upload requests. Please try again shortly." },
      { status: 429, headers: rateLimitHeaders(rate) }
    )
  }

  const signature = generateUploadSignature()
  return NextResponse.json(signature, { headers: rateLimitHeaders(rate) })
}
