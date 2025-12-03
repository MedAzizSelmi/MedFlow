"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, Search, X, Download, Upload, Loader2 } from "lucide-react"

interface MedicalRecord {
    id: string
    recordType: string
    description: string
    attachmentUrl: string | null
    createdAt: string
    patient: {
        id: string
        user: {
            firstName: string
            lastName: string
            email: string
        }
    }
}

interface Patient {
    id: string
    user: {
        firstName: string
        lastName: string
        email: string
        phone: string | null
    }
}

const recordTypes = [
    "Diagnosis",
    "Lab Result",
    "Imaging",
    "Prescription",
    "Consultation Note",
    "Surgery Report",
    "Other"
]

export default function DoctorMedicalRecordsPage() {
    const [records, setRecords] = useState<MedicalRecord[]>([])
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedPatient, setSelectedPatient] = useState<string>("")
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [form, setForm] = useState({
        patientId: "",
        recordType: "",
        description: "",
        attachmentUrl: "",
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [recordsRes, patientsRes] = await Promise.all([
                fetch("/api/doctors/medical-records"),
                fetch("/api/doctors/patients"),
            ])

            if (recordsRes.ok) {
                const recordsData = await recordsRes.json()
                setRecords(recordsData)
            }

            if (patientsRes.ok) {
                const patientsData = await patientsRes.json()
                setPatients(patientsData)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setSelectedFile(file)
        setUploading(true)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const res = await fetch("/api/uploads", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Upload failed")
            }

            const data = await res.json()
            setForm({ ...form, attachmentUrl: data.url })
            alert("File uploaded successfully!")
        } catch (error: any) {
            console.error("Upload error:", error)
            alert(error.message || "Failed to upload file")
            setSelectedFile(null)
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const url = "/api/doctors/medical-records"
            const method = editingRecord ? "PUT" : "POST"
            const body = editingRecord
                ? { id: editingRecord.id, ...form }
                : form

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })

            if (!res.ok) throw new Error("Failed to save record")

            await fetchData()
            resetForm()
            alert("Medical record saved successfully!")
        } catch (error) {
            console.error("Error saving record:", error)
            alert("Failed to save medical record")
        }
    }

    const resetForm = () => {
        setForm({
            patientId: "",
            recordType: "",
            description: "",
            attachmentUrl: "",
        })
        setSelectedFile(null)
        setEditingRecord(null)
        setShowForm(false)
    }

    const handleEdit = (record: MedicalRecord) => {
        setForm({
            patientId: record.patient.id,
            recordType: record.recordType,
            description: record.description,
            attachmentUrl: record.attachmentUrl || "",
        })
        setEditingRecord(record)
        setShowForm(true)
    }

    const filteredRecords = records.filter((record) => {
        const matchesSearch =
            searchTerm === "" ||
            record.patient.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.patient.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.recordType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.description.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesPatient = selectedPatient === "" || selectedPatient === "all" || record.patient.id === selectedPatient

        return matchesSearch && matchesPatient
    })

    if (loading) {
        return <div className="text-center py-12">Loading medical records...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Medical Records</h1>
                    <p className="text-gray-600 mt-1">View and manage patient medical records</p>
                </div>
                {!showForm && (
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Record
                    </Button>
                )}
            </div>

            {showForm && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{editingRecord ? "Edit Medical Record" : "New Medical Record"}</CardTitle>
                            <Button variant="ghost" size="sm" onClick={resetForm}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="patientId">Patient *</Label>
                                    <Select
                                        value={form.patientId}
                                        onValueChange={(value) => setForm({ ...form, patientId: value })}
                                        disabled={!!editingRecord}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select patient" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {patients.map((patient) => (
                                                <SelectItem key={patient.id} value={patient.id}>
                                                    {patient.user.firstName} {patient.user.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="recordType">Record Type *</Label>
                                    <Select
                                        value={form.recordType}
                                        onValueChange={(value) => setForm({ ...form, recordType: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {recordTypes.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Enter detailed description"
                                    rows={5}
                                    required
                                />
                            </div>

                            {/* File Upload Section - UPDATED */}
                            <div className="space-y-2">
                                <Label htmlFor="attachment">Attach File (Optional)</Label>
                                <div className="flex items-center gap-3">
                                    <label
                                        htmlFor="file-upload"
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Uploading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                <span>Choose File</span>
                                            </>
                                        )}
                                    </label>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                                        onChange={handleFileSelect}
                                        disabled={uploading}
                                        className="hidden"
                                    />
                                    {selectedFile && (
                                        <span className="text-sm text-gray-600">
                                            ✓ {selectedFile.name}
                                        </span>
                                    )}
                                    {form.attachmentUrl && !selectedFile && (
                                        <a
                                            href={form.attachmentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            View attached file
                                        </a>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Accepted: PDF, JPG, PNG, GIF, DOC, DOCX (Max 10MB)
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={uploading}>
                                    {editingRecord ? "Update Record" : "Create Record"}
                                </Button>
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

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
                                    placeholder="Search by patient, type, or description..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Filter by Patient</Label>
                            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All patients" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All patients</SelectItem>
                                    {patients.map((patient) => (
                                        <SelectItem key={patient.id} value={patient.id}>
                                            {patient.user.firstName} {patient.user.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Records List */}
            <Card>
                <CardHeader>
                    <CardTitle>Records ({filteredRecords.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredRecords.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>No medical records found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRecords.map((record) => (
                                <div key={record.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {record.patient.user.firstName} {record.patient.user.lastName}
                                            </h3>
                                            <p className="text-sm text-gray-600">{record.patient.user.email}</p>
                                            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                {record.recordType}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">
                                                {new Date(record.createdAt).toLocaleDateString()}
                                            </p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(record)}
                                                className="mt-2"
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Description:</p>
                                            <p className="text-gray-900 whitespace-pre-wrap">{record.description}</p>
                                        </div>

                                        {record.attachmentUrl && (
                                            <div className="flex items-center gap-2 mt-3 p-3 bg-blue-50 rounded">
                                                <Download className="w-4 h-4 text-blue-600" />
                                                <a
                                                    href={record.attachmentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-sm font-medium"
                                                >
                                                    Download Attachment
                                                </a>
                                            </div>
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
