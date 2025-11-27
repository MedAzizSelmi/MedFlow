// components/client-component.tsx
"use client"

import { useSession } from "next-auth/react"

export default function ClientComponent() {
    const { data: session, status } = useSession()

    if (status === "loading") {
        return <div>Loading...</div>
    }

    return (
        <div>
            Welcome, {session?.user?.name}
        </div>
    )
}