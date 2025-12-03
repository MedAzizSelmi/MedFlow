import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "PATIENT") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = (session.user as any).id

        // Get patient record
        const patient = await prisma.patient.findUnique({
            where: { userId },
            select: { id: true },
        })

        if (!patient) {
            return NextResponse.json({ error: "Patient profile not found" }, { status: 404 })
        }

        // Get prescriptions
        const prescriptions = await prisma.prescription.findMany({
            where: { patientId: patient.id },
            include: {
                consultation: {
                    include: {
                        doctor: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                        appointment: {
                            select: {
                                appointmentDate: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(prescriptions)
    } catch (error) {
        console.error("GET /api/patient/prescriptions error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
