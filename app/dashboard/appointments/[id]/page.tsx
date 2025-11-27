"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface AppointmentDetail {
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
  consultation?: any
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState("")

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await fetch(`/api/appointments/${params.id}`)
        const data = await response.json()
        setAppointment(data)
        setStatus(data.status)
      } catch (error) {
        console.error("Failed to fetch appointment:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) fetchAppointment()
  }, [params.id])

  const handleStatusChange = async (newStatus: string) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/appointments/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setStatus(newStatus)
        alert("Appointment updated successfully")
      }
    } catch (error) {
      alert("Failed to update appointment")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!appointment) return <div className="flex items-center justify-center h-screen">Appointment not found</div>

  return (
    <div className="space-y-6">
      <Link href="/dashboard/appointments" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Appointments
      </Link>

      <Card>
        <CardHeader className="flex justify-between items-start">
          <div>
            <CardTitle>Appointment Details</CardTitle>
          </div>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isSaving}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Patient</p>
              <p className="text-lg mt-1">
                {appointment.patient.user.firstName} {appointment.patient.user.lastName}
              </p>
              <p className="text-sm text-gray-500 mt-1">{appointment.patient.user.email}</p>
              <p className="text-sm text-gray-500">{appointment.patient.user.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Doctor</p>
              <p className="text-lg mt-1">
                Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Service</p>
              <p className="text-lg mt-1">{appointment.service.name}</p>
              <p className="text-sm text-gray-500 mt-1">${appointment.service.price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Date & Time</p>
              <p className="text-lg mt-1">{new Date(appointment.appointmentDate).toLocaleDateString("fr-FR")}</p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(appointment.appointmentDate).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600">Duration</p>
            <p className="text-lg mt-1">{appointment.duration} minutes</p>
          </div>

          {appointment.notes && (
            <div>
              <p className="text-sm font-medium text-gray-600">Notes</p>
              <p className="text-lg mt-1">{appointment.notes}</p>
            </div>
          )}

          {appointment.consultation && (
            <Link href={`/dashboard/consultations/${appointment.consultation.id}`}>
              <Button className="mt-4">View Consultation</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
