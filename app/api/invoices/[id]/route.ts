import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        clinic: true,
        patient: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const data = await req.json()

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: data.status,
        paymentDate: data.status === "PAID" ? new Date() : undefined,
        stripePaymentId: data.stripePaymentId,
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 400 })
  }
}
