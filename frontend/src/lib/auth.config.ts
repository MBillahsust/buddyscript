import type { NextAuthConfig } from "next-auth"

// Edge-safe config — NO Prisma, NO Node.js-only modules
// Used by middleware only
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [], // filled in auth.ts with credentials + bcrypt
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname
      const isAuthPage =
        pathname.startsWith("/login") || pathname.startsWith("/register")

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/feed", nextUrl))
      }
      if (!isAuthPage && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl))
      }
      return true
    },
  },
}
