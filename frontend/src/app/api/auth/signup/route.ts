import { NextRequest, NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signupSchema } from "@/lib/validations"
import { logSecurityEvent } from "@/lib/security/audit"
import { getClientIp, RATE_LIMITS, hitRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const ipLimit = await hitRateLimit(`signup:ip:${ip}`, RATE_LIMITS.authSignupIp)
    if (!ipLimit.allowed) {
      logSecurityEvent({
        event: "rate_limit_exceeded",
        ip,
        route: "/api/auth/signup",
        metadata: { scope: "ip", retryAfterSeconds: ipLimit.retryAfterSeconds },
      })
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again shortly." },
        { status: 429, headers: rateLimitHeaders(ipLimit) }
      )
    }

    const body = await req.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, password } = parsed.data

    const emailLimit = await hitRateLimit(`signup:email:${email.toLowerCase()}`, RATE_LIMITS.authSignupEmail)
    if (!emailLimit.allowed) {
      logSecurityEvent({
        event: "rate_limit_exceeded",
        ip,
        route: "/api/auth/signup",
        metadata: { scope: "email", email: email.toLowerCase(), retryAfterSeconds: emailLimit.retryAfterSeconds },
      })
      return NextResponse.json(
        { error: "Too many attempts for this email. Please wait and try again." },
        { status: 429, headers: rateLimitHeaders(emailLimit) }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcryptjs.hash(password, 12)

    await prisma.user.create({
      data: { firstName, lastName, email, password: hashedPassword },
    })

    return NextResponse.json({ success: true }, { status: 201, headers: rateLimitHeaders(emailLimit) })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
