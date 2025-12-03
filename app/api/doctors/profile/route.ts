import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import bcrypt from "bcryptjs"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "DOCTOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = (session.user as any).id

        const doctor = await prisma.doctor.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        profileImage: true,
                    },
                },
                clinic: {
                    select: {
                        name: true,
                        address: true,
                        city: true,
                        phone: true,
                    },
                },
            },
        })

        if (!doctor) {
            return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 })
        }

        return NextResponse.json(doctor)
    } catch (error) {
        console.error("GET /api/doctors/profile error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "DOCTOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = (session.user as any).id
        const body = await req.json()
        const { firstName, lastName, phone, specialization, experience, bio, availableHours, currentPassword, newPassword } = body

        // If changing password, verify current password
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: "Current password required" }, { status: 400 })
            }

            const user = await prisma.user.findUnique({ where: { id: userId } })
            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 })
            }

            const isValid = await bcrypt.compare(currentPassword, user.password)
            if (!isValid) {
                return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10)
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword },
            })
        }

        // Update user info
        await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                phone: phone || undefined,
            },
        })

        // Update doctor profile
        const doctor = await prisma.doctor.update({
            where: { userId },
            data: {
                specialization: specialization || undefined,
                experience: experience ? Number(experience) : undefined,
                bio: bio || undefined,
                availableHours: availableHours || undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        profileImage: true,
                    },
                },
                clinic: {
                    select: {
                        name: true,
                        address: true,
                        city: true,
                        phone: true,
                    },
                },
            },
        })

        return NextResponse.json(doctor)
    } catch (error) {
        console.error("PUT /api/doctors/profile error", error)
        return NextResponse.json({ error: "Failed to update profile" }, { status: 400 })
    }
}
