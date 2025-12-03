import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "DOCTOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const patientId = searchParams.get("patientId")

        const doctorUserId = (session.user as any).id
        const doctor = await prisma.doctor.findUnique({
            where: { userId: doctorUserId },
            select: { id: true, clinicId: true },
        })

        if (!doctor) {
            return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 })
        }

        // Get records for doctor's patients
        const whereClause: any = {}

        if (patientId) {
            whereClause.patientId = patientId
        }

        const records = await prisma.medicalRecord.findMany({
            where: whereClause,
            include: {
                patient: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(records)
    } catch (error) {
        console.error("GET /api/doctor/medical-records error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "DOCTOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { patientId, recordType, description, attachmentUrl } = body

        const record = await prisma.medicalRecord.create({
            data: {
                patientId,
                recordType,
                description,
                attachmentUrl: attachmentUrl || null,
            },
            include: {
                patient: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        })

        return NextResponse.json(record, { status: 201 })
    } catch (error) {
        console.error("POST /api/doctor/medical-records error", error)
        return NextResponse.json({ error: "Failed to create medical record" }, { status: 400 })
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "DOCTOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { id, recordType, description, attachmentUrl } = body

        const updated = await prisma.medicalRecord.update({
            where: { id },
            data: {
                recordType,
                description,
                attachmentUrl: attachmentUrl || null,
            },
            include: {
                patient: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("PUT /api/doctor/medical-records error", error)
        return NextResponse.json({ error: "Failed to update medical record" }, { status: 400 })
    }
}
