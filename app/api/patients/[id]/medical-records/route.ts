import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()

    const records = await prisma.medicalRecord.findMany({
      where: { patientId: params.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(records)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const data = await req.json()

    const record = await prisma.medicalRecord.create({
      data: {
        patientId: params.id,
        ...data,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create record" }, { status: 400 })
  }
}
