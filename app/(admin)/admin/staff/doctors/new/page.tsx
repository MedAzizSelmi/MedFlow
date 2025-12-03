"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"

export default function NewDoctorPage() {
    const router = useRouter()
    const [form, setForm] = useState({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        password: "",
        specialization: "",
        licenseNumber: "",
        experience: "0",
        bio: "",
        availableFrom: "09:00",
        availableTo: "17:00",
        availableDays: [] as string[],
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const daysOfWeek = [
        { value: "MONDAY", label: "Monday" },
        { value: "TUESDAY", label: "Tuesday" },
        { value: "WEDNESDAY", label: "Wednesday" },
        { value: "THURSDAY", label: "Thursday" },
        { value: "FRIDAY", label: "Friday" },
        { value: "SATURDAY", label: "Saturday" },
        { value: "SUNDAY", label: "Sunday" },
    ]

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

    const toggleDay = (day: string) => {
        setForm(prev => ({
            ...prev,
            availableDays: prev.availableDays.includes(day)
                ? prev.availableDays.filter(d => d !== day)
                : [...prev.availableDays, day]
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (form.availableDays.length === 0) {
            setError("Please select at least one available day")
            return
        }

        setLoading(true)
        setError("")
        try {
            const res = await fetch("/api/admin/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: form.email,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    phone: form.phone || null,
                    password: form.password || "password123",
                    role: "DOCTOR",
                    specialization: form.specialization,
                    licenseNumber: form.licenseNumber,
                    experience: Number(form.experience),
                    bio: form.bio || null,
                    availableFrom: form.availableFrom,
                    availableTo: form.availableTo,
                    availableDays: form.availableDays,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || "Failed to create doctor")
            alert("Doctor created successfully!")
            router.push("/admin/staff")
        } catch (err: any) {
            setError(err.message || "Error creating doctor")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/staff">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Staff
                    </Button>
                </Link>
            </div>

            <div>
                <h1 className="text-3xl font-bold">Create Doctor</h1>
                <p className="text-gray-600 mt-1">Create a new doctor account and profile</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    placeholder="Enter first name"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    placeholder="Enter last name"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="doctor@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+1234567890"
                                    value={form.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Leave blank for default (password123)"
                                    value={form.password}
                                    onChange={handleChange}
                                />
                                <p className="text-xs text-gray-500">
                                    Default password: password123 (Doctor should change on first login)
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Professional Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Professional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="specialization">Specialization *</Label>
                                <Input
                                    id="specialization"
                                    name="specialization"
                                    placeholder="e.g., Cardiology, Pediatrics"
                                    value={form.specialization}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="licenseNumber">License Number *</Label>
                                <Input
                                    id="licenseNumber"
                                    name="licenseNumber"
                                    placeholder="Enter medical license number"
                                    value={form.licenseNumber}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="experience">Years of Experience *</Label>
                                <Input
                                    id="experience"
                                    name="experience"
                                    type="number"
                                    min="0"
                                    placeholder="e.g., 5"
                                    value={form.experience}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="bio">Biography (Optional)</Label>
                                <Textarea
                                    id="bio"
                                    name="bio"
                                    placeholder="Brief professional biography..."
                                    value={form.bio}
                                    onChange={handleChange}
                                    rows={4}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Availability */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <CardTitle>Working Hours & Availability</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="availableFrom">Available From *</Label>
                                <Input
                                    id="availableFrom"
                                    name="availableFrom"
                                    type="time"
                                    value={form.availableFrom}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="availableTo">Available To *</Label>
                                <Input
                                    id="availableTo"
                                    name="availableTo"
                                    type="time"
                                    value={form.availableTo}
                                    onChange={handleChange}
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
                                        className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${
                                            form.availableDays.includes(day.value)
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                                        }`}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                            {form.availableDays.length === 0 && (
                                <p className="text-sm text-red-600">Please select at least one day</p>
                            )}
                            {form.availableDays.length > 0 && (
                                <p className="text-sm text-green-600">
                                    Selected {form.availableDays.length} day(s)
                                </p>
                            )}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-900">
                                <strong>Working Schedule Summary:</strong> {form.availableFrom} - {form.availableTo}
                                {form.availableDays.length > 0 && (
                                    <> on {form.availableDays.join(", ")}</>
                                )}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={loading}
                    >
                        {loading ? "Creating..." : "Create Doctor"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    )
}
