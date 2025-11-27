"use client"

import type React from "react"

import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, Home, Users, Calendar, FileText, DollarSign, Settings } from "lucide-react"
import { useState } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (status === "loading") {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!session) {
    redirect("/login")
  }

  const menuItems = [
    { name: "Dashboard", icon: Home, href: "/dashboard" },
    { name: "Patients", icon: Users, href: "/dashboard/patients" },
    { name: "Appointments", icon: Calendar, href: "/dashboard/appointments" },
    { name: "Consultations", icon: FileText, href: "/dashboard/consultations" },
    { name: "Billing", icon: DollarSign, href: "/dashboard/billing" },
    { name: "Settings", icon: Settings, href: "/dashboard/settings" },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-800">
          <h1 className={`font-bold text-xl ${!sidebarOpen && "hidden"}`}>MedFlow</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800">
            <div className="w-8 h-8 bg-blue-600 rounded-full" />
            {sidebarOpen && (
              <div>
                <p className="text-sm font-medium">{session.user?.name}</p>
                <p className="text-xs text-gray-400">{(session.user as any)?.role}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-gray-800"
            onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 hover:bg-gray-800 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 h-16 flex items-center px-6 shadow-sm">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
