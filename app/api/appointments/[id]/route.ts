import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
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
        service: true,
        consultation: {
          include: {
            prescriptions: true,
          },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    return NextResponse.json(appointment)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const data = await req.json()

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: data.status,
        appointmentDate: data.appointmentDate ? new Date(data.appointmentDate) : undefined,
        notes: data.notes,
      },
    })

    return NextResponse.json(appointment)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()

    await prisma.appointment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Appointment deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 400 })
  }
}
