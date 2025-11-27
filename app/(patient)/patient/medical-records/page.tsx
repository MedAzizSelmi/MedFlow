// app/patient/medical-records/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Download, FileText, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MedicalRecord {
    id: string
    recordType: string
    description: string
    attachmentUrl?: string
    createdAt: string
}

export default function PatientMedicalRecordsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [records, setRecords] = useState<MedicalRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const response = await fetch("/api/medical-records")
                if (response.ok) {
                    const data = await response.json()
                    setRecords(data)
                } else {
                    console.error("Failed to fetch medical records")
                }
            } catch (error) {
                console.error("Failed to fetch medical records:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchRecords()
    }, [])

    const filteredRecords = records.filter((record) =>
        record.recordType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Medical Records</h1>
                <p className="text-gray-600 mt-1">View and download your medical records</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-0 focus-visible:ring-0"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center text-gray-500">Loading...</p>
                    ) : filteredRecords.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">
                                {records.length === 0 ? "No medical records available" : "No records match your search"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRecords.map((record) => (
                                <div
                                    key={record.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                                >
                                    <div>
                                        <h4 className="font-semibold">{record.recordType}</h4>
                                        <p className="text-sm text-gray-600">{record.description}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(record.createdAt).toLocaleDateString("fr-FR")}
                                        </p>
                                    </div>
                                    {record.attachmentUrl && (
                                        <Button variant="ghost" size="sm" className="text-blue-600">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}