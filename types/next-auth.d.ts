// /types/next-auth.d.ts
import NextAuth from "next-auth"

declare module "next-auth" {
    interface User {
        id: string
        role: string
        firstName?: string
        lastName?: string
    }

    interface Session {
        user: {
            id: string
            role: string
            email: string
            firstName?: string
            lastName?: string
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: string
    }
}
