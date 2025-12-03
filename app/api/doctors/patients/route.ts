import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "DOCTOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = (session.user as any).id

        // Get doctor record
        const doctor = await prisma.doctor.findUnique({
            where: { userId },
            select: { id: true, clinicId: true },
        })

        if (!doctor) {
            return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 })
        }

        // Get all patients who have appointments with this doctor
        const appointments = await prisma.appointment.findMany({
            where: { doctorId: doctor.id },
            select: {
                patient: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
        })

        // Extract unique patients (remove duplicates)
        const uniquePatients = Array.from(
            new Map(
                appointments.map(apt => [apt.patient.id, apt.patient])
            ).values()
        )

        return NextResponse.json(uniquePatients)
    } catch (error) {
        console.error("GET /api/doctors/patients error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
