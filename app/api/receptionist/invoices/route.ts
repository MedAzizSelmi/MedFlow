import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMIN", "RECEPTIONIST"].includes((session.user as any)?.role)) {
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

        const invoices = await prisma.invoice.findMany({
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
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(invoices)
    } catch (error) {
        console.error("GET /api/receptionist/invoices error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "RECEPTIONIST") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { patientId, amount, tax, description, dueDate } = body

        const receptionistUserId = (session.user as any).id
        const user = await prisma.user.findUnique({
            where: { id: receptionistUserId },
            select: { clinicId: true },
        })

        const clinicId = user?.clinicId
        if (!clinicId) {
            return NextResponse.json({ error: "No clinic" }, { status: 400 })
        }

        // Generate invoice number
        const invoiceCount = await prisma.invoice.count({ where: { clinicId } })
        const invoiceNumber = `INV-${clinicId.slice(-4)}-${String(invoiceCount + 1).padStart(5, "0")}`

        const taxAmount = tax || 0
        const totalAmount = amount + taxAmount

        const invoice = await prisma.invoice.create({
            data: {
                clinicId,
                patientId,
                invoiceNumber,
                amount,
                tax: taxAmount,
                totalAmount,
                status: "PENDING",
                dueDate: new Date(dueDate),
                description: description || null,
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
            },
        })

        return NextResponse.json(invoice, { status: 201 })
    } catch (error) {
        console.error("POST /api/receptionist/invoices error", error)
        return NextResponse.json({ error: "Failed to create invoice" }, { status: 400 })
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "RECEPTIONIST") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { id, status, paymentDate } = body

        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                status: status || undefined,
                paymentDate: paymentDate ? new Date(paymentDate) : undefined,
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
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("PUT /api/receptionist/invoices error", error)
        return NextResponse.json({ error: "Failed to update invoice" }, { status: 400 })
    }
}
