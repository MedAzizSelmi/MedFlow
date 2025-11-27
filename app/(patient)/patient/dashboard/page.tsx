// app/patient/dashboard/page.tsx
"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, DollarSign, Clock } from "lucide-react"
import Link from "next/link"

export default function PatientDashboardPage() {
    const { data: session } = useSession()
    const [stats, setStats] = useState({
        upcomingAppointments: 0,
        medicalRecords: 0,
        pendingInvoices: 0,
        activePrescriptions: 0,
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const userId = (session?.user as any)?.id
                if (!userId) {
                    setIsLoading(false)
                    return
                }

                // Fetch all data in parallel without needing patient ID first
                const [appointmentsRes, invoicesRes, recordsRes] = await Promise.all([
                    fetch('/api/appointments'),
                    fetch('/api/invoices'),
                    fetch('/api/medical-records') // This will now work!
                ])

                const appointments = appointmentsRes.ok ? await appointmentsRes.json() : []
                const invoices = invoicesRes.ok ? await invoicesRes.json() : []
                const records = recordsRes.ok ? await recordsRes.json() : []

                setStats({
                    upcomingAppointments: appointments.filter(
                        (apt: any) => apt.status === "SCHEDULED" && new Date(apt.appointmentDate) > new Date()
                    ).length,
                    medicalRecords: records.length,
                    pendingInvoices: invoices.filter((inv: any) => inv.status === "PENDING").length,
                    activePrescriptions: 0, // You can implement this later
                })
            } catch (error) {
                console.error("Failed to fetch stats:", error)
                setStats({
                    upcomingAppointments: 0,
                    medicalRecords: 0,
                    pendingInvoices: 0,
                    activePrescriptions: 0,
                })
            } finally {
                setIsLoading(false)
            }
        }

        if (session) {
            fetchStats()
        } else {
            setIsLoading(false)
        }
    }, [session])

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Welcome, {session?.user?.name}</h1>
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
                <h1 className="text-3xl font-bold">Welcome, {session?.user?.name}</h1>
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
                            <Clock className="w-8 h-8 text-purple-600" />
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
                        <Link href="/patient/appointments">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700" variant="default">
                                <Calendar className="w-4 h-4 mr-2" />
                                Book Appointment
                            </Button>
                        </Link>
                        <Link href="/patient/medical-records">
                            <Button className="w-full bg-green-600 hover:bg-green-700" variant="default">
                                <FileText className="w-4 h-4 mr-2" />
                                View Records
                            </Button>
                        </Link>
                        <Link href="/patient/invoices">
                            <Button className="w-full bg-yellow-600 hover:bg-yellow-700" variant="default">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Pay Invoice
                            </Button>
                        </Link>
                        <Link href="/patient/profile">
                            <Button className="w-full bg-transparent" variant="outline">
                                Edit Profile
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Appointments Preview */}
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
                    <div className="text-center text-gray-500 py-6">
                        {stats.upcomingAppointments === 0
                            ? "No upcoming appointments"
                            : `You have ${stats.upcomingAppointments} upcoming appointment(s)`}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}