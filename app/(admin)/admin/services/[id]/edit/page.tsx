"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRouter, useParams } from "next/navigation"
import { Trash2 } from "lucide-react"

export default function EditServicePage() {
    const router = useRouter()
    const params = useParams()
    const serviceId = params.id as string

    const [doctors, setDoctors] = useState<any[]>([])
    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        duration: "30",
        doctorIds: [] as string[],
        isActive: true,
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [serviceRes, doctorsRes] = await Promise.all([
                    fetch(`/api/services?id=${serviceId}`),
                    fetch("/api/doctors"),
                ])

                if (!serviceRes.ok) throw new Error("Failed to fetch service")
                if (!doctorsRes.ok) throw new Error("Failed to fetch doctors")

                const services = await serviceRes.json()
                const service = Array.isArray(services)
                    ? services.find((s: any) => s.id === serviceId)
                    : services

                if (!service) throw new Error("Service not found")

                const doctorsData = await doctorsRes.json()

                setForm({
                    name: service.name,
                    description: service.description || "",
                    price: service.price.toString(),
                    duration: service.duration.toString(),
                    doctorIds: service.doctors?.map((d: any) => d.id) || [],
                    isActive: service.isActive,
                })

                setDoctors(doctorsData)
            } catch (err: any) {
                console.error("Failed to fetch data:", err)
                setError(err.message || "Failed to load service")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [serviceId])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        }))
    }

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
        setSaving(true)

        try {
            if (!form.name.trim()) throw new Error("Service name is required")
            if (!form.price || Number(form.price) <= 0) throw new Error("Valid price is required")
            if (!form.duration || Number(form.duration) <= 0) throw new Error("Valid duration is required")
            if (form.doctorIds.length === 0) throw new Error("Please select at least one doctor")

            const payload = {
                id: serviceId,
                name: form.name,
                description: form.description,
                price: Number(form.price),
                duration: Number(form.duration),
                doctorIds: form.doctorIds,
                isActive: form.isActive,
            }

            const res = await fetch("/api/services", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data?.error || "Failed to update service")
            }

            router.push("/admin/services")
        } catch (err: any) {
            console.error("Form submission error:", err)
            setError(err.message || "Error updating service")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${form.name}"? This action cannot be undone.`)) {
            return
        }

        setDeleting(true)
        try {
            const res = await fetch(`/api/services?id=${serviceId}`, {
                method: "DELETE",
                credentials: "include",
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data?.error || "Failed to delete service")
            }

            alert("Service deleted successfully")
            router.push("/admin/services")
        } catch (err: any) {
            console.error("Error deleting service:", err)
            setError(err.message || "Failed to delete service")
            setDeleting(false)
        }
    }

    if (loading) {
        return <div className="text-center py-12">Loading service...</div>
    }

    if (error && !form.name) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
                <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Edit Service</h1>
                <p className="text-gray-600 mt-1">Update service details</p>
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

                        {/* Multiple Doctor Selection */}
                        <div className="space-y-3">
                            <Label>Select Doctors *</Label>
                            <p className="text-sm text-gray-500">
                                Choose one or more doctors who can provide this service
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-lg bg-gray-50">
                                {doctors.map((doctor) => (
                                    <label
                                        key={doctor.id}
                                        className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                            form.doctorIds.includes(doctor.id)
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 bg-white hover:border-blue-300"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.doctorIds.includes(doctor.id)}
                                            onChange={() => handleDoctorToggle(doctor.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                        />
                                        <div className="flex-1">
                                            <span className="font-medium">
                                                Dr. {doctor.user.firstName} {doctor.user.lastName}
                                            </span>
                                            {doctor.specialization && (
                                                <p className="text-sm text-gray-500">{doctor.specialization}</p>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
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
                                disabled={saving || deleting}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={saving || deleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 ml-auto"
                                onClick={handleDelete}
                                disabled={saving || deleting}
                            >
                                {deleting ? (
                                    "Deleting..."
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Service
                                    </>
                                )}
                            </Button>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-800 text-sm font-medium">{error}</p>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
