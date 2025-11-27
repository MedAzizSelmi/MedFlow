// app/page.tsx
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth" // Import from auth.ts, not the API route

export default async function HomePage() {
    const session = await getServerSession(authOptions)

    if (session?.user) {
        if ((session.user as any).role === "PATIENT") {
            redirect("/patient/dashboard")
        } else {
            redirect("/dashboard")
        }
    }

    redirect("/login")
}