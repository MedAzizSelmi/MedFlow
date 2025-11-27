import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: {
        appointment: {
          include: {
            service: true,
          },
        },
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
        prescriptions: true,
      },
    })

    if (!consultation) {
      return NextResponse.json({ error: "Consultation not found" }, { status: 404 })
    }

    return NextResponse.json(consultation)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const data = await req.json()

    const consultation = await prisma.consultation.update({
      where: { id: params.id },
      data: {
        diagnosis: data.diagnosis,
        symptoms: data.symptoms,
        treatment: data.treatment,
        notes: data.notes,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      },
    })

    return NextResponse.json(consultation)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update consultation" }, { status: 400 })
  }
}
