"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, DollarSign, Clock, User, Phone, MapPin } from "lucide-react"
import Link from "next/link"

interface UpcomingAppointment {
    id: string
    appointmentDate: string
    duration: number
    status: string
    notes: string | null
    patient: {
        user: {
            firstName: string
            lastName: string
            phone: string | null
        }
    }
    doctor: {
        user: {
            firstName: string
            lastName: string
        }
    }
    service: {
        name: string
        price: number
    }
}

export default function ReceptionDashboardPage() {
    const { data: session, status } = useSession()
    const [stats, setStats] = useState({
        incomingAppointments: 0,
        patientsToRegister: 0,
        pendingPayments: 0,
        walkIns: 0,
    })
    const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Get receptionist name
    const getReceptionistName = () => {
        if (!session?.user) return "Receptionist"

        const user = session.user as any
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`
        }
        if (user.firstName) {
            return user.firstName
        }
        if (user.name) {
            return user.name
        }
        return "Receptionist"
    }

    const receptionistName = getReceptionistName()

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [appointmentsRes, patientsRes, invoicesRes] = await Promise.all([
                    fetch("/api/receptionist/appointments"),
                    fetch("/api/receptionist/patients"),
                    fetch("/api/receptionist/invoices"),
                ])

                const appointments = appointmentsRes.ok ? await appointmentsRes.json() : []
                const patients = patientsRes.ok ? await patientsRes.json() : []
                const invoices = invoicesRes.ok ? await invoicesRes.json() : []

                // Filter only SCHEDULED appointments that are in the future
                const upcomingScheduled = appointments.filter(
                    (a: any) =>
                        a.status === "SCHEDULED" &&
                        new Date(a.appointmentDate) > new Date()
                ).sort((a: any, b: any) =>
                    new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
                )

                // Count today's appointments
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const tomorrow = new Date(today)
                tomorrow.setDate(tomorrow.getDate() + 1)

                const todaysAppointments = appointments.filter(
                    (a: any) => {
                        const aptDate = new Date(a.appointmentDate)
                        return aptDate >= today && aptDate < tomorrow && a.status === "SCHEDULED"
                    }
                )

                setUpcomingAppointments(upcomingScheduled.slice(0, 5))

                setStats({
                    incomingAppointments: upcomingScheduled.length,
                    patientsToRegister: patients.length,
                    pendingPayments: invoices.filter((i: any) => i.status === "PENDING").length,
                    walkIns: todaysAppointments.length,
                })
            } catch (error) {
                console.error("Failed to fetch receptionist stats:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (status === "authenticated") fetchStats()
        else if (status !== "loading") setIsLoading(false)
    }, [status])

    if (isLoading || status === "loading") {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Welcome, {receptionistName}</h1>
                    <p className="text-gray-600 mt-2">Loading your dashboard...</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="pt-6">
                                <div className="h-8 bg-gray-200 rounded"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Welcome, {receptionistName}</h1>
                <p className="text-gray-600 mt-2">Manage appointments, register patients and handle billing</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Incoming Appointments</p>
                                <p className="text-3xl font-bold mt-2">{stats.incomingAppointments}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Patients</p>
                                <p className="text-3xl font-bold mt-2">{stats.patientsToRegister}</p>
                            </div>
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Payments</p>
                                <p className="text-3xl font-bold mt-2">{stats.pendingPayments}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Today's Appointments</p>
                                <p className="text-3xl font-bold mt-2">{stats.walkIns}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-purple-600" /> {/* Changed from Clock to Calendar */}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Link href="/receptionist/appointments">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700" variant="default">
                                <Calendar className="w-4 h-4 mr-2" />
                                New Appointment
                            </Button>
                        </Link>
                        <Link href="/receptionist/patients">
                            <Button className="w-full bg-green-600 hover:bg-green-700" variant="default">
                                <Users className="w-4 h-4 mr-2" />
                                Register Patient
                            </Button>
                        </Link>
                        <Link href="/receptionist/billing">
                            <Button className="w-full bg-yellow-600 hover:bg-yellow-700" variant="default">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Create Invoice
                            </Button>
                        </Link>
                        <Link href="/receptionist/profile">
                            <Button className="w-full bg-transparent" variant="outline">
                                Edit Profile
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Appointments - IMPROVED */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Upcoming Appointments</CardTitle>
                        <Link href="/receptionist/appointments">
                            <Button variant="ghost" size="sm" className="text-blue-600">
                                View All
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {upcomingAppointments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="mb-3">No upcoming appointments scheduled</p>
                            <Link href="/receptionist/appointments">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Book Appointment
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingAppointments.map((apt) => (
                                <div key={apt.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-semibold text-lg">
                                                    {apt.patient.user.firstName} {apt.patient.user.lastName}
                                                </h4>
                                                <Badge className="bg-blue-100 text-blue-800">Patient</Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">
                                                Dr. {apt.doctor.user.firstName} {apt.doctor.user.lastName}
                                            </p>
                                            <p className="text-sm font-medium text-gray-700">{apt.service.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-blue-600">
                                                {new Date(apt.appointmentDate).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {new Date(apt.appointmentDate).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">${apt.service.price}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 text-sm text-gray-600 pt-3 border-t">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span>{apt.duration} min</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="truncate">{apt.patient.user.phone || "N/A"}</span>
                                        </div>
                                        {apt.notes && (
                                            <div className="flex items-center gap-2 col-span-3">
                                                <span className="text-xs text-gray-500 italic">Note: {apt.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {stats.incomingAppointments > 5 && (
                                <div className="text-center pt-2">
                                    <Link href="/receptionist/appointments">
                                        <Button variant="ghost" className="text-blue-600">
                                            View {stats.incomingAppointments - 5} more appointment(s)
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
