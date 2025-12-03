import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        const userRole = (session?.user as any)?.role

        // Allow ADMIN, DOCTOR, RECEPTIONIST, and PATIENT to view doctors
        if (!session || !["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"].includes(userRole)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = (session.user as any).id
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { clinicId: true },
        })

        const clinicId = user?.clinicId
        if (!clinicId) {
            return NextResponse.json([], { status: 200 })
        }

        const doctors = await prisma.doctor.findMany({
            where: { clinicId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        isActive: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(doctors)
    } catch (error) {
        console.error("GET /api/doctors error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}