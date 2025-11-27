// app/api/medical-records/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const patientId = searchParams.get('patientId')

        // For patients, they can only access their own records
        if ((session.user as any).role === "PATIENT") {
            // Find the patient record for this user
            const patient = await prisma.patient.findFirst({
                where: { userId: (session.user as any).id }
            })

            if (!patient) {
                return NextResponse.json([], { status: 200 }) // No patient record found
            }

            const records = await prisma.medicalRecord.findMany({
                where: { patientId: patient.id },
                orderBy: { createdAt: 'desc' }
            })

            return NextResponse.json(records)
        }

        // For staff (doctors, admins), they can access records with patientId filter
        if (patientId) {
            const records = await prisma.medicalRecord.findMany({
                where: { patientId },
                orderBy: { createdAt: 'desc' }
            })
            return NextResponse.json(records)
        }

        // If no patientId provided for staff, return empty or all records (be careful with this)
        return NextResponse.json([])

    } catch (error) {
        console.error("Failed to fetch medical records:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Only staff can create medical records
        if ((session.user as any).role === "PATIENT") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const data = await request.json()

        // Validate required fields
        if (!data.patientId || !data.recordType || !data.description) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        const record = await prisma.medicalRecord.create({
            data: {
                patientId: data.patientId,
                recordType: data.recordType,
                description: data.description,
                attachmentUrl: data.attachmentUrl || null,
            }
        })

        return NextResponse.json(record, { status: 201 })

    } catch (error) {
        console.error("Failed to create medical record:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}