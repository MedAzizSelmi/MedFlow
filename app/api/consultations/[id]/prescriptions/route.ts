import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const data = await req.json()

    const prescription = await prisma.prescription.create({
      data: {
        consultationId: params.id,
        patientId: data.patientId,
        medication: data.medication,
        dosage: data.dosage,
        frequency: data.frequency,
        duration: data.duration,
        instructions: data.instructions,
        status: "ACTIVE",
      },
    })

    return NextResponse.json(prescription, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create prescription" }, { status: 400 })
  }
}
