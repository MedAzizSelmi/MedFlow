"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Save, X, Building2, User, Lock, Mail, Phone as PhoneIcon } from "lucide-react"

interface AdminProfile {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string | null
    role: string
    clinicId: string | null
    profileImage: string | null
    clinic: {
        id: string
        name: string
        address: string
        city: string
        postalCode: string
        phone: string
        email: string
        licenseNumber: string
        logo: string | null
    } | null
}

export default function AdminProfilePage() {
    const { data: session } = useSession()
    const [profile, setProfile] = useState<AdminProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState<Partial<AdminProfile>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })
    const [passwordError, setPasswordError] = useState("")
    const [passwordSuccess, setPasswordSuccess] = useState("")
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/admin/profile")
                if (!res.ok) throw new Error("Failed to fetch profile")
                const data = await res.json()
                setProfile(data)
                setFormData(data)
            } catch (error) {
                console.error("Failed to fetch profile:", error)
                setError("Failed to load profile")
            } finally {
                setIsLoading(false)
            }
        }

        if (session) fetchProfile()
    }, [session])

    const handleEdit = () => {
        setFormData(profile || {})
        setIsEditing(true)
        setError("")
        setSuccess("")
    }

    const handleCancel = () => {
        setFormData(profile || {})
        setIsEditing(false)
        setError("")
        setSuccess("")
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            setError("")
            setSuccess("")

            const res = await fetch("/api/admin/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                }),
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || "Failed to update profile")
            }

            const updatedData = await res.json()
            setProfile({ ...profile!, ...updatedData })
            setIsEditing(false)
            setSuccess("Profile updated successfully!")
            setTimeout(() => setSuccess(""), 3000)
        } catch (error: any) {
            console.error("Failed to save profile:", error)
            setError(error.message || "Failed to update profile")
        } finally {
            setIsSaving(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordError("")
        setPasswordSuccess("")

        // Validation
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordError("All fields are required")
            return
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters")
            return
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("New passwords do not match")
            return
        }

        try {
            setIsChangingPassword(true)

            const res = await fetch("/api/admin/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || "Failed to change password")
            }

            setPasswordSuccess("Password changed successfully!")
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            })
            setTimeout(() => setPasswordSuccess(""), 3000)
        } catch (error: any) {
            setPasswordError(error.message || "Failed to change password")
        } finally {
            setIsChangingPassword(false)
        }
    }

    if (isLoading) {
        return <div className="text-center py-12">Loading profile...</div>
    }

    if (!profile) {
        return <div className="text-center py-12 text-red-600">Profile not found</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Profile</h1>
                <p className="text-gray-600 mt-1">Manage your personal information and settings</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                    <TabsTrigger value="profile">Profile Information</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Personal Information</h2>
                        {!isEditing ? (
                            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleEdit}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Profile
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? "Saving..." : "Save"}
                                </Button>
                                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-green-800 text-sm">{success}</p>
                        </div>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Account Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name *</Label>
                                            <Input
                                                id="firstName"
                                                value={formData.firstName || ""}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                placeholder="Enter first name"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name *</Label>
                                            <Input
                                                id="lastName"
                                                value={formData.lastName || ""}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                placeholder="Enter last name"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                        <p className="text-xs text-gray-500">Email cannot be changed</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone || ""}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Enter phone number"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Input
                                            id="role"
                                            value={profile.role}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <User className="w-5 h-5 text-gray-400 mt-1" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600">Full Name</p>
                                            <p className="text-lg font-medium">
                                                {profile.firstName} {profile.lastName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Mail className="w-5 h-5 text-gray-400 mt-1" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600">Email Address</p>
                                            <p className="text-lg font-medium">{profile.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <PhoneIcon className="w-5 h-5 text-gray-400 mt-1" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600">Phone Number</p>
                                            <p className="text-lg font-medium">{profile.phone || "Not provided"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Lock className="w-5 h-5 text-gray-400 mt-1" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600">Role</p>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mt-1">
                                                {profile.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Clinic Information */}
                    {profile.clinic ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    Clinic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Clinic Name</p>
                                            <p className="text-lg font-medium mt-1">{profile.clinic.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">License Number</p>
                                            <p className="text-lg font-medium mt-1">{profile.clinic.licenseNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Clinic Email</p>
                                            <p className="text-lg font-medium mt-1">{profile.clinic.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Clinic Phone</p>
                                            <p className="text-lg font-medium mt-1">{profile.clinic.phone}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-sm text-gray-600">Address</p>
                                            <p className="text-lg font-medium mt-1">
                                                {profile.clinic.address}, {profile.clinic.city} {profile.clinic.postalCode}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-dashed border-2">
                            <CardContent className="pt-6">
                                <div className="text-center py-8">
                                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Clinic Associated</h3>
                                    <p className="text-gray-600 mb-4">
                                        You haven't created or been assigned to a clinic yet
                                    </p>
                                    <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                                        <a href="/admin/clinic">Set Up Clinic</a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold">Change Password</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Update your password to keep your account secure
                        </p>
                    </div>

                    {passwordError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-800 text-sm">{passwordError}</p>
                        </div>
                    )}

                    {passwordSuccess && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-green-800 text-sm">{passwordSuccess}</p>
                        </div>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="w-5 h-5" />
                                Password Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password *</Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                        }
                                        placeholder="Enter current password"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password *</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                                        }
                                        placeholder="Enter new password (min. 6 characters)"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                        }
                                        placeholder="Confirm new password"
                                        required
                                    />
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        disabled={isChangingPassword}
                                    >
                                        {isChangingPassword ? "Changing Password..." : "Change Password"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Security Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Tips</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span>Use a strong password with at least 8 characters</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span>Include uppercase, lowercase, numbers, and special characters</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span>Don't reuse passwords from other accounts</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span>Change your password regularly</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
