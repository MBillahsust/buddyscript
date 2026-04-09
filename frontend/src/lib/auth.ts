import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcryptjs from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { loginSchema } from "@/lib/validations"
import { authConfig } from "@/lib/auth.config"
import { logSecurityEvent } from "@/lib/security/audit"

type LoginAttemptBucket = {
  failedCount: number
  firstFailedAt: number
  blockedUntil?: number
}

const globalForLoginThrottle = globalThis as unknown as {
  __loginAttemptBuckets?: Map<string, LoginAttemptBucket>
}

const loginAttemptBuckets = globalForLoginThrottle.__loginAttemptBuckets ?? new Map<string, LoginAttemptBucket>()
if (!globalForLoginThrottle.__loginAttemptBuckets) {
  globalForLoginThrottle.__loginAttemptBuckets = loginAttemptBuckets
}

const LOGIN_FAILURE_WINDOW_MS = 10 * 60 * 1000
const LOGIN_FAILURE_MAX = 8
const LOGIN_BLOCK_MS = 15 * 60 * 1000

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const normalizedEmail = email.toLowerCase().trim()
        const now = Date.now()
        const attempt = loginAttemptBuckets.get(normalizedEmail)

        if (attempt?.blockedUntil && attempt.blockedUntil > now) {
          logSecurityEvent({
            event: "login_temporarily_blocked",
            route: "/api/auth/[...nextauth]",
            metadata: { email: normalizedEmail },
          })
          return null
        }

        if (attempt && now - attempt.firstFailedAt > LOGIN_FAILURE_WINDOW_MS) {
          loginAttemptBuckets.delete(normalizedEmail)
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
          const prev = loginAttemptBuckets.get(normalizedEmail)
          const failedCount = (prev?.failedCount ?? 0) + 1
          const firstFailedAt = prev?.firstFailedAt ?? now
          const blockedUntil = failedCount >= LOGIN_FAILURE_MAX ? now + LOGIN_BLOCK_MS : undefined
          loginAttemptBuckets.set(normalizedEmail, { failedCount, firstFailedAt, blockedUntil })
          return null
        }

        const passwordMatch = await bcryptjs.compare(password, user.password)
        if (!passwordMatch) {
          const prev = loginAttemptBuckets.get(normalizedEmail)
          const failedCount = (prev?.failedCount ?? 0) + 1
          const firstFailedAt = prev?.firstFailedAt ?? now
          const blockedUntil = failedCount >= LOGIN_FAILURE_MAX ? now + LOGIN_BLOCK_MS : undefined
          loginAttemptBuckets.set(normalizedEmail, { failedCount, firstFailedAt, blockedUntil })
          return null
        }

        loginAttemptBuckets.delete(normalizedEmail)

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.avatarUrl ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.image = user.image ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
      }
      if (token.image !== undefined) {
        session.user.image = token.image as string | null
      }
      return session
    },
  },
})
