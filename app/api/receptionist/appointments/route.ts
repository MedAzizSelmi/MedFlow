import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "RECEPTIONIST") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const receptionistUserId = (session.user as any).id
        const user = await prisma.user.findUnique({
            where: { id: receptionistUserId },
            select: { clinicId: true },
        })

        const clinicId = user?.clinicId
        if (!clinicId) {
            return NextResponse.json([], { status: 200 })
        }

        const appointments = await prisma.appointment.findMany({
            where: { clinicId },
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
                service: {
                    select: {
                        name: true,
                        price: true,
                        duration: true,
                    },
                },
            },
            orderBy: { appointmentDate: "asc" },
        })

        return NextResponse.json(appointments)
    } catch (error) {
        console.error("GET /api/receptionist/appointments error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMIN", "RECEPTIONIST"].includes((session.user as any)?.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { patientId, doctorId, serviceId, appointmentDate, notes } = body

        if (!patientId || !doctorId || !serviceId || !appointmentDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Get user's clinicId from database
        const userId = (session.user as any).id
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { clinicId: true },
        })

        const clinicId = user?.clinicId
        if (!clinicId) {
            return NextResponse.json({ error: "No clinic found" }, { status: 400 })
        }

        // Check for duplicate booking on the same day
        const appointmentDateTime = new Date(appointmentDate)
        const startOfDay = new Date(
            appointmentDateTime.getFullYear(),
            appointmentDateTime.getMonth(),
            appointmentDateTime.getDate(),
            0, 0, 0
        )
        const endOfDay = new Date(
            appointmentDateTime.getFullYear(),
            appointmentDateTime.getMonth(),
            appointmentDateTime.getDate(),
            23, 59, 59
        )

        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                patientId,
                doctorId,
                appointmentDate: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: {
                    in: ["SCHEDULED"],
                },
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
            },
        })

        if (existingAppointment) {
            return NextResponse.json(
                {
                    error: "Duplicate booking",
                    message: `Patient already has an appointment with Dr. ${existingAppointment.doctor.user.firstName} ${existingAppointment.doctor.user.lastName} on ${appointmentDateTime.toLocaleDateString()}`,
                },
                { status: 409 }
            )
        }

        // Get service to determine duration and price
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            select: {
                duration: true,
                price: true,
                name: true,
            },
        })

        if (!service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 })
        }

        // Create the appointment and invoice in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the appointment
            const appointment = await tx.appointment.create({
                data: {
                    patientId,
                    doctorId,
                    serviceId,
                    clinicId,
                    appointmentDate: appointmentDateTime,
                    duration: service.duration,
                    notes: notes || null,
                    status: "SCHEDULED",
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
                    service: {
                        select: {
                            name: true,
                            price: true,
                            duration: true,
                        },
                    },
                },
            })

            // Generate unique invoice number
            const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

            // Calculate tax (e.g., 10%)
            const taxRate = 0.10
            const amount = service.price
            const tax = amount * taxRate
            const totalAmount = amount + tax

            // Set due date (e.g., same day as appointment)
            const dueDate = appointmentDateTime

            // Create invoice
            const invoice = await tx.invoice.create({
                data: {
                    clinicId,
                    patientId,
                    invoiceNumber,
                    amount,
                    tax,
                    totalAmount,
                    status: "PENDING",
                    dueDate,
                    description: `${service.name} - Appointment with Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
                },
            })

            return { appointment, invoice }
        })

        return NextResponse.json(result.appointment, { status: 201 })
    } catch (error) {
        console.error("POST /api/receptionist/appointments error", error)
        return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "RECEPTIONIST") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { id, status, notes, appointmentDate } = body

        const updated = await prisma.appointment.update({
            where: { id },
            data: {
                status: status || undefined,
                notes: notes !== undefined ? notes : undefined,
                appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined,
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
        console.error("PUT /api/receptionist/appointments error", error)
        return NextResponse.json({ error: "Failed to update appointment" }, { status: 400 })
    }
}
