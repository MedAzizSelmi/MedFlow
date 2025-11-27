"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Eye, FileText } from "lucide-react"
import Link from "next/link"

interface Consultation {
  id: string
  diagnosis: string
  symptoms: string
  treatment: string
  createdAt: string
  patient: {
    user: {
      firstName: string
      lastName: string
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

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const response = await fetch("/api/consultations")
        const data = await response.json()
        setConsultations(data)
      } catch (error) {
        console.error("Failed to fetch consultations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConsultations()
  }, [])

  const filteredConsultations = consultations.filter(
    (c) =>
      c.patient.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.doctor.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Consultations</h1>
          <p className="text-gray-600 mt-1">Manage patient consultations and diagnoses</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search consultations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : filteredConsultations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No consultations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConsultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {consultation.patient.user.firstName} {consultation.patient.user.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Dr. {consultation.doctor.user.firstName} {consultation.doctor.user.lastName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Diagnosis:</span> {consultation.diagnosis}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-gray-500">Prescriptions: {consultation.prescriptions.length}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(consultation.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                  <Link href={`/dashboard/consultations/${consultation.id}`}>
                    <Button variant="ghost" size="sm" className="text-blue-600">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
