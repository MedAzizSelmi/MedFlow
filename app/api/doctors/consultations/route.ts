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

        const doctorUserId = (session.user as any).id
        const doctor = await prisma.doctor.findUnique({
            where: { userId: doctorUserId },
            select: { id: true },
        })

        if (!doctor) {
            return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 })
        }

        const consultations = await prisma.consultation.findMany({
            where: { doctorId: doctor.id },
            include: {
                patient: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
                appointment: {
                    include: {
                        service: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                prescriptions: true,
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(consultations)
    } catch (error) {
        console.error("GET /api/doctor/consultations error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "DOCTOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { appointmentId, patientId, diagnosis, symptoms, treatment, notes, followUpDate, prescriptions } = body

        const doctorUserId = (session.user as any).id
        const doctor = await prisma.doctor.findUnique({
            where: { userId: doctorUserId },
            select: { id: true },
        })

        if (!doctor) {
            return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 })
        }

        // Create consultation with prescriptions
        const consultation = await prisma.consultation.create({
            data: {
                appointmentId,
                patientId,
                doctorId: doctor.id,
                diagnosis,
                symptoms,
                treatment,
                notes: notes || null,
                followUpDate: followUpDate ? new Date(followUpDate) : null,
                prescriptions: prescriptions && prescriptions.length > 0 ? {
                    create: prescriptions.map((p: any) => ({
                        patientId,
                        medication: p.medication,
                        dosage: p.dosage,
                        frequency: p.frequency,
                        duration: p.duration,
                        instructions: p.instructions || null,
                    }))
                } : undefined,
            },
            include: {
                patient: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
                prescriptions: true,
            },
        })

        return NextResponse.json(consultation, { status: 201 })
    } catch (error) {
        console.error("POST /api/doctor/consultations error", error)
        return NextResponse.json({ error: "Failed to create consultation" }, { status: 400 })
    }
}
