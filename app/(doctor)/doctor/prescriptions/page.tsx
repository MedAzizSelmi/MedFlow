"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clipboard, Plus, Search, X, Pill } from "lucide-react"

interface Consultation {
    id: string
    diagnosis: string
    symptoms: string
    treatment: string
    notes: string | null
    followUpDate: string | null
    createdAt: string
    patient: {
        id: string
        user: {
            firstName: string
            lastName: string
            email: string
        }
    }
    appointment: {
        service: {
            name: string
        }
    }
    prescriptions: {
        id: string
        medication: string
        dosage: string
        frequency: string
        duration: string
        instructions: string | null
    }[]
}

interface Appointment {
    id: string
    appointmentDate: string
    patient: {
        id: string
        user: {
            firstName: string
            lastName: string
        }
    }
    service: {
        name: string
    }
}

export default function DoctorPrescriptionsPage() {
    const [consultations, setConsultations] = useState<Consultation[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [form, setForm] = useState({
        appointmentId: "",
        patientId: "",
        diagnosis: "",
        symptoms: "",
        treatment: "",
        notes: "",
        followUpDate: "",
        prescriptions: [
            {
                medication: "",
                dosage: "",
                frequency: "",
                duration: "",
                instructions: "",
            },
        ],
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [consultationsRes, appointmentsRes] = await Promise.all([
                fetch("/api/doctors/consultations"),
                fetch("/api/doctors/appointments"),
            ])

            if (consultationsRes.ok) {
                const data = await consultationsRes.json()
                setConsultations(data)
            }

            if (appointmentsRes.ok) {
                const data = await appointmentsRes.json()
                // Only show completed appointments that don't have consultations yet
                const completedAppointments = data.filter((apt: any) =>
                    apt.status === "COMPLETED" && !apt.consultation
                )
                setAppointments(completedAppointments)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAppointmentSelect = (appointmentId: string) => {
        const appointment = appointments.find(apt => apt.id === appointmentId)
        if (appointment) {
            setForm({
                ...form,
                appointmentId,
                patientId: appointment.patient.id,
            })
        }
    }

    const addPrescription = () => {
        setForm({
            ...form,
            prescriptions: [
                ...form.prescriptions,
                {
                    medication: "",
                    dosage: "",
                    frequency: "",
                    duration: "",
                    instructions: "",
                },
            ],
        })
    }

    const removePrescription = (index: number) => {
        const newPrescriptions = form.prescriptions.filter((_, i) => i !== index)
        setForm({ ...form, prescriptions: newPrescriptions })
    }

    const updatePrescription = (index: number, field: string, value: string) => {
        const newPrescriptions = [...form.prescriptions]
        newPrescriptions[index] = { ...newPrescriptions[index], [field]: value }
        setForm({ ...form, prescriptions: newPrescriptions })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const res = await fetch("/api/doctors/consultations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })

            if (!res.ok) throw new Error("Failed to create consultation")

            await fetchData()
            resetForm()
        } catch (error) {
            console.error("Error creating consultation:", error)
            alert("Failed to create consultation")
        }
    }

    const resetForm = () => {
        setForm({
            appointmentId: "",
            patientId: "",
            diagnosis: "",
            symptoms: "",
            treatment: "",
            notes: "",
            followUpDate: "",
            prescriptions: [
                {
                    medication: "",
                    dosage: "",
                    frequency: "",
                    duration: "",
                    instructions: "",
                },
            ],
        })
        setShowForm(false)
    }

    const filteredConsultations = consultations.filter((consultation) => {
        return (
            searchTerm === "" ||
            consultation.patient.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            consultation.patient.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            consultation.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })

    if (loading) {
        return <div className="text-center py-12">Loading consultations...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Consultations & Prescriptions</h1>
                    <p className="text-gray-600 mt-1">Create consultation notes and prescriptions</p>
                </div>
                {!showForm && (
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => setShowForm(true)}
                        disabled={appointments.length === 0}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Consultation
                    </Button>
                )}
            </div>

            {appointments.length === 0 && !showForm && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8 text-gray-500">
                            <Clipboard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>No completed appointments without consultations</p>
                            <p className="text-sm mt-2">Complete an appointment first to create a consultation</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {showForm && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>New Consultation</CardTitle>
                            <Button variant="ghost" size="sm" onClick={resetForm}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Appointment Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="appointmentId">Select Appointment *</Label>
                                <Select
                                    value={form.appointmentId}
                                    onValueChange={handleAppointmentSelect}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select completed appointment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {appointments.map((appointment) => (
                                            <SelectItem key={appointment.id} value={appointment.id}>
                                                {appointment.patient.user.firstName} {appointment.patient.user.lastName} -{" "}
                                                {appointment.service.name} ({new Date(appointment.appointmentDate).toLocaleDateString()})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Consultation Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="diagnosis">Diagnosis *</Label>
                                    <Input
                                        id="diagnosis"
                                        value={form.diagnosis}
                                        onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                                        placeholder="Enter diagnosis"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="followUpDate">Follow-up Date</Label>
                                    <Input
                                        id="followUpDate"
                                        type="date"
                                        value={form.followUpDate}
                                        onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="symptoms">Symptoms *</Label>
                                <Textarea
                                    id="symptoms"
                                    value={form.symptoms}
                                    onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                                    placeholder="Describe symptoms"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="treatment">Treatment Plan *</Label>
                                <Textarea
                                    id="treatment"
                                    value={form.treatment}
                                    onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                                    placeholder="Describe treatment plan"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Additional Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Any additional notes"
                                    rows={2}
                                />
                            </div>

                            {/* Prescriptions */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-lg font-semibold">Prescriptions</Label>
                                    <Button type="button" size="sm" variant="outline" onClick={addPrescription}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Prescription
                                    </Button>
                                </div>

                                {form.prescriptions.map((prescription, index) => (
                                    <Card key={index} className="bg-blue-50">
                                        <CardContent className="pt-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-medium">Prescription {index + 1}</h4>
                                                {form.prescriptions.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => removePrescription(index)}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Medication *</Label>
                                                    <Input
                                                        value={prescription.medication}
                                                        onChange={(e) => updatePrescription(index, "medication", e.target.value)}
                                                        placeholder="e.g., Amoxicillin"
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Dosage *</Label>
                                                    <Input
                                                        value={prescription.dosage}
                                                        onChange={(e) => updatePrescription(index, "dosage", e.target.value)}
                                                        placeholder="e.g., 500mg"
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Frequency *</Label>
                                                    <Input
                                                        value={prescription.frequency}
                                                        onChange={(e) => updatePrescription(index, "frequency", e.target.value)}
                                                        placeholder="e.g., 3 times per day"
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Duration *</Label>
                                                    <Input
                                                        value={prescription.duration}
                                                        onChange={(e) => updatePrescription(index, "duration", e.target.value)}
                                                        placeholder="e.g., 7 days"
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2 md:col-span-2">
                                                    <Label>Instructions</Label>
                                                    <Textarea
                                                        value={prescription.instructions}
                                                        onChange={(e) => updatePrescription(index, "instructions", e.target.value)}
                                                        placeholder="Additional instructions"
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                    Create Consultation
                                </Button>
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <Card>
                <CardHeader>
                    <CardTitle>Search</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search by patient name or diagnosis..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Consultations List */}
            <Card>
                <CardHeader>
                    <CardTitle>Consultations ({filteredConsultations.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredConsultations.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Clipboard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>No consultations found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredConsultations.map((consultation) => (
                                <div key={consultation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {consultation.patient.user.firstName} {consultation.patient.user.lastName}
                                            </h3>
                                            <p className="text-sm text-gray-600">{consultation.patient.user.email}</p>
                                            <p className="text-sm text-gray-600 mt-1">{consultation.appointment.service.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">
                                                {new Date(consultation.createdAt).toLocaleDateString()}
                                            </p>
                                            {consultation.followUpDate && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Follow-up: {new Date(consultation.followUpDate).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
                                                <p className="text-gray-900">{consultation.diagnosis}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Symptoms:</p>
                                            <p className="text-gray-900">{consultation.symptoms}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Treatment:</p>
                                            <p className="text-gray-900">{consultation.treatment}</p>
                                        </div>

                                        {consultation.notes && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Notes:</p>
                                                <p className="text-gray-900">{consultation.notes}</p>
                                            </div>
                                        )}

                                        {consultation.prescriptions.length > 0 && (
                                            <div className="mt-4 pt-4 border-t">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Pill className="w-5 h-5 text-blue-600" />
                                                    <p className="font-medium text-gray-900">Prescriptions ({consultation.prescriptions.length})</p>
                                                </div>
                                                <div className="space-y-3">
                                                    {consultation.prescriptions.map((prescription) => (
                                                        <div key={prescription.id} className="bg-blue-50 rounded-lg p-3">
                                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                                <div>
                                                                    <p className="font-medium text-gray-700">Medication:</p>
                                                                    <p className="text-gray-900 font-semibold">{prescription.medication}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-700">Dosage:</p>
                                                                    <p className="text-gray-900">{prescription.dosage}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-700">Frequency:</p>
                                                                    <p className="text-gray-900">{prescription.frequency}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-700">Duration:</p>
                                                                    <p className="text-gray-900">{prescription.duration}</p>
                                                                </div>
                                                                {prescription.instructions && (
                                                                    <div className="col-span-2">
                                                                        <p className="font-medium text-gray-700">Instructions:</p>
                                                                        <p className="text-gray-900">{prescription.instructions}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
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
