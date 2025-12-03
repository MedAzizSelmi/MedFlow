"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, Home, Calendar, FileText, Clipboard, User } from "lucide-react"

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(true)

    // Get doctor name
    const getDoctorName = () => {
        if (!session?.user) return "Doctor"

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
        return "Doctor"
    }

    const doctorName = getDoctorName()

    useEffect(() => {
        if (status === "loading") return
        if (!session) {
            router.replace("/login")
        } else if ((session.user as any)?.role !== "DOCTOR") {
            router.replace("/unauthorized")
        }
    }, [session, status, router])

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    const menuItems = [
        { name: "Dashboard", icon: Home, href: "/doctor/dashboard" },
        { name: "My Profile", icon: User, href: "/doctor/profile" },
        { name: "Agenda", icon: Calendar, href: "/doctor/agenda" },
        { name: "Medical Records", icon: FileText, href: "/doctor/medical-records" },
        { name: "Prescriptions", icon: Clipboard, href: "/doctor/prescriptions" },
    ]

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? "w-64" : "w-20"} bg-blue-900 text-white transition-all duration-300 flex flex-col`}>
                <div className="p-4 border-b border-blue-800">
                    <h1 className={`font-bold text-xl ${!sidebarOpen && "hidden"}`}>MedFlow</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition-colors"
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {sidebarOpen && <span>{item.name}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-blue-800 space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-800">
                        <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold">
                            {doctorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{doctorName}</p>
                                <p className="text-xs text-blue-300">Doctor</p>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-white hover:bg-blue-800"
                        onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
                    >
                        <LogOut className="w-5 h-5" />
                        {sidebarOpen && <span className="ml-2">Logout</span>}
                    </Button>
                </div>

                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-3 hover:bg-blue-800 transition-colors"
                    aria-label="Toggle sidebar"
                >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white border-b border-gray-200 h-16 flex items-center px-6 shadow-sm">
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900">Doctor Portal</h2>
                    </div>
                </div>

                <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
        </div>
    )
}
