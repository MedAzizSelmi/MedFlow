"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Download } from "lucide-react"
import Link from "next/link"

interface ConsultationDetail {
  id: string
  diagnosis: string
  symptoms: string
  treatment: string
  notes: string
  followUpDate: string
  createdAt: string
  appointment: {
    appointmentDate: string
    service: {
      name: string
    }
  }
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
  prescriptions: any[]
}

export default function ConsultationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [consultation, setConsultation] = useState<ConsultationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [prescriptionData, setPrescriptionData] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  })

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        const response = await fetch(`/api/consultations/${params.id}`)
        const data = await response.json()
        setConsultation(data)
      } catch (error) {
        console.error("Failed to fetch consultation:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) fetchConsultation()
  }, [params.id])

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consultation) return

    try {
      const response = await fetch(`/api/consultations/${params.id}/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...prescriptionData,
          patientId: consultation.patient.user.firstName,
        }),
      })

      if (response.ok) {
        const newPrescription = await response.json()
        setConsultation({
          ...consultation,
          prescriptions: [...consultation.prescriptions, newPrescription],
        })
        setPrescriptionData({
          medication: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
        })
        setShowPrescriptionForm(false)
      }
    } catch (error) {
      alert("Failed to add prescription")
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!consultation) return <div className="flex items-center justify-center h-screen">Consultation not found</div>

  return (
    <div className="space-y-6">
      <Link href="/dashboard/consultations" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Consultations
      </Link>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            {consultation.patient.user.firstName} {consultation.patient.user.lastName}
          </h1>
          <p className="text-gray-600 mt-2">
            Dr. {consultation.doctor.user.firstName} {consultation.doctor.user.lastName}
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="symptoms">Symptoms & Treatment</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Consultation Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Appointment Date</p>
                  <p className="text-lg mt-1">
                    {new Date(consultation.appointment.appointmentDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Service</p>
                  <p className="text-lg mt-1">{consultation.appointment.service.name}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Diagnosis</p>
                <p className="text-lg mt-1">{consultation.diagnosis}</p>
              </div>

              {consultation.followUpDate && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Follow-up Date</p>
                  <p className="text-lg mt-1">{new Date(consultation.followUpDate).toLocaleDateString("fr-FR")}</p>
                </div>
              )}

              {consultation.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Notes</p>
                  <p className="text-lg mt-1">{consultation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Symptoms & Treatment Tab */}
        <TabsContent value="symptoms">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Symptoms</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{consultation.symptoms}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Treatment</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{consultation.treatment}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Prescriptions</CardTitle>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowPrescriptionForm(!showPrescriptionForm)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Prescription
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {showPrescriptionForm && (
                <form onSubmit={handleAddPrescription} className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Medication *</label>
                      <Input
                        value={prescriptionData.medication}
                        onChange={(e) => setPrescriptionData({ ...prescriptionData, medication: e.target.value })}
                        required
                        placeholder="e.g., Amoxicillin"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Dosage *</label>
                      <Input
                        value={prescriptionData.dosage}
                        onChange={(e) => setPrescriptionData({ ...prescriptionData, dosage: e.target.value })}
                        required
                        placeholder="e.g., 500mg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Frequency *</label>
                      <Input
                        value={prescriptionData.frequency}
                        onChange={(e) => setPrescriptionData({ ...prescriptionData, frequency: e.target.value })}
                        required
                        placeholder="e.g., 3 times daily"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration *</label>
                      <Input
                        value={prescriptionData.duration}
                        onChange={(e) => setPrescriptionData({ ...prescriptionData, duration: e.target.value })}
                        required
                        placeholder="e.g., 7 days"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Instructions</label>
                    <Input
                      value={prescriptionData.instructions}
                      onChange={(e) => setPrescriptionData({ ...prescriptionData, instructions: e.target.value })}
                      placeholder="Special instructions..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Save Prescription
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowPrescriptionForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {consultation.prescriptions.length === 0 ? (
                <p className="text-center text-gray-500">No prescriptions yet</p>
              ) : (
                <div className="space-y-4">
                  {consultation.prescriptions.map((rx) => (
                    <div key={rx.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{rx.medication}</h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            rx.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {rx.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Dosage</p>
                          <p className="font-medium">{rx.dosage}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Frequency</p>
                          <p className="font-medium">{rx.frequency}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Duration</p>
                          <p className="font-medium">{rx.duration}</p>
                        </div>
                      </div>
                      {rx.instructions && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Instructions:</span> {rx.instructions}
                        </p>
                      )}
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
