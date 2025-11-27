"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Download, Plus } from "lucide-react"
import Link from "next/link"

interface PatientDetail {
  id: string
  user: {
    email: string
    firstName: string
    lastName: string
    phone: string
  }
  dateOfBirth: string
  gender: string
  bloodType: string
  allergies: string
  emergencyContact: string
  emergencyPhone: string
  appointments: any[]
  medicalRecords: any[]
  consultations: any[]
  invoices: any[]
}

export default function PatientDetailPage() {
  const params = useParams()
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patients/${params.id}`)
        const data = await response.json()
        setPatient(data)
      } catch (error) {
        console.error("Failed to fetch patient:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) fetchPatient()
  }, [params.id])

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!patient) return <div className="flex items-center justify-center h-screen">Patient not found</div>

  return (
    <div className="space-y-6">
      <Link href="/dashboard/patients" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Patients
      </Link>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            {patient.user.firstName} {patient.user.lastName}
          </h1>
          <p className="text-gray-600 mt-2">{patient.user.email}</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Edit className="w-4 h-4 mr-2" />
          Edit Patient
        </Button>
      </div>

      {/* Patient Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Blood Type</p>
            <p className="text-2xl font-bold mt-2">{patient.bloodType || "N/A"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Gender</p>
            <p className="text-2xl font-bold mt-2">{patient.gender}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Appointments</p>
            <p className="text-2xl font-bold mt-2">{patient.appointments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Active Prescriptions</p>
            <p className="text-2xl font-bold mt-2">
              {patient.consultations.reduce(
                (acc, c) => acc + c.prescriptions.filter((p: any) => p.status === "ACTIVE").length,
                0,
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="medical">Medical Records</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-lg mt-1">{patient.user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                  <p className="text-lg mt-1">{patient.user.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                  <p className="text-lg mt-1">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Gender</p>
                  <p className="text-lg mt-1">{patient.gender}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Blood Type</p>
                  <p className="text-lg mt-1">{patient.bloodType || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Allergies</p>
                  <p className="text-lg mt-1">{patient.allergies || "None"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Emergency Contact</p>
                  <p className="text-lg mt-1">{patient.emergencyContact || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Emergency Phone</p>
                  <p className="text-lg mt-1">{patient.emergencyPhone || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Appointment History</CardTitle>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Appointment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {patient.appointments.length === 0 ? (
                <p className="text-center text-gray-500">No appointments</p>
              ) : (
                <div className="space-y-4">
                  {patient.appointments.map((apt) => (
                    <div key={apt.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">
                            Dr. {apt.doctor.user.firstName} {apt.doctor.user.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{apt.service.name}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(apt.appointmentDate).toLocaleDateString()} at{" "}
                            {new Date(apt.appointmentDate).toLocaleTimeString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            apt.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : apt.status === "SCHEDULED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Records Tab */}
        <TabsContent value="medical">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Medical Records</CardTitle>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Record
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {patient.medicalRecords.length === 0 ? (
                <p className="text-center text-gray-500">No medical records</p>
              ) : (
                <div className="space-y-4">
                  {patient.medicalRecords.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{record.recordType}</h4>
                          <p className="text-sm text-gray-600">{record.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {record.attachmentUrl && (
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.invoices.length === 0 ? (
                <p className="text-center text-gray-500">No invoices</p>
              ) : (
                <div className="space-y-4">
                  {patient.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex justify-between items-center border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-semibold">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${invoice.totalAmount.toFixed(2)}</p>
                        <span
                          className={`text-xs font-medium ${
                            invoice.status === "PAID"
                              ? "text-green-600"
                              : invoice.status === "PENDING"
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
