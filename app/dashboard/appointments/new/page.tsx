"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

interface Patient {
  id: string
  user: {
    firstName: string
    lastName: string
  }
}

interface Doctor {
  id: string
  user: {
    firstName: string
    lastName: string
  }
}

interface Service {
  id: string
  name: string
  duration: number
  doctorId: string
}

export default function NewAppointmentPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    serviceId: "",
    appointmentDate: "",
    appointmentTime: "",
    notes: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, dRes, sRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/doctors"),
          fetch("/api/services"),
        ])

        if (pRes.ok) setPatients(await pRes.json())
        if (dRes.ok) setDoctors(await dRes.json())
        if (sRes.ok) setServices(await sRes.json())
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const dateTime = `${formData.appointmentDate}T${formData.appointmentTime}`
      const selectedService = services.find((s) => s.id === formData.serviceId)

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: formData.patientId,
          doctorId: formData.doctorId,
          serviceId: formData.serviceId,
          appointmentDate: dateTime,
          duration: selectedService?.duration || 30,
          notes: formData.notes,
        }),
      })

      if (response.ok) {
        router.push("/dashboard/appointments")
      } else {
        alert("Failed to create appointment")
      }
    } catch (error) {
      alert("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedDoctor = formData.doctorId
  const availableServices = selectedDoctor ? services.filter((s) => s.doctorId === selectedDoctor) : []

  return (
    <div className="space-y-6">
      <Link href="/dashboard/appointments" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Appointments
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Book New Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Patient *</label>
                <select
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.user.firstName} {patient.user.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Doctor *</label>
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.user.firstName} {doctor.user.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Service *</label>
              <select
                name="serviceId"
                value={formData.serviceId}
                onChange={handleChange}
                required
                disabled={!selectedDoctor}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option>Select a service</option>
                {availableServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.duration} min)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <Input
                  name="appointmentDate"
                  type="date"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time *</label>
                <Input
                  name="appointmentTime"
                  type="time"
                  value={formData.appointmentTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Book Appointment"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
