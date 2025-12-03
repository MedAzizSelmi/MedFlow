"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, DollarSign, Pill, Clock, MapPin } from "lucide-react"
import Link from "next/link"

interface UpcomingAppointment {
    id: string
    appointmentDate: string
    duration: number
    status: string
    doctor: {
        user: {
            firstName: string
            lastName: string
        }
    }
    service: {
        name: string
    }
    clinic?: {
        name: string
        address: string
    } | null
}

export default function PatientDashboardPage() {
    const { data: session, status } = useSession()
    const [stats, setStats] = useState({
        upcomingAppointments: 0,
        medicalRecords: 0,
        pendingInvoices: 0,
        activePrescriptions: 0,
    })
    const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const getPatientName = () => {
        if (!session?.user) return "Patient"

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
        return "Patient"
    }

    const patientName = getPatientName()

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [appointmentsRes, recordsRes, invoicesRes, prescriptionsRes] = await Promise.all([
                    fetch("/api/patient/appointments"),
                    fetch("/api/patient/medical-records"),
                    fetch("/api/patient/invoices"),
                    fetch("/api/patient/prescriptions"),
                ])

                const appointments = appointmentsRes.ok ? await appointmentsRes.json() : []
                const records = recordsRes.ok ? await recordsRes.json() : []
                const invoices = invoicesRes.ok ? await invoicesRes.json() : []
                const prescriptions = prescriptionsRes.ok ? await prescriptionsRes.json() : []

                const upcoming = appointments
                    .filter(
                        (apt: any) =>
                            apt.status === "SCHEDULED" &&
                            new Date(apt.appointmentDate) > new Date()
                    )
                    .sort(
                        (a: any, b: any) =>
                            new Date(a.appointmentDate).getTime() -
                            new Date(b.appointmentDate).getTime()
                    )

                setUpcomingAppointments(upcoming.slice(0, 3))

                setStats({
                    upcomingAppointments: upcoming.length,
                    medicalRecords: records.length,
                    pendingInvoices: invoices.filter((inv: any) => inv.status === "PENDING").length,
                    activePrescriptions: prescriptions.filter((p: any) => p.status === "ACTIVE").length,
                })
            } catch (error) {
                console.error("Failed to fetch stats:", error)
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
                    <h1 className="text-3xl font-bold">Welcome, {patientName}</h1>
                    <p className="text-gray-600 mt-2">Loading your dashboard...</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="pt-6">
                                <div className="h-8 bg-gray-200 rounded" />
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
                <h1 className="text-3xl font-bold">Welcome, {patientName}</h1>
                <p className="text-gray-600 mt-2">Here's your medical information overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Upcoming Appointments</p>
                                <p className="text-3xl font-bold mt-2">{stats.upcomingAppointments}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Medical Records</p>
                                <p className="text-3xl font-bold mt-2">{stats.medicalRecords}</p>
                            </div>
                            <FileText className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Invoices</p>
                                <p className="text-3xl font-bold mt-2">{stats.pendingInvoices}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Prescriptions</p>
                                <p className="text-3xl font-bold mt-2">{stats.activePrescriptions}</p>
                            </div>
                            <Pill className="w-8 h-8 text-purple-600" />
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
                        <Link href="/patient/appointments/new">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                <Calendar className="w-4 h-4 mr-2" />
                                Book Appointment
                            </Button>
                        </Link>
                        <Link href="/patient/medical-records">
                            <Button className="w-full bg-green-600 hover:bg-green-700">
                                <FileText className="w-4 h-4 mr-2" />
                                View Records
                            </Button>
                        </Link>
                        <Link href="/patient/invoices">
                            <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Pay Invoice
                            </Button>
                        </Link>
                        <Link href="/patient/prescriptions">
                            <Button className="w-full bg-purple-600 hover:bg-purple-700">
                                <Pill className="w-4 h-4 mr-2" />
                                Prescriptions
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Upcoming Appointments</CardTitle>
                        <Link href="/patient/appointments">
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
                            <p className="mb-3">No upcoming appointments</p>
                            <Link href="/patient/appointments/new">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Book Appointment
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingAppointments.map((apt) => (
                                <div
                                    key={apt.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-semibold text-lg text-blue-600">
                                                Dr. {apt.doctor.user.firstName} {apt.doctor.user.lastName}
                                            </h4>
                                            <p className="text-sm text-gray-600">{apt.service.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-700">
                                                {new Date(apt.appointmentDate).toLocaleDateString("en-US", {
                                                    weekday: "short",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(apt.appointmentDate).toLocaleTimeString("en-US", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span>{apt.duration} minutes</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            {apt.clinic?.name ? (
                                                <span className="truncate">{apt.clinic.name}</span>
                                            ) : (
                                                <span className="truncate text-gray-400">
                                                    Clinic not set
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex gap-2">
                                        <Link href="/patient/appointments">
                                            <Button size="sm" variant="outline" className="text-blue-600">
                                                View Details
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}

                            {stats.upcomingAppointments > 3 && (
                                <div className="text-center pt-2">
                                    <Link href="/patient/appointments">
                                        <Button variant="ghost" className="text-blue-600">
                                            View {stats.upcomingAppointments - 3} more appointment(s)
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
