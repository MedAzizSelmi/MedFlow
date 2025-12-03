"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, Plus, Search, AlertCircle } from "lucide-react"

interface Appointment {
    id: string
    appointmentDate: string
    status: string
    notes: string | null
    duration: number
    doctor: {
        user: {
            firstName: string
            lastName: string
        }
        specialization: string | null
    }
    service: {
        name: string
        price: number
    }
}

export default function PatientAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    useEffect(() => {
        fetchAppointments()
    }, [])

    useEffect(() => {
        filterAppointments()
    }, [appointments, searchTerm, statusFilter])

    const fetchAppointments = async () => {
        try {
            const res = await fetch("/api/patient/appointments")
            if (res.ok) {
                const data = await res.json()
                setAppointments(data)
            }
        } catch (error) {
            console.error("Error fetching appointments:", error)
        } finally {
            setLoading(false)
        }
    }

    const filterAppointments = () => {
        let filtered = appointments

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter((apt) => apt.status === statusFilter)
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(
                (apt) =>
                    apt.doctor.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    apt.doctor.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    apt.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (apt.doctor.specialization && apt.doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        }

        setFilteredAppointments(filtered)
    }

    const handleCancelAppointment = async (appointmentId: string) => {
        if (!confirm("Are you sure you want to cancel this appointment?")) {
            return
        }

        try {
            const res = await fetch("/api/patient/appointments", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: appointmentId, status: "CANCELLED" }),
            })

            if (!res.ok) throw new Error("Failed to cancel appointment")

            await fetchAppointments()
            alert("Appointment cancelled successfully")
        } catch (error) {
            console.error("Error cancelling appointment:", error)
            alert("Failed to cancel appointment")
        }
    }

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; className: string }> = {
            SCHEDULED: { label: "Scheduled", className: "bg-blue-100 text-blue-800" },
            COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800" },
            CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800" },
            NO_SHOW: { label: "No Show", className: "bg-gray-100 text-gray-800" },
        }
        const { label, className } = config[status] || config.SCHEDULED
        return <Badge className={className}>{label}</Badge>
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "SCHEDULED":
                return <Calendar className="w-5 h-5 text-blue-600" />
            case "COMPLETED":
                return <Calendar className="w-5 h-5 text-green-600" />
            case "CANCELLED":
                return <AlertCircle className="w-5 h-5 text-red-600" />
            case "NO_SHOW":
                return <AlertCircle className="w-5 h-5 text-gray-600" />
            default:
                return <Calendar className="w-5 h-5 text-gray-600" />
        }
    }

    const canCancelAppointment = (appointment: Appointment) => {
        if (appointment.status !== "SCHEDULED") return false
        const appointmentDate = new Date(appointment.appointmentDate)
        const now = new Date()
        return appointmentDate > now
    }

    if (loading) {
        return <div className="text-center py-12">Loading appointments...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">My Appointments</h1>
                    <p className="text-gray-600 mt-1">View and manage your appointments</p>
                </div>
                <Link href="/patient/appointments/new">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        New Appointment
                    </Button>
                </Link>
            </div>

            {/* Search & Filter */}
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
                                    placeholder="Search by doctor, service, or specialization..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Filter by Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Appointments</SelectItem>
                                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    <SelectItem value="NO_SHOW">No Show</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-blue-600 font-medium">Scheduled</p>
                            <p className="text-2xl font-bold text-blue-700">
                                {appointments.filter((a) => a.status === "SCHEDULED").length}
                            </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs text-green-600 font-medium">Completed</p>
                            <p className="text-2xl font-bold text-green-700">
                                {appointments.filter((a) => a.status === "COMPLETED").length}
                            </p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-xs text-red-600 font-medium">Cancelled</p>
                            <p className="text-2xl font-bold text-red-700">
                                {appointments.filter((a) => a.status === "CANCELLED").length}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-600 font-medium">No Show</p>
                            <p className="text-2xl font-bold text-gray-700">
                                {appointments.filter((a) => a.status === "NO_SHOW").length}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Appointments List */}
            <Card>
                <CardHeader>
                    <CardTitle>Appointments ({filteredAppointments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredAppointments.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium">No appointments found</p>
                            {statusFilter !== "all" && (
                                <p className="text-sm mt-2">Try changing the filter or search term</p>
                            )}
                            {appointments.length === 0 && (
                                <Link href="/patient/appointments/new">
                                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Book Your First Appointment
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(appointment.status)}
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    Dr. {appointment.doctor.user.firstName}{" "}
                                                    {appointment.doctor.user.lastName}
                                                </h3>
                                                {appointment.doctor.specialization && (
                                                    <p className="text-sm text-gray-600">
                                                        {appointment.doctor.specialization}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {getStatusBadge(appointment.status)}
                                    </div>

                                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                                        <p className="text-sm font-medium text-gray-700">Service:</p>
                                        <p className="text-gray-900">{appointment.service.name}</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Price: ${appointment.service.price}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                {new Date(appointment.appointmentDate).toLocaleDateString("en-US", {
                                                    weekday: "short",
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>{appointment.duration} minutes</span>
                                        </div>
                                    </div>

                                    {appointment.notes && (
                                        <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                                            <p className="font-medium text-gray-700">Notes:</p>
                                            <p className="text-gray-600">{appointment.notes}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 flex-wrap">
                                        {canCancelAppointment(appointment) && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => handleCancelAppointment(appointment.id)}
                                            >
                                                Cancel Appointment
                                            </Button>
                                        )}
                                        {appointment.status === "SCHEDULED" && (
                                            <Link href={`/patient/appointments/${appointment.id}`}>
                                                <Button size="sm" variant="outline">
                                                    View Details
                                                </Button>
                                            </Link>
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
