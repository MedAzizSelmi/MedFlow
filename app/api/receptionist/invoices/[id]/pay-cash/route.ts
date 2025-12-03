import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "RECEPTIONIST") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params // Added await

        // Update invoice to PAID
        const invoice = await prisma.invoice.update({
            where: { id },
            data: {
                status: "PAID",
                paymentDate: new Date(),
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
            },
        })

        return NextResponse.json(invoice)
    } catch (error) {
        console.error("Cash payment error:", error)
        return NextResponse.json({ error: "Failed to process cash payment" }, { status: 400 })
    }
}
