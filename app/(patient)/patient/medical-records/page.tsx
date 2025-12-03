"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Download, FileText, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface MedicalRecord {
    id: string
    recordType: string
    description: string
    attachmentUrl: string | null
    createdAt: string
}

export default function PatientMedicalRecordsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [records, setRecords] = useState<MedicalRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchRecords()
    }, [])

    const fetchRecords = async () => {
        try {
            const response = await fetch("/api/patient/medical-records")
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

    const filteredRecords = records.filter(
        (record) =>
            record.recordType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getRecordTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            Diagnosis: "bg-blue-100 text-blue-800",
            "Lab Result": "bg-green-100 text-green-800",
            Imaging: "bg-purple-100 text-purple-800",
            Prescription: "bg-orange-100 text-orange-800",
            "Consultation Note": "bg-yellow-100 text-yellow-800",
        }
        return <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>{type}</Badge>
    }

    if (isLoading) {
        return <div className="text-center py-12">Loading medical records...</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Medical Records</h1>
                <p className="text-gray-600 mt-1">View and download your medical records</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Search</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Records ({filteredRecords.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredRecords.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">
                                {records.length === 0 ? "No medical records available" : "No records match your search"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRecords.map((record) => (
                                <div key={record.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                {getRecordTypeBadge(record.recordType)}
                                                <span className="text-sm text-gray-500">
                                                    {new Date(record.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h4 className="font-semibold text-lg mb-1">{record.recordType}</h4>
                                            <p className="text-gray-700 whitespace-pre-wrap">{record.description}</p>
                                        </div>
                                        {record.attachmentUrl && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-blue-600"
                                                onClick={() => window.open(record.attachmentUrl!, "_blank")}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Download
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
