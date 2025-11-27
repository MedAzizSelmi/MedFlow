import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()

    const services = await prisma.service.findMany({
      include: {
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(services)
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

    const service = await prisma.service.create({
      data: {
        clinicId: clinic.id,
        doctorId: data.doctorId,
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create service" }, { status: 400 })
  }
}
