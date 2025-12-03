import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "PATIENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const patient = await prisma.patient.findUnique({
        where: { userId },
        select: { id: true, clinicId: true },
    })

    if (!patient?.clinicId) return NextResponse.json([])

    const appointments = await prisma.appointment.findMany({
        where: { clinicId: patient.clinicId, patientId: patient.id },
        include: {
            doctor: {
                include: {
                    user: { select: { firstName: true, lastName: true } },
                },
            },
            service: { select: { name: true, price: true, duration: true } },
        },
        orderBy: { appointmentDate: "asc" },
    })

    return NextResponse.json(appointments)
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "PATIENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { doctorId, serviceId, appointmentDate, notes } = body

    if (!doctorId || !serviceId || !appointmentDate) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userId = (session.user as any).id
    const patient = await prisma.patient.findUnique({
        where: { userId },
        select: { id: true, clinicId: true },
    })
    if (!patient?.clinicId) {
        return NextResponse.json({ error: "No clinic found" }, { status: 400 })
    }

    // duplicate‑in‑same‑day check (same as receptionist)
    const dt = new Date(appointmentDate)
    const startOfDay = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0)
    const endOfDay = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59)

    const existing = await prisma.appointment.findFirst({
        where: {
            patientId: patient.id,
            doctorId,
            appointmentDate: { gte: startOfDay, lte: endOfDay },
            status: "SCHEDULED",
        },
    })
    if (existing) {
        return NextResponse.json(
            { error: "Duplicate booking for this doctor on the same day" },
            { status: 409 },
        )
    }

    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { duration: true },
    })
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 })

    const created = await prisma.appointment.create({
        data: {
            clinicId: patient.clinicId,
            patientId: patient.id,
            doctorId,
            serviceId,
            appointmentDate: dt,
            duration: service.duration,
            notes: notes || null,
            status: "SCHEDULED",
        },
    })

    return NextResponse.json(created, { status: 201 })
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "PATIENT") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = (session.user as any).id
        const body = await req.json()
        const { appointmentId, appointmentDate, notes, action } = body

        // Get patient record
        const patient = await prisma.patient.findUnique({
            where: { userId },
            select: { id: true },
        })

        if (!patient) {
            return NextResponse.json({ error: "Patient profile not found" }, { status: 404 })
        }

        // Verify appointment belongs to patient
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        })

        if (!appointment || appointment.patientId !== patient.id) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
        }

        // Handle cancel action
        if (action === "cancel") {
            // Use transaction to cancel both appointment and invoice
            const result = await prisma.$transaction(async (tx) => {
                // Cancel the appointment
                const updatedAppointment = await tx.appointment.update({
                    where: { id: appointmentId },
                    data: { status: "CANCELLED" },
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
                        service: true,
                    },
                })

                // Find and cancel related pending invoice
                const relatedInvoice = await tx.invoice.findFirst({
                    where: {
                        patientId: patient.id,
                        status: "PENDING",
                        description: {
                            contains: `[APT:${appointmentId}]`,
                        },
                    },
                })

                if (relatedInvoice) {
                    // Cancel the invoice
                    await tx.invoice.update({
                        where: { id: relatedInvoice.id },
                        data: { status: "CANCELLED" },
                    })
                    console.log(`✅ Cancelled invoice ${relatedInvoice.invoiceNumber} for appointment ${appointmentId}`)
                }

                return updatedAppointment
            })

            return NextResponse.json(result)
        }

        // Handle reschedule
        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined,
                notes: notes !== undefined ? notes : undefined,
            },
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
                service: true,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("PUT /api/patient/appointments error", error)
        return NextResponse.json({ error: "Failed to update appointment" }, { status: 400 })
    }
}

