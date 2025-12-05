// app/page.tsx
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth" // Import from auth.ts, not the API route

export default async function HomePage() {
    const session = await getServerSession(authOptions)

    if (session?.user) {
        if ((session.user as any).role === "PATIENT") {
            redirect("/patient/dashboard")
        }
        if ((session.user as any).role === "ADMIN") {
            redirect("/admin/dashboard")
        }
        if ((session.user as any).role === "DOCTOR") {
            redirect("/doctor/dashboard")
        }
        if ((session.user as any).role === "RECEPTIONIST") {
            redirect("/receptionist/dashboard")
        }
    }

    redirect("/login")
}