"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, Phone, Mail } from "lucide-react"

interface Appointment {
    id: string
    appointmentDate: string
    duration: number
    status: string
    notes: string | null
    patient: {
        user: {
            firstName: string
            lastName: string
            email: string
            phone: string | null
        }
    }
    service: {
        name: string
        price: number
    }
}

export default function DoctorAgendaPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
    const [statusFilter, setStatusFilter] = useState("all")

    useEffect(() => {
        fetchAppointments()
    }, [])

    useEffect(() => {
        filterAppointments()
    }, [appointments, selectedDate, statusFilter])

    const fetchAppointments = async () => {
        try {
            const res = await fetch("/api/doctors/appointments")
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

        // Filter by date
        if (selectedDate) {
            filtered = filtered.filter((apt) => {
                const aptDate = new Date(apt.appointmentDate).toISOString().split("T")[0]
                return aptDate === selectedDate
            })
        }

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter((apt) => apt.status === statusFilter)
        }

        // Sort by time
        filtered.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())

        setFilteredAppointments(filtered)
    }

    const updateStatus = async (appointmentId: string, newStatus: string) => {
        try {
            const res = await fetch("/api/doctors/appointments", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointmentId, status: newStatus }),
            })

            if (!res.ok) throw new Error("Failed to update")

            await fetchAppointments()
        } catch (error) {
            console.error("Error updating appointment:", error)
            alert("Failed to update appointment status")
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

    // Calculate stats for selected date
    const todayAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate).toISOString().split("T")[0]
        return aptDate === selectedDate
    })

    const stats = {
        totalToday: todayAppointments.length,
        scheduled: todayAppointments.filter((a) => a.status === "SCHEDULED").length,
        completed: todayAppointments.filter((a) => a.status === "COMPLETED").length,
        cancelled: todayAppointments.filter((a) => a.status === "CANCELLED").length,
    }

    if (loading) {
        return <div className="text-center py-12">Loading agenda...</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Agenda</h1>
                <p className="text-gray-600 mt-1">Manage your appointments and schedule</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Today</p>
                            <p className="text-4xl font-bold mt-2">{stats.totalToday}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-blue-600 font-medium">Scheduled</p>
                            <p className="text-4xl font-bold text-blue-700 mt-2">{stats.scheduled}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-green-600 font-medium">Completed</p>
                            <p className="text-4xl font-bold text-green-700 mt-2">{stats.completed}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-red-600 font-medium">Cancelled</p>
                            <p className="text-4xl font-bold text-red-700 mt-2">{stats.cancelled}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
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
                </CardContent>
            </Card>

            {/* Appointments List */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        Appointments ({filteredAppointments.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredAppointments.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>No appointments found for the selected filters</p>
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
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {appointment.patient.user.firstName}{" "}
                                                    {appointment.patient.user.lastName}
                                                </h3>
                                                <p className="text-sm text-gray-600">{appointment.service.name}</p>
                                            </div>
                                        </div>
                                        {getStatusBadge(appointment.status)}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                {new Date(appointment.appointmentDate).toLocaleDateString("en-US", {
                                                    weekday: "short",
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            <span>{appointment.patient.user.email}</span>
                                        </div>
                                        {appointment.patient.user.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4" />
                                                <span>{appointment.patient.user.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {appointment.notes && (
                                        <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                                            <p className="font-medium text-gray-700">Notes:</p>
                                            <p className="text-gray-600">{appointment.notes}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 flex-wrap">
                                        {appointment.status === "SCHEDULED" && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => updateStatus(appointment.id, "COMPLETED")}
                                                >
                                                    Mark Complete
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:bg-red-50"
                                                    onClick={() => updateStatus(appointment.id, "CANCELLED")}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateStatus(appointment.id, "NO_SHOW")}
                                                >
                                                    No Show
                                                </Button>
                                            </>
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
