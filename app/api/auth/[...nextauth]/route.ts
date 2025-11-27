// app/api/auth/[...nextauth]/route.ts
import NextAuth from "@/auth"

const handler = NextAuth

export { handler as GET, handler as POST }