"use client"

import type React from "react"

import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Home, Calendar, FileText, DollarSign, User } from "lucide-react"
import { useState } from "react"

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (status === "loading") {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!session || (session.user as any)?.role !== "PATIENT") {
    redirect("/login")
  }

  const menuItems = [
    { name: "Dashboard", icon: Home, href: "/patient/dashboard" },
    { name: "My Profile", icon: User, href: "/patient/profile" },
    { name: "Appointments", icon: Calendar, href: "/patient/appointments" },
    { name: "Medical Records", icon: FileText, href: "/patient/medical-records" },
    { name: "Invoices", icon: DollarSign, href: "/patient/invoices" },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-blue-900 text-white transition-all duration-300 flex flex-col`}
      >
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
            <div className="w-8 h-8 bg-blue-400 rounded-full" />
            {sidebarOpen && (
              <div>
                <p className="text-sm font-medium">{session.user?.name}</p>
                <p className="text-xs text-blue-300">Patient</p>
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 h-16 flex items-center px-6 shadow-sm">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">Patient Portal</h2>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
