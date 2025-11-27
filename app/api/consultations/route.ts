import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = req.nextUrl.searchParams
    const patientId = searchParams.get("patientId")
    const doctorId = searchParams.get("doctorId")

    const where: any = {}
    if (patientId) where.patientId = patientId
    if (doctorId) where.doctorId = doctorId

    const consultations = await prisma.consultation.findMany({
      where,
      include: {
        appointment: {
          include: {
            service: true,
          },
        },
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        prescriptions: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(consultations)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const data = await req.json()

    const consultation = await prisma.consultation.create({
      data: {
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        diagnosis: data.diagnosis,
        symptoms: data.symptoms,
        treatment: data.treatment,
        notes: data.notes,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      },
      include: {
        appointment: true,
        prescriptions: true,
      },
    })

    // Update appointment status to COMPLETED
    await prisma.appointment.update({
      where: { id: data.appointmentId },
      data: { status: "COMPLETED" },
    })

    return NextResponse.json(consultation, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create consultation" }, { status: 400 })
  }
}
