"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, Calendar } from "lucide-react"
import Link from "next/link"

interface Appointment {
  id: string
  status: string
  appointmentDate: string
  duration: number
  notes: string
  patient: {
    user: {
      firstName: string
      lastName: string
      email: string
      phone: string
    }
  }
  doctor: {
    user: {
      firstName: string
      lastName: string
    }
  }
  service: {
    name: string
    price: number
  }
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [view, setView] = useState<"list" | "calendar">("list")

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch("/api/appointments")
        const data = await response.json()
        setAppointments(data)
      } catch (error) {
        console.error("Failed to fetch appointments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAppointments()
  }, [])

  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.patient.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctor.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient.user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage all clinic appointments</p>
        </div>
        <Link href="/dashboard/appointments/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 focus-visible:ring-0"
              />
            </div>
            <div className="flex gap-2">
              <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}>
                List
              </Button>
              <Button
                variant={view === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("calendar")}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : filteredAppointments.length === 0 ? (
            <p className="text-center text-gray-500">No appointments found</p>
          ) : view === "list" ? (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {apt.patient.user.firstName} {apt.patient.user.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Dr. {apt.doctor.user.firstName} {apt.doctor.user.lastName} - {apt.service.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(apt.appointmentDate).toLocaleDateString("fr-FR")} at{" "}
                      {new Date(apt.appointmentDate).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/appointments/${apt.id}`}>
                        <Button variant="ghost" size="sm" className="text-gray-600">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Calendar view coming soon</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
