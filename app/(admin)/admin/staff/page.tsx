"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Search, Trash2, AlertCircle, Clock, Plus } from "lucide-react"
import Link from "next/link"

interface StaffMember {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    phone: string | null
    isActive: boolean
}

export default function AdminStaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        password: "",
        role: "DOCTOR",
        specialization: "",
        licenseNumber: "",
        experience: "",
        department: "",
        // Availability fields
        availableFrom: "09:00",
        availableTo: "17:00",
        availableDays: [] as string[],
    })

    const daysOfWeek = [
        { value: "MONDAY", label: "Mon" },
        { value: "TUESDAY", label: "Tue" },
        { value: "WEDNESDAY", label: "Wed" },
        { value: "THURSDAY", label: "Thu" },
        { value: "FRIDAY", label: "Fri" },
        { value: "SATURDAY", label: "Sat" },
        { value: "SUNDAY", label: "Sun" },
    ]

    useEffect(() => {
        fetchStaff()
    }, [])

    const fetchStaff = async () => {
        try {
            const res = await fetch("/api/admin/staff")
            if (res.ok) {
                const data = await res.json()
                setStaff(data)
            }
        } catch (error) {
            console.error("Error fetching staff:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate doctor availability
        if (formData.role === "DOCTOR" && formData.availableDays.length === 0) {
            alert("Please select at least one available day for the doctor")
            return
        }

        try {
            const res = await fetch("/api/admin/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                const error = await res.json()
                alert(error.error || "Failed to create staff")
                return
            }

            alert("Staff member created successfully!")
            setShowCreateForm(false)
            setFormData({
                email: "",
                firstName: "",
                lastName: "",
                phone: "",
                password: "",
                role: "DOCTOR",
                specialization: "",
                licenseNumber: "",
                experience: "",
                department: "",
                availableFrom: "09:00",
                availableTo: "17:00",
                availableDays: [],
            })
            await fetchStaff()
        } catch (error) {
            console.error("Error creating staff:", error)
            alert("Failed to create staff member")
        }
    }

    const handleDeleteStaff = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
            return
        }

        setDeletingId(userId)

        try {
            const res = await fetch(`/api/admin/staff?id=${userId}`, {
                method: "DELETE",
            })

            if (!res.ok) {
                const error = await res.json()
                alert(error.error || "Failed to delete staff member")
                return
            }

            alert("Staff member deleted successfully!")
            await fetchStaff()
        } catch (error) {
            console.error("Error deleting staff:", error)
            alert("Failed to delete staff member")
        } finally {
            setDeletingId(null)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleRoleChange = (value: string) => {
        setFormData({ ...formData, role: value })
    }

    const toggleDay = (day: string) => {
        setFormData(prev => ({
            ...prev,
            availableDays: prev.availableDays.includes(day)
                ? prev.availableDays.filter(d => d !== day)
                : [...prev.availableDays, day]
        }))
    }

    const filteredStaff = staff.filter((member) => {
        const matchesSearch =
            searchTerm === "" ||
            member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesRole = roleFilter === "all" || member.role === roleFilter

        return matchesSearch && matchesRole
    })

    const getRoleBadge = (role: string) => {
        const config: Record<string, { label: string; className: string }> = {
            DOCTOR: { label: "Doctor", className: "bg-blue-100 text-blue-800" },
            RECEPTIONIST: { label: "Receptionist", className: "bg-green-100 text-green-800" },
            ADMIN: { label: "Admin", className: "bg-purple-100 text-purple-800" },
        }
        const { label, className } = config[role] || { label: role, className: "bg-gray-100 text-gray-800" }
        return <Badge className={className}>{label}</Badge>
    }

    if (loading) return <div className="text-center py-12">Loading staff...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Staff Management</h1>
                    <p className="text-gray-600 mt-1">Manage doctors and receptionists</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/staff/doctors/new">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Doctor
                        </Button>
                    </Link>
                    <Link href="/admin/staff/receptionists/new">
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Receptionist
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Alternative: Quick Create Form (Optional - can be removed if you prefer the separate pages) */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Quick Create</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCreateForm(!showCreateForm)}
                        >
                            {showCreateForm ? "Hide" : "Show"} Form
                        </Button>
                    </div>
                </CardHeader>
                {showCreateForm && (
                    <CardContent>
                        <form onSubmit={handleCreateStaff} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>First Name *</Label>
                                    <Input
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name *</Label>
                                    <Input
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email *</Label>
                                    <Input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input name="phone" value={formData.phone} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password *</Label>
                                    <Input
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role *</Label>
                                    <Select value={formData.role} onValueChange={handleRoleChange}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DOCTOR">Doctor</SelectItem>
                                            <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {formData.role === "DOCTOR" && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                                        <div className="space-y-2">
                                            <Label>Specialization</Label>
                                            <Input
                                                name="specialization"
                                                value={formData.specialization}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>License Number</Label>
                                            <Input
                                                name="licenseNumber"
                                                value={formData.licenseNumber}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Years of Experience</Label>
                                            <Input
                                                name="experience"
                                                type="number"
                                                value={formData.experience}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Availability Section */}
                                    <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-5 h-5 text-blue-600" />
                                            <h3 className="font-semibold text-blue-900">Working Hours</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Available From *</Label>
                                                <Input
                                                    name="availableFrom"
                                                    type="time"
                                                    value={formData.availableFrom}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Available To *</Label>
                                                <Input
                                                    name="availableTo"
                                                    type="time"
                                                    value={formData.availableTo}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Available Days *</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {daysOfWeek.map((day) => (
                                                    <button
                                                        key={day.value}
                                                        type="button"
                                                        onClick={() => toggleDay(day.value)}
                                                        className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                                                            formData.availableDays.includes(day.value)
                                                                ? "bg-blue-600 text-white border-blue-600"
                                                                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                                                        }`}
                                                    >
                                                        {day.label}
                                                    </button>
                                                ))}
                                            </div>
                                            {formData.availableDays.length === 0 && (
                                                <p className="text-sm text-red-600">Please select at least one day</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {formData.role === "RECEPTIONIST" && (
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <Input
                                            name="department"
                                            value={formData.department}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                    Create Staff Member
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                )}
            </Card>

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
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Role Filter</Label>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="DOCTOR">Doctors</SelectItem>
                                    <SelectItem value="RECEPTIONIST">Receptionists</SelectItem>
                                    <SelectItem value="ADMIN">Admins</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredStaff.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No staff members found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredStaff.map((member) => (
                                <div
                                    key={member.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow flex justify-between items-center"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-lg">
                                                {member.firstName} {member.lastName}
                                            </h3>
                                            {getRoleBadge(member.role)}
                                            {!member.isActive && (
                                                <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">📧 {member.email}</p>
                                        {member.phone && (
                                            <p className="text-sm text-gray-600">📞 {member.phone}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteStaff(member.id, `${member.firstName} ${member.lastName}`)}
                                            disabled={deletingId === member.id}
                                        >
                                            {deletingId === member.id ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-yellow-900">Important Notes:</p>
                            <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                                <li>You cannot delete your own admin account</li>
                                <li>Deleting a staff member will remove all their associated data</li>
                                <li>This action cannot be undone</li>
                                <li>For detailed forms, use the "Add Doctor" or "Add Receptionist" buttons above</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
