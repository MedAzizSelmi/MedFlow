import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "DOCTOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const doctorUserId = (session.user as any).id

        // Get the doctor record
        const doctor = await prisma.doctor.findUnique({
            where: { userId: doctorUserId },
            select: { id: true, clinicId: true },
        })

        if (!doctor) {
            return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 })
        }

        // Get appointments for this doctor
        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId: doctor.id,
            },
            include: {
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
                service: {
                    select: {
                        name: true,
                        duration: true,
                        price: true,
                    },
                },
            },
            orderBy: {
                appointmentDate: "asc",
            },
        })

        return NextResponse.json(appointments)
    } catch (error) {
        console.error("GET /api/doctor/appointments error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "DOCTOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { appointmentId, status, notes } = body

        const doctorUserId = (session.user as any).id
        const doctor = await prisma.doctor.findUnique({
            where: { userId: doctorUserId },
            select: { id: true },
        })

        if (!doctor) {
            return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 })
        }

        // Verify appointment belongs to this doctor
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        })

        if (!appointment || appointment.doctorId !== doctor.id) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
        }

        // Update appointment
        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: status || appointment.status,
                notes: notes !== undefined ? notes : appointment.notes,
            },
            include: {
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
                service: {
                    select: {
                        name: true,
                        duration: true,
                    },
                },
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("PUT /api/doctor/appointments error", error)
        return NextResponse.json({ error: "Failed to update appointment" }, { status: 400 })
    }
}
