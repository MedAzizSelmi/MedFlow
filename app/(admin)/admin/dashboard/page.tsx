"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, DollarSign, Settings, User, UserPlus, ClipboardList, Stethoscope } from "lucide-react"
import Link from "next/link"

interface ActivityLog {
    id: string
    action: string
    entityType: string
    entityName: string
    performedBy: string
    createdAt: string
}

export default function AdminDashboardPage() {
    const { data: session, status } = useSession()
    const [clinicCount, setClinicCount] = useState(0)
    const [servicesCount, setServicesCount] = useState(0)
    const [staffCount, setStaffCount] = useState(0)
    const [revenue, setRevenue] = useState(0)
    const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)

    // Get user-name with better handling
    const getUserName = () => {
        if (!session?.user) return "Admin"

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
        return "Admin"
    }

    const userName = getUserName()

    useEffect(() => {
        // Only fetch data when session is authenticated
        if (status === "authenticated") {
            fetchDashboardData()
        }
    }, [status])

    const fetchDashboardData = async () => {
        try {
            const [clinicRes, servicesRes, staffRes, invoicesRes, activityRes] = await Promise.all([
                fetch("/api/admin/clinic"),
                fetch("/api/services"),
                fetch("/api/admin/staff"),
                fetch("/api/receptionist/invoices"),
                fetch("/api/admin/dashboard/activity"),
            ])

            // Clinic count
            if (clinicRes.ok) {
                const clinicData = await clinicRes.json()
                setClinicCount(clinicData ? 1 : 0)
            }

            // Services count
            if (servicesRes.ok) {
                const servicesData = await servicesRes.json()
                setServicesCount(servicesData.length)
            }

            // Staff count
            if (staffRes.ok) {
                const staffData = await staffRes.json()
                setStaffCount(staffData.length)
            }

            // Calculate revenue from PAID invoices
            if (invoicesRes.ok) {
                const invoicesData = await invoicesRes.json()
                const paidInvoices = invoicesData.filter(
                    (inv: any) => inv.status === "PAID"
                )
                const totalRevenue = paidInvoices.reduce(
                    (sum: number, inv: any) => sum + inv.totalAmount,
                    0
                )
                setRevenue(totalRevenue)
            }

            // Activity
            if (activityRes.ok) {
                const activityData = await activityRes.json()
                setRecentActivity(activityData)
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }

    const getActivityIcon = (entityType: string) => {
        switch (entityType) {
            case "STAFF":
                return <UserPlus className="w-4 h-4 text-blue-600" />
            case "PATIENT":
                return <User className="w-4 h-4 text-green-600" />
            case "SERVICE":
                return <Settings className="w-4 h-4 text-purple-600" />
            case "APPOINTMENT":
                return <ClipboardList className="w-4 h-4 text-orange-600" />
            case "CLINIC":
                return <Stethoscope className="w-4 h-4 text-indigo-600" />
            default:
                return <Calendar className="w-4 h-4 text-gray-600" />
        }
    }

    const getActivityColor = (entityType: string) => {
        switch (entityType) {
            case "STAFF":
                return "bg-blue-50 border-blue-200"
            case "PATIENT":
                return "bg-green-50 border-green-200"
            case "SERVICE":
                return "bg-purple-50 border-purple-200"
            case "APPOINTMENT":
                return "bg-orange-50 border-orange-200"
            case "CLINIC":
                return "bg-indigo-50 border-indigo-200"
            default:
                return "bg-gray-50 border-gray-200"
        }
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (seconds < 60) return "Just now"
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
        return date.toLocaleDateString()
    }

    // Show loading while session is being fetched
    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    Welcome, {userName}
                </h1>
                <p className="text-gray-600 mt-1">
                    Create clinics, configure services and manage staff
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Clinics</p>
                                <p className="text-3xl font-bold text-blue-900 mt-1">{clinicCount}</p>
                            </div>
                            <Calendar className="w-10 h-10 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium">Services</p>
                                <p className="text-3xl font-bold text-green-900 mt-1">{servicesCount}</p>
                            </div>
                            <Settings className="w-10 h-10 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-600 font-medium">Staff</p>
                                <p className="text-3xl font-bold text-yellow-900 mt-1">{staffCount}</p>
                            </div>
                            <Users className="w-10 h-10 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-600 font-medium">Revenue</p>
                                <p className="text-3xl font-bold text-purple-900 mt-1">
                                    ${revenue.toFixed(2)}
                                </p>
                            </div>
                            <DollarSign className="w-10 h-10 text-purple-600" />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Link href="/admin/clinic">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                Create Clinic
                            </Button>
                        </Link>
                        <Link href="/admin/services">
                            <Button className="w-full bg-green-600 hover:bg-green-700">
                                Manage Services
                            </Button>
                        </Link>
                        <Link href="/admin/staff">
                            <Button className="w-full bg-orange-600 hover:bg-orange-700">
                                Manage Staff
                            </Button>
                        </Link>
                        <Link href="/admin/profile">
                            <Button className="w-full" variant="outline">
                                Edit Profile
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Recent Activity</CardTitle>
                        <Link href="/admin/staff">
                            <Button variant="link" className="text-blue-600">
                                View Staff
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading activity...</div>
                    ) : recentActivity.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p>No recent activity yet</p>
                            <p className="text-sm mt-1">
                                Start by creating a clinic or adding staff members
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentActivity.map((activity) => (
                                <div
                                    key={activity.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg border ${getActivityColor(
                                        activity.entityType
                                    )}`}
                                >
                                    <div className="mt-1">{getActivityIcon(activity.entityType)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">
                                            {activity.action}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {activity.entityName} • by {activity.performedBy}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatTimeAgo(activity.createdAt)}
                                        </p>
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
