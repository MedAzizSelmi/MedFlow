import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()

    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        services: true,
      },
    })

    return NextResponse.json(doctors)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const data = await req.json()

    const hashedPassword = await bcrypt.hash(data.password || "password123", 10)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "DOCTOR",
        phone: data.phone,
      },
    })

    const clinic = await prisma.clinic.findFirst()
    if (!clinic) throw new Error("No clinic found")

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        clinicId: clinic.id,
        specialization: data.specialization,
        licenseNumber: data.licenseNumber,
        experience: data.experience,
        bio: data.bio,
      },
    })

    return NextResponse.json(doctor, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create doctor" }, { status: 400 })
  }
}
