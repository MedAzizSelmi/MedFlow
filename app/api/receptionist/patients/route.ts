import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import bcrypt from "bcryptjs"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "RECEPTIONIST") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const receptionistUserId = (session.user as any).id
        const user = await prisma.user.findUnique({
            where: { id: receptionistUserId },
            select: { clinicId: true },
        })

        const clinicId = user?.clinicId
        if (!clinicId) {
            return NextResponse.json([], { status: 200 })
        }

        const patients = await prisma.patient.findMany({
            where: { clinicId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        isActive: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(patients)
    } catch (error) {
        console.error("GET /api/receptionist/patients error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "RECEPTIONIST") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const {
            email,
            firstName,
            lastName,
            phone,
            password,
            dateOfBirth,
            gender,
            bloodType,
            allergies,
            emergencyContact,
            emergencyPhone,
            insuranceProvider,
            insuranceNumber,
        } = body

        const receptionistUserId = (session.user as any).id
        const user = await prisma.user.findUnique({
            where: { id: receptionistUserId },
            select: { clinicId: true },
        })

        const clinicId = user?.clinicId
        if (!clinicId) {
            return NextResponse.json({ error: "No clinic" }, { status: 400 })
        }

        // Check if email already exists
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json({ error: "Email already exists" }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password || "patient123", 10)

        // Create user and patient in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    phone: phone || null,
                    role: "PATIENT",
                    clinicId,
                },
            })

            const newPatient = await tx.patient.create({
                data: {
                    userId: newUser.id,
                    clinicId,
                    dateOfBirth: new Date(dateOfBirth),
                    gender: gender || null,
                    bloodType: bloodType || null,
                    allergies: allergies || null,
                    emergencyContact: emergencyContact || null,
                    emergencyPhone: emergencyPhone || null,
                    insuranceProvider: insuranceProvider || null,
                    insuranceNumber: insuranceNumber || null,
                },
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
                },
            })

            return newPatient
        })

        return NextResponse.json(result, { status: 201 })
    } catch (error) {
        console.error("POST /api/receptionist/patients error", error)
        return NextResponse.json({ error: "Failed to create patient" }, { status: 400 })
    }
}
