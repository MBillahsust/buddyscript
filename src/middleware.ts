import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

// Only imports the edge-safe config — no Prisma, no Node.js modules
export default NextAuth(authConfig).auth

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|assets|favicon.ico).*)"],
}
