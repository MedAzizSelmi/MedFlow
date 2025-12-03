"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, Clipboard, Clock, User, Phone } from "lucide-react"
import Link from "next/link"

interface Appointment {
    id: string
    appointmentDate: string
    duration: number
    status: string
    patient: {
        user: {
            firstName: string
            lastName: string
            phone: string | null
        }
    }
    service: {
        name: string
    }
}

export default function DoctorDashboardPage() {
    const { data: session, status } = useSession()
    const [stats, setStats] = useState({
        todaysAppointments: 0,
        medicalRecords: 0,
        totalConsultations: 0,
        upcomingPatients: 0,
    })
    const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Get doctor name
    const getDoctorName = () => {
        if (!session?.user) return "Doctor"

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
        return "Doctor"
    }

    const doctorName = getDoctorName()

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [appointmentsRes, recordsRes, consultationsRes] = await Promise.all([
                    fetch("/api/doctors/appointments"),
                    fetch("/api/doctors/medical-records"),
                    fetch("/api/doctors/consultations"),
                ])

                const appointments = appointmentsRes.ok ? await appointmentsRes.json() : []
                const records = recordsRes.ok ? await recordsRes.json() : []
                const consultations = consultationsRes.ok ? await consultationsRes.json() : []

                // Get today's date range
                const now = new Date()
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
                const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

                // Filter today's appointments (SCHEDULED only)
                const todayAppts = appointments.filter((a: any) => {
                    const aptDate = new Date(a.appointmentDate)
                    return aptDate >= todayStart && aptDate <= todayEnd && a.status === "SCHEDULED"
                })

                // Filter upcoming appointments (future, SCHEDULED only)
                const upcomingAppts = appointments.filter((a: any) => {
                    const aptDate = new Date(a.appointmentDate)
                    return aptDate > now && a.status === "SCHEDULED"
                })

                // Sort today's appointments by time
                todayAppts.sort((a: any, b: any) =>
                    new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
                )

                setTodaysAppointments(todayAppts)

                setStats({
                    todaysAppointments: todayAppts.length,
                    medicalRecords: records.length,
                    totalConsultations: consultations.length,
                    upcomingPatients: upcomingAppts.length,
                })
            } catch (error) {
                console.error("Failed to fetch doctor stats:", error)
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
                    <h1 className="text-3xl font-bold">Welcome, Dr. {doctorName}</h1>
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
                <h1 className="text-3xl font-bold">Welcome, Dr. {doctorName}</h1>
                <p className="text-gray-600 mt-2">Here is your practice overview</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Today's Appointments</p>
                                <p className="text-3xl font-bold mt-2">{stats.todaysAppointments}</p>
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
                                <p className="text-sm text-gray-600">Total Consultations</p>
                                <p className="text-3xl font-bold mt-2">{stats.totalConsultations}</p>
                            </div>
                            <Clipboard className="w-8 h-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Appointments</p>
                                <p className="text-3xl font-bold mt-2">{stats.upcomingPatients}</p>
                            </div>
                            <Clock className="w-8 h-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Link href="/doctor/agenda">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700" variant="default">
                                <Calendar className="w-4 h-4 mr-2" />
                                View Agenda
                            </Button>
                        </Link>
                        <Link href="/doctor/consultations">
                            <Button className="w-full bg-green-600 hover:bg-green-700" variant="default">
                                <FileText className="w-4 h-4 mr-2" />
                                Consultations
                            </Button>
                        </Link>
                        <Link href="/doctor/prescriptions">
                            <Button className="w-full bg-yellow-600 hover:bg-yellow-700" variant="default">
                                <Clipboard className="w-4 h-4 mr-2" />
                                Prescriptions
                            </Button>
                        </Link>
                        <Link href="/doctor/profile">
                            <Button className="w-full bg-transparent" variant="outline">
                                Edit Profile
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Today's Appointments */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Today's Appointments</CardTitle>
                        <Link href="/doctor/agenda">
                            <Button variant="ghost" size="sm" className="text-blue-600">
                                View All
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {todaysAppointments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No appointments scheduled for today</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {todaysAppointments.map((apt) => (
                                <div key={apt.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg">
                                                    {apt.patient.user.firstName} {apt.patient.user.lastName}
                                                </h4>
                                                <p className="text-sm text-gray-600">{apt.service.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-blue-600">
                                                {new Date(apt.appointmentDate).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                            <Badge className="bg-blue-100 text-blue-800 mt-1">
                                                {apt.duration} min
                                            </Badge>
                                        </div>
                                    </div>

                                    {apt.patient.user.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            <span>{apt.patient.user.phone}</span>
                                        </div>
                                    )}

                                    <div className="mt-3">
                                        <Link href="/doctor/agenda">
                                            <Button size="sm" variant="outline" className="text-blue-600">
                                                View Details
                                            </Button>
                                        </Link>
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
