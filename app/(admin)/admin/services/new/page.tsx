"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

export default function NewServicePage() {
    const [doctors, setDoctors] = useState<any[]>([])
    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        duration: "30",
        doctorIds: [] as string[],
        isActive: true,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await fetch("/api/doctors", {
                    credentials: "include"
                })

                if (!res.ok) {
                    throw new Error(`Failed to fetch doctors: ${res.status}`)
                }

                const data = await res.json()
                setDoctors(data)
            } catch (err) {
                console.error("Failed to fetch doctors:", err)
                setError("Failed to load doctors list")
            }
        }
        fetchDoctors()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        }))
    }

    // Handle multiple doctor selection
    const handleDoctorToggle = (doctorId: string) => {
        setForm((prev) => ({
            ...prev,
            doctorIds: prev.doctorIds.includes(doctorId)
                ? prev.doctorIds.filter((id) => id !== doctorId)
                : [...prev.doctorIds, doctorId],
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            if (!form.name.trim()) {
                throw new Error("Service name is required")
            }
            if (!form.price || Number(form.price) <= 0) {
                throw new Error("Valid price is required")
            }
            if (!form.duration || Number(form.duration) <= 0) {
                throw new Error("Valid duration is required")
            }
            if (form.doctorIds.length === 0) {
                throw new Error("Please select at least one doctor")
            }

            const payload = {
                name: form.name,
                description: form.description,
                price: Number(form.price),
                duration: Number(form.duration),
                doctorIds: form.doctorIds,
                isActive: form.isActive,
            }

            const res = await fetch("/api/services", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            })

            const responseText = await res.text()
            let data
            try {
                data = responseText ? JSON.parse(responseText) : {}
            } catch (parseError) {
                throw new Error("Invalid response from server")
            }

            if (!res.ok) {
                throw new Error(data?.error || `Failed to create service: ${res.status}`)
            }

            router.push("/admin/services")
        } catch (err: any) {
            console.error("Form submission error:", err)
            setError(err.message || "Error creating service")
        } finally {
            setLoading(false)
        }
    }

    const getDoctorDisplayName = (doctor: any) => {
        if (doctor.firstName && doctor.lastName) {
            return `Dr. ${doctor.firstName} ${doctor.lastName}`
        } else if (doctor.user?.firstName && doctor.user?.lastName) {
            return `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`
        } else if (doctor.name) {
            return doctor.name
        } else {
            return `Doctor (ID: ${doctor.id})`
        }
    }

    const getDoctorId = (doctor: any) => {
        return doctor.id || doctor.userId || doctor.doctorId
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Create Service</h1>
                <p className="text-gray-600 mt-1">Add a new medical service for your clinic</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Service Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Service Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Service name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">Price ($) *</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    placeholder="0.00"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.price}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (minutes) *</Label>
                                <Input
                                    id="duration"
                                    name="duration"
                                    placeholder="30"
                                    type="number"
                                    min="1"
                                    value={form.duration}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Multiple Doctor Selection with native checkboxes */}
                        <div className="space-y-3">
                            <Label>Select Doctors *</Label>
                            <p className="text-sm text-gray-500">
                                Choose one or more doctors who can provide this service
                            </p>

                            {doctors.length === 0 ? (
                                <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                                    Loading doctors...
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-lg bg-gray-50">
                                    {doctors.map((doctor) => {
                                        const doctorId = getDoctorId(doctor)
                                        const displayName = getDoctorDisplayName(doctor)
                                        const specialization = doctor.specialization || ""
                                        const isSelected = form.doctorIds.includes(doctorId)

                                        if (!doctorId) return null

                                        return (
                                            <label
                                                key={doctorId}
                                                htmlFor={`doctor-${doctorId}`}
                                                className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "border-blue-500 bg-blue-50"
                                                        : "border-gray-200 bg-white hover:border-blue-300"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    id={`doctor-${doctorId}`}
                                                    checked={isSelected}
                                                    onChange={() => handleDoctorToggle(doctorId)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="flex-1">
                                                    <span className="font-medium">{displayName}</span>
                                                    {specialization && (
                                                        <p className="text-sm text-gray-500">{specialization}</p>
                                                    )}
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>
                            )}

                            {form.doctorIds.length > 0 && (
                                <p className="text-sm text-blue-600">
                                    {form.doctorIds.length} doctor{form.doctorIds.length > 1 ? "s" : ""} selected
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Service description"
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={form.isActive}
                                onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                                className="rounded border-gray-300"
                            />
                            <Label htmlFor="isActive">Active Service</Label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={loading || doctors.length === 0 || form.doctorIds.length === 0}
                            >
                                {loading ? "Creating Service..." : "Create Service"}
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

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-800 text-sm font-medium">Error: {error}</p>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
