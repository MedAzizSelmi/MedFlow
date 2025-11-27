
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = req.nextUrl.searchParams
    const patientId = searchParams.get("patientId")
    const status = searchParams.get("status")

    const where: any = {}
    if (patientId) where.patientId = patientId
    if (status) where.status = status

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        clinic: { select: { name: true } },
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const data = await req.json()

    const clinic = await prisma.clinic.findFirst()
    if (!clinic) throw new Error("No clinic found")

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    })

    const lastNumber = lastInvoice?.invoiceNumber ? Number.parseInt(lastInvoice.invoiceNumber.split("-")[1]) : 0
    const invoiceNumber = `INV-${String(lastNumber + 1).padStart(5, "0")}`

    const tax = data.amount * 0.1 // 10% tax
    const totalAmount = data.amount + tax

    const invoice = await prisma.invoice.create({
      data: {
        clinicId: clinic.id,
        patientId: data.patientId,
        invoiceNumber,
        amount: data.amount,
        tax,
        totalAmount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        description: data.description,
      },
      include: {
        clinic: { select: { name: true } },
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 400 })
  }
}
