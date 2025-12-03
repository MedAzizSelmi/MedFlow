"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, X, User, Mail, Phone, Calendar } from "lucide-react"

interface Patient {
    id: string
    dateOfBirth: string
    gender: string | null
    bloodType: string | null
    allergies: string | null
    emergencyContact: string | null
    emergencyPhone: string | null
    insuranceProvider: string | null
    insuranceNumber: string | null
    user: {
        id: string
        email: string
        firstName: string
        lastName: string
        phone: string | null
        isActive: boolean
    }
}

export default function ReceptionPatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [form, setForm] = useState({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        password: "",
        dateOfBirth: "",
        gender: "",
        bloodType: "",
        allergies: "",
        emergencyContact: "",
        emergencyPhone: "",
        insuranceProvider: "",
        insuranceNumber: "",
    })

    useEffect(() => {
        fetchPatients()
    }, [])

    const fetchPatients = async () => {
        try {
            const res = await fetch("/api/receptionist/patients")
            if (res.ok) {
                const data = await res.json()
                setPatients(data)
            }
        } catch (error) {
            console.error("Error fetching patients:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const res = await fetch("/api/receptionist/patients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to register patient")
            }

            await fetchPatients()
            resetForm()
            alert("Patient registered successfully!")
        } catch (error: any) {
            console.error("Error registering patient:", error)
            alert(error.message || "Failed to register patient")
        }
    }

    const resetForm = () => {
        setForm({
            email: "",
            firstName: "",
            lastName: "",
            phone: "",
            password: "",
            dateOfBirth: "",
            gender: "",
            bloodType: "",
            allergies: "",
            emergencyContact: "",
            emergencyPhone: "",
            insuranceProvider: "",
            insuranceNumber: "",
        })
        setShowForm(false)
    }

    const filteredPatients = patients.filter(
        (patient) =>
            searchTerm === "" ||
            patient.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return <div className="text-center py-12">Loading patients...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Patients</h1>
                    <p className="text-gray-600 mt-1">Register and manage patient profiles</p>
                </div>
                {!showForm && (
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Register Patient
                    </Button>
                )}
            </div>

            {showForm && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Register New Patient</CardTitle>
                            <Button variant="ghost" size="sm" onClick={resetForm}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>First Name *</Label>
                                        <Input
                                            value={form.firstName}
                                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Last Name *</Label>
                                        <Input
                                            value={form.lastName}
                                            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email *</Label>
                                        <Input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Password *</Label>
                                        <Input
                                            type="password"
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            placeholder="Default: patient123"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date of Birth *</Label>
                                        <Input
                                            type="date"
                                            value={form.dateOfBirth}
                                            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Medical Information */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Medical Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Gender</Label>
                                        <Select value={form.gender} onValueChange={(value) => setForm({ ...form, gender: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Blood Type</Label>
                                        <Select value={form.bloodType} onValueChange={(value) => setForm({ ...form, bloodType: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select blood type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="O+">O+</SelectItem>
                                                <SelectItem value="O-">O-</SelectItem>
                                                <SelectItem value="A+">A+</SelectItem>
                                                <SelectItem value="A-">A-</SelectItem>
                                                <SelectItem value="B+">B+</SelectItem>
                                                <SelectItem value="B-">B-</SelectItem>
                                                <SelectItem value="AB+">AB+</SelectItem>
                                                <SelectItem value="AB-">AB-</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Allergies</Label>
                                        <Input
                                            value={form.allergies}
                                            onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                                            placeholder="Any known allergies"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Emergency Contact</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Contact Name</Label>
                                        <Input
                                            value={form.emergencyContact}
                                            onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contact Phone</Label>
                                        <Input
                                            value={form.emergencyPhone}
                                            onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Insurance */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Insurance Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Insurance Provider</Label>
                                        <Input
                                            value={form.insuranceProvider}
                                            onChange={(e) => setForm({ ...form, insuranceProvider: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Insurance Number</Label>
                                        <Input
                                            value={form.insuranceNumber}
                                            onChange={(e) => setForm({ ...form, insuranceNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                    Register Patient
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
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Patients List */}
            <Card>
                <CardHeader>
                    <CardTitle>Patients ({filteredPatients.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredPatients.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>No patients found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredPatients.map((patient) => (
                                <div key={patient.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {patient.user.firstName} {patient.user.lastName}
                                                </h3>
                                                <p className="text-sm text-gray-600">{patient.user.email}</p>
                                            </div>
                                        </div>
                                        {patient.user.isActive && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            <span>{patient.user.phone || "N/A"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                                        </div>
                                        {patient.bloodType && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <span className="font-medium">Blood Type:</span>
                                                <span>{patient.bloodType}</span>
                                            </div>
                                        )}
                                    </div>

                                    {(patient.allergies || patient.emergencyContact) && (
                                        <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                                            {patient.allergies && (
                                                <div>
                                                    <span className="font-medium text-gray-700">Allergies: </span>
                                                    <span className="text-red-600">{patient.allergies}</span>
                                                </div>
                                            )}
                                            {patient.emergencyContact && (
                                                <div>
                                                    <span className="font-medium text-gray-700">Emergency Contact: </span>
                                                    <span className="text-gray-600">
                                                        {patient.emergencyContact} - {patient.emergencyPhone}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
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
