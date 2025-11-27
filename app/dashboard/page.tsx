"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {session.user?.name}</h1>
        <p className="text-gray-600">Role: {(session.user as any)?.role}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">Total Patients</p>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">Today Appointments</p>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600">Pending Invoices</p>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
          <p className="text-sm text-gray-600">Active Doctors</p>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
      </div>
    </div>
  )
}
