import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const adminUserId = (session.user as any).id
        const admin = await prisma.user.findUnique({
            where: { id: adminUserId },
            select: { clinicId: true },
        })

        if (!admin?.clinicId) {
            return NextResponse.json([])
        }

        // Get recent staff additions
        const recentStaff = await prisma.user.findMany({
            where: {
                clinicId: admin.clinicId,
                role: { in: ["DOCTOR", "RECEPTIONIST"] },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        })

        // Get recent patients
        const recentPatients = await prisma.patient.findMany({
            where: {
                user: { clinicId: admin.clinicId },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        createdAt: true,
                    },
                },
                createdAt: true,
            },
        })

        // Get recent services - UPDATED for many-to-many
        const recentServices = await prisma.service.findMany({
            where: {
                clinicId: admin.clinicId, // ✅ Filter by clinicId directly
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                name: true,
                createdAt: true,
                doctors: { // ✅ Changed from 'doctor' to 'doctors'
                    select: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        })

        // Combine and format activities
        const activities: any[] = []

        recentStaff.forEach((staff) => {
            activities.push({
                id: `staff-${staff.id}`,
                action: `New ${staff.role.toLowerCase()} added`,
                entityType: "STAFF",
                entityName: `${staff.firstName} ${staff.lastName}`,
                performedBy: "Admin",
                createdAt: staff.createdAt.toISOString(),
            })
        })

        recentPatients.forEach((patient) => {
            activities.push({
                id: `patient-${patient.id}`,
                action: "New patient registered",
                entityType: "PATIENT",
                entityName: `${patient.user.firstName} ${patient.user.lastName}`,
                performedBy: "System",
                createdAt: patient.createdAt.toISOString(),
            })
        })

        recentServices.forEach((service) => {
            // ✅ Handle multiple doctors - show first doctor or "Multiple doctors"
            const doctorNames = service.doctors.map(
                (d) => `Dr. ${d.user.firstName} ${d.user.lastName}`
            )
            const performedBy = doctorNames.length > 0
                ? (doctorNames.length === 1 ? doctorNames[0] : `${doctorNames.length} doctors`)
                : "Admin"

            activities.push({
                id: `service-${service.id}`,
                action: "New service created",
                entityType: "SERVICE",
                entityName: service.name,
                performedBy,
                createdAt: service.createdAt.toISOString(),
            })
        })

        // Sort by date and take top 15
        activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        return NextResponse.json(activities.slice(0, 15))
    } catch (error) {
        console.error("GET /api/admin/dashboard/activity error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
