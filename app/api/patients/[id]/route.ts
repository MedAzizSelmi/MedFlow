import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()

    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        appointments: {
          include: {
            doctor: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
            service: true,
          },
          orderBy: { appointmentDate: "desc" },
        },
        medicalRecords: {
          orderBy: { createdAt: "desc" },
        },
        consultations: {
          include: {
            prescriptions: true,
          },
          orderBy: { createdAt: "desc" },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const data = await req.json()

    const patient = await prisma.patient.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(patient)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update patient" }, { status: 400 })
  }
}
