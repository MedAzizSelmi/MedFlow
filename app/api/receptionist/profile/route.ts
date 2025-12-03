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

        const userId = (session.user as any).id

        const receptionist = await prisma.receptionist.findUnique({
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
                        clinic: {
                            select: {
                                name: true,
                                address: true,
                                city: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
        })

        if (!receptionist) {
            return NextResponse.json({ error: "Receptionist profile not found" }, { status: 404 })
        }

        return NextResponse.json(receptionist)
    } catch (error) {
        console.error("GET /api/receptionist/profile error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "RECEPTIONIST") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = (session.user as any).id
        const body = await req.json()
        const { firstName, lastName, phone, department, currentPassword, newPassword } = body

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

        // Update receptionist profile
        const receptionist = await prisma.receptionist.update({
            where: { userId },
            data: {
                department: department || undefined,
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
                        clinic: {
                            select: {
                                name: true,
                                address: true,
                                city: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
        })

        return NextResponse.json(receptionist)
    } catch (error) {
        console.error("PUT /api/receptionist/profile error", error)
        return NextResponse.json({ error: "Failed to update profile" }, { status: 400 })
    }
}
