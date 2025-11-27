import { prisma } from "@/lib/prisma"
import  auth  from "@/auth"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const doctorId = searchParams.get("doctorId")
    const patientId = searchParams.get("patientId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {}

    if (doctorId) where.doctorId = doctorId
    if (patientId) where.patientId = patientId
    if (startDate && endDate) {
      where.appointmentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        service: true,
      },
      orderBy: { appointmentDate: "asc" },
      take: 100,
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    const clinic = await prisma.clinic.findFirst()
    if (!clinic) throw new Error("No clinic found")

    const appointment = await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        patientId: data.patientId,
        doctorId: data.doctorId,
        serviceId: data.serviceId,
        appointmentDate: new Date(data.appointmentDate),
        duration: data.duration || 30,
        notes: data.notes,
      },
      include: {
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
        service: true,
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 400 })
  }
}
