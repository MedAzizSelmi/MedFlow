import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "PATIENT") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params // Added await here

        const userId = (session.user as any).id

        // Get patient record
        const patient = await prisma.patient.findUnique({
            where: { userId },
            select: { id: true },
        })

        if (!patient) {
            return NextResponse.json({ error: "Patient profile not found" }, { status: 404 })
        }

        // Get invoice
        const invoice = await prisma.invoice.findUnique({
            where: { id }, // Using id from awaited params
            include: {
                clinic: {
                    select: {
                        name: true,
                        address: true,
                        city: true,
                        postalCode: true,
                        email: true,
                        phone: true,
                    },
                },
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
            },
        })

        if (!invoice || invoice.patientId !== patient.id) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
        }

        return NextResponse.json(invoice)
    } catch (error) {
        console.error("GET /api/patient/invoices/[id] error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
