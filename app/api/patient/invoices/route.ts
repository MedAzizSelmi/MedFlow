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

        // Get invoices
        const invoices = await prisma.invoice.findMany({
            where: { patientId: patient.id },
            include: {
                clinic: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(invoices)
    } catch (error) {
        console.error("GET /api/patient/invoices error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
