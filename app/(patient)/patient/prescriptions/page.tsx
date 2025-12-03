"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pill, Calendar, User, Download, Printer, Search } from "lucide-react"
import jsPDF from "jspdf"

interface Prescription {
    id: string
    medication: string
    dosage: string
    frequency: string
    duration: string
    instructions: string | null
    status: string
    startDate: string
    endDate: string | null
    createdAt: string
    consultation: {
        doctor: {
            user: {
                firstName: string
                lastName: string
            }
            specialization: string | null
        }
        diagnosis: string
        consultationDate: string
    } | null
}

export default function PatientPrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
    const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("all")
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchPrescriptions()
    }, [])

    useEffect(() => {
        filterPrescriptions()
    }, [prescriptions, statusFilter, searchTerm])

    const fetchPrescriptions = async () => {
        try {
            const res = await fetch("/api/patient/prescriptions")
            if (res.ok) {
                const data = await res.json()
                setPrescriptions(data)
            }
        } catch (error) {
            console.error("Error fetching prescriptions:", error)
        } finally {
            setLoading(false)
        }
    }

    const filterPrescriptions = () => {
        let filtered = prescriptions

        if (statusFilter !== "all") {
            filtered = filtered.filter((p) => p.status === statusFilter)
        }

        if (searchTerm) {
            filtered = filtered.filter(
                (p) =>
                    p.medication.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (p.consultation?.diagnosis || "").toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredPrescriptions(filtered)
    }

    const downloadPrescription = (prescription: Prescription) => {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(24)
        doc.setFont("helvetica", "bold")
        doc.text("PRESCRIPTION", 105, 25, { align: "center" })

        // Prescription Date
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`, 20, 40)

        // Doctor Info
        if (prescription.consultation) {
            doc.setFontSize(12)
            doc.setFont("helvetica", "bold")
            doc.text("Prescribed by:", 20, 55)
            doc.setFont("helvetica", "normal")
            doc.setFontSize(11)
            doc.text(
                `Dr. ${prescription.consultation.doctor.user.firstName} ${prescription.consultation.doctor.user.lastName}`,
                20,
                62
            )
            if (prescription.consultation.doctor.specialization) {
                doc.setFontSize(10)
                doc.text(prescription.consultation.doctor.specialization, 20, 68)
            }

            // Diagnosis
            doc.setFontSize(12)
            doc.setFont("helvetica", "bold")
            doc.text("Diagnosis:", 20, 82)
            doc.setFont("helvetica", "normal")
            doc.setFontSize(10)
            const diagnosisLines = doc.splitTextToSize(prescription.consultation.diagnosis, 170)
            doc.text(diagnosisLines, 20, 89)
        }

        // Prescription Symbol (Rx)
        doc.setFontSize(32)
        doc.setFont("helvetica", "bold")
        doc.text("℞", 20, 115)

        // Medication Details
        const startY = 120
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text(prescription.medication, 20, startY)

        doc.setFontSize(11)
        doc.setFont("helvetica", "normal")

        // Dosage
        doc.text("Dosage:", 20, startY + 10)
        doc.text(prescription.dosage, 50, startY + 10)

        // Frequency
        doc.text("Frequency:", 20, startY + 18)
        doc.text(prescription.frequency, 50, startY + 18)

        // Duration
        doc.text("Duration:", 20, startY + 26)
        doc.text(prescription.duration, 50, startY + 26)

        // Instructions
        if (prescription.instructions) {
            doc.setFont("helvetica", "bold")
            doc.text("Instructions:", 20, startY + 38)
            doc.setFont("helvetica", "normal")
            const instructionsLines = doc.splitTextToSize(prescription.instructions, 170)
            doc.text(instructionsLines, 20, startY + 45)
        }

        // Duration Info
        const durationY = startY + (prescription.instructions ? 65 : 45)
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`Start Date: ${new Date(prescription.startDate).toLocaleDateString()}`, 20, durationY)
        if (prescription.endDate) {
            doc.text(`End Date: ${new Date(prescription.endDate).toLocaleDateString()}`, 20, durationY + 7)
        }

        // Status Badge
        doc.setFontSize(12)
        if (prescription.status === "ACTIVE") {
            doc.setTextColor(34, 197, 94)
            doc.text("✓ ACTIVE", 150, durationY)
        } else if (prescription.status === "COMPLETED") {
            doc.setTextColor(100, 100, 100)
            doc.text("COMPLETED", 145, durationY)
        } else {
            doc.setTextColor(239, 68, 68)
            doc.text("EXPIRED", 150, durationY)
        }

        // Footer
        doc.setTextColor(128, 128, 128)
        doc.setFontSize(9)
        doc.text("This is a computer-generated prescription.", 105, 280, { align: "center" })
        doc.text("Please consult your doctor for any questions or concerns.", 105, 285, { align: "center" })

        // Save PDF
        const fileName = `Prescription-${prescription.medication.replace(/\s+/g, "_")}-${new Date().toISOString().split("T")[0]}.pdf`
        doc.save(fileName)
    }

    const printPrescription = (prescription: Prescription) => {
        const printWindow = window.open("", "_blank")
        if (!printWindow) {
            alert("Please allow pop-ups to print prescriptions")
            return
        }

        const doctorName = prescription.consultation
            ? `Dr. ${prescription.consultation.doctor.user.firstName} ${prescription.consultation.doctor.user.lastName}`
            : "N/A"
        const specialization = prescription.consultation?.doctor.specialization || ""
        const diagnosis = prescription.consultation?.diagnosis || "N/A"

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Prescription - ${prescription.medication}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 800px;
                        margin: 40px auto;
                        padding: 20px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 3px solid #2563eb;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        margin: 0;
                        color: #2563eb;
                        font-size: 32px;
                    }
                    .date {
                        text-align: right;
                        color: #666;
                        margin-bottom: 20px;
                    }
                    .doctor-info {
                        background: #f3f4f6;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    }
                    .doctor-info h3 {
                        margin: 0 0 5px 0;
                        color: #1f2937;
                    }
                    .section {
                        margin-bottom: 20px;
                    }
                    .section-title {
                        font-weight: bold;
                        color: #374151;
                        margin-bottom: 8px;
                    }
                    .rx-symbol {
                        font-size: 48px;
                        color: #2563eb;
                        margin: 20px 0;
                    }
                    .medication {
                        background: #dbeafe;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    .medication h2 {
                        margin: 0 0 15px 0;
                        color: #1e40af;
                    }
                    .detail-row {
                        display: flex;
                        margin-bottom: 10px;
                    }
                    .detail-label {
                        font-weight: bold;
                        width: 150px;
                        color: #374151;
                    }
                    .detail-value {
                        color: #1f2937;
                    }
                    .instructions {
                        background: #fef3c7;
                        padding: 15px;
                        border-radius: 8px;
                        margin-top: 20px;
                        border-left: 4px solid #f59e0b;
                    }
                    .status {
                        display: inline-block;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-weight: bold;
                        margin-top: 10px;
                    }
                    .status.active {
                        background: #dcfce7;
                        color: #16a34a;
                    }
                    .status.completed {
                        background: #e5e7eb;
                        color: #6b7280;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #e5e7eb;
                        text-align: center;
                        color: #6b7280;
                        font-size: 12px;
                    }
                    @media print {
                        body {
                            margin: 0;
                            padding: 20px;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>PRESCRIPTION</h1>
                </div>
                
                <div class="date">
                    Date: ${new Date(prescription.createdAt).toLocaleDateString()}
                </div>

                <div class="doctor-info">
                    <h3>Prescribed by: ${doctorName}</h3>
                    ${specialization ? `<p style="margin: 5px 0; color: #6b7280;">${specialization}</p>` : ""}
                </div>

                ${prescription.consultation ? `
                <div class="section">
                    <div class="section-title">Diagnosis:</div>
                    <div>${diagnosis}</div>
                </div>
                ` : ""}

                <div class="rx-symbol">℞</div>

                <div class="medication">
                    <h2>${prescription.medication}</h2>
                    
                    <div class="detail-row">
                        <span class="detail-label">Dosage:</span>
                        <span class="detail-value">${prescription.dosage}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Frequency:</span>
                        <span class="detail-value">${prescription.frequency}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value">${prescription.duration}</span>
                    </div>

                    <div class="detail-row">
                        <span class="detail-label">Start Date:</span>
                        <span class="detail-value">${new Date(prescription.startDate).toLocaleDateString()}</span>
                    </div>

                    ${prescription.endDate ? `
                    <div class="detail-row">
                        <span class="detail-label">End Date:</span>
                        <span class="detail-value">${new Date(prescription.endDate).toLocaleDateString()}</span>
                    </div>
                    ` : ""}

                    <span class="status ${prescription.status.toLowerCase()}">
                        ${prescription.status}
                    </span>
                </div>

                ${prescription.instructions ? `
                <div class="instructions">
                    <div class="section-title">⚠️ Special Instructions:</div>
                    <div>${prescription.instructions}</div>
                </div>
                ` : ""}

                <div class="footer">
                    <p>This is a computer-generated prescription.</p>
                    <p>Please consult your doctor for any questions or concerns.</p>
                </div>

                <div class="no-print" style="margin-top: 30px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
                        Print Prescription
                    </button>
                </div>
            </body>
            </html>
        `)

        printWindow.document.close()
    }

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; className: string }> = {
            ACTIVE: { label: "Active", className: "bg-green-100 text-green-800" },
            COMPLETED: { label: "Completed", className: "bg-gray-100 text-gray-800" },
            EXPIRED: { label: "Expired", className: "bg-red-100 text-red-800" },
        }
        const { label, className } = config[status] || config.ACTIVE
        return <Badge className={className}>{label}</Badge>
    }

    if (loading) {
        return <div className="text-center py-12">Loading prescriptions...</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Prescriptions</h1>
                <p className="text-gray-600 mt-1">View and download your medication prescriptions</p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Search & Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search by medication or diagnosis..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="EXPIRED">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Prescriptions List */}
            <Card>
                <CardHeader>
                    <CardTitle>Prescriptions ({filteredPrescriptions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredPrescriptions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Pill className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>No prescriptions found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredPrescriptions.map((prescription) => (
                                <div key={prescription.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <Pill className="w-6 h-6 text-blue-600" />
                                                <h3 className="font-semibold text-lg">{prescription.medication}</h3>
                                            </div>
                                            {prescription.consultation && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Prescribed by Dr. {prescription.consultation.doctor.user.firstName}{" "}
                                                    {prescription.consultation.doctor.user.lastName}
                                                </p>
                                            )}
                                        </div>
                                        {getStatusBadge(prescription.status)}
                                    </div>

                                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-700">Dosage:</span>
                                                <span className="ml-2">{prescription.dosage}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Frequency:</span>
                                                <span className="ml-2">{prescription.frequency}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Duration:</span>
                                                <span className="ml-2">{prescription.duration}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Start Date:</span>
                                                <span className="ml-2">
                                                    {new Date(prescription.startDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {prescription.instructions && (
                                        <div className="bg-yellow-50 rounded-lg p-3 mb-3 border-l-4 border-yellow-400">
                                            <p className="font-medium text-gray-700 text-sm mb-1">Instructions:</p>
                                            <p className="text-gray-900 text-sm">{prescription.instructions}</p>
                                        </div>
                                    )}

                                    {prescription.consultation && (
                                        <div className="mb-3">
                                            <p className="font-medium text-gray-700 text-sm">Diagnosis:</p>
                                            <p className="text-gray-900 text-sm">{prescription.consultation.diagnosis}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700"
                                            onClick={() => downloadPrescription(prescription)}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => printPrescription(prescription)}
                                        >
                                            <Printer className="w-4 h-4 mr-2" />
                                            Print
                                        </Button>
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
