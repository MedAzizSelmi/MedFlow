"use client"

import { useSession } from "next-auth/react"

export default function ClientComponent() {
    const { data: session, status } = useSession()

    // Get username
    const getUserName = () => {
        if (!session?.user) return "User"

        const user = session.user as any
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`
        }
        if (user.firstName) {
            return user.firstName
        }
        if (user.name) {
            return user.name
        }
        return "User"
    }

    const userName = getUserName()

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Loading...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        return (
            <div className="p-4 text-gray-600">
                Not signed in
            </div>
        )
    }

    return (
        <div className="p-4">
            <p className="text-lg">Welcome, <span className="font-semibold">{userName}</span></p>
        </div>
    )
}
