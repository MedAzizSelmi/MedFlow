"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

export default function ServicesPage() {
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [deleting, setDeleting] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        try {
            const res = await fetch("/api/services", {
                credentials: "include"
            })
            if (!res.ok) {
                throw new Error(`Failed to fetch services: ${res.status}`)
            }
            const data = await res.json()
            setServices(data || [])
        } catch (err: any) {
            console.error("Error fetching services:", err)
            setError(err.message || "Failed to load services")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (serviceId: string, serviceName: string) => {
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete "${serviceName}"? This action cannot be undone.`)) {
            return
        }

        setDeleting(serviceId)
        try {
            const res = await fetch(`/api/services?id=${serviceId}`, {
                method: "DELETE",
                credentials: "include",
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data?.error || "Failed to delete service")
            }

            // Remove from list
            setServices(services.filter(s => s.id !== serviceId))
            alert("Service deleted successfully")
        } catch (err: any) {
            console.error("Error deleting service:", err)
            alert(err.message || "Failed to delete service")
        } finally {
            setDeleting(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Services</h1>
                    <p className="text-gray-600 mt-1">Create and configure services for your clinic</p>
                </div>
                <Link href="/admin/services/new">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        New Service
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Available Services</CardTitle>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-800">{error}</p>
                        </div>
                    ) : loading ? (
                        <div className="flex justify-center py-8">
                            <p className="text-gray-500">Loading services...</p>
                        </div>
                    ) : services.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">No services found.</p>
                            <Link href="/admin/services/new">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    Create Your First Service
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {services.map((service) => (
                                <div
                                    key={service.id}
                                    className={`p-4 border rounded-lg ${
                                        service.isActive === false ? "bg-gray-50 opacity-75" : "bg-white"
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-lg">{service.name}</p>
                                                {service.isActive === false && (
                                                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            {service.description && (
                                                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                <span>
                                                    {service.doctors && service.doctors.length > 0
                                                        ? `Doctors: ${service.doctors.map((d: any) => `${d.user.firstName} ${d.user.lastName}`).join(", ")}`
                                                        : "No doctors assigned"}
                                                </span>
                                                <span>•</span>
                                                <span>{service.duration} minutes</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-lg">${Number(service.price).toFixed(2)}</p>
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/admin/services/${service.id}/edit`)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={() => handleDelete(service.id, service.name)}
                                                    disabled={deleting === service.id}
                                                >
                                                    {deleting === service.id ? (
                                                        "Deleting..."
                                                    ) : (
                                                        <>
                                                            <Trash2 className="w-4 h-4 mr-1" />
                                                            Delete
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
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
