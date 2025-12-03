"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Building, Save } from "lucide-react"

interface ReceptionistProfile {
    id: string
    department: string | null
    user: {
        id: string
        email: string
        firstName: string
        lastName: string
        phone: string | null
        profileImage: string | null
        clinic: {
            name: string
            address: string
            city: string
            phone: string
        }
    }
}

export default function ReceptionistProfilePage() {
    const { data: session } = useSession()
    const [profile, setProfile] = useState<ReceptionistProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        department: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/receptionist/profile")
            if (res.ok) {
                const data = await res.json()
                setProfile(data)
                setForm({
                    firstName: data.user.firstName,
                    lastName: data.user.lastName,
                    phone: data.user.phone || "",
                    department: data.department || "",
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                })
            }
        } catch (error) {
            console.error("Error fetching profile:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        // Validate password change
        if (form.newPassword) {
            if (!form.currentPassword) {
                alert("Please enter your current password")
                setSaving(false)
                return
            }
            if (form.newPassword !== form.confirmPassword) {
                alert("New passwords do not match")
                setSaving(false)
                return
            }
            if (form.newPassword.length < 6) {
                alert("New password must be at least 6 characters")
                setSaving(false)
                return
            }
        }

        try {
            const res = await fetch("/api/receptionist/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to update profile")
            }

            await fetchProfile()
            // Clear password fields
            setForm((prev) => ({
                ...prev,
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            }))
            alert("Profile updated successfully!")
        } catch (error: any) {
            console.error("Error updating profile:", error)
            alert(error.message || "Failed to update profile")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="text-center py-12">Loading profile...</div>
    }

    if (!profile) {
        return <div className="text-center py-12 text-red-600">Profile not found</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Profile</h1>
                <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
            </div>

            {/* Clinic Info */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-blue-600" />
                        <CardTitle>Clinic Information</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-600">Clinic Name:</p>
                            <p className="font-medium">{profile.user.clinic.name}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Phone:</p>
                            <p className="font-medium">{profile.user.clinic.phone}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-gray-600">Address:</p>
                            <p className="font-medium">
                                {profile.user.clinic.address}, {profile.user.clinic.city}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Form */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        <CardTitle>Personal Information</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
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
                                    <Label>Email</Label>
                                    <Input value={profile.user.email} disabled className="bg-gray-100" />
                                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        placeholder="+1234567890"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <Input
                                        value={form.department}
                                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                                        placeholder="e.g., Front Desk"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password Change */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Change Password</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Current Password</Label>
                                    <Input
                                        type="password"
                                        value={form.currentPassword}
                                        onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input
                                        type="password"
                                        value={form.newPassword}
                                        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirm New Password</Label>
                                    <Input
                                        type="password"
                                        value={form.confirmPassword}
                                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Leave blank to keep current password</p>
                        </div>

                        <div className="flex gap-3">
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
