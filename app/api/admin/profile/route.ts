import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import bcrypt from "bcryptjs"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const adminUserId = (session.user as any).id
        const user = await prisma.user.findUnique({
            where: { id: adminUserId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                profileImage: true,
                clinicId: true,
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        city: true,
                        postalCode: true,
                        phone: true,
                        email: true,
                        licenseNumber: true,
                        logo: true,
                    },
                },
            },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error("GET /api/admin/profile error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const adminUserId = (session.user as any).id

        // Check if this is a password change request
        if (body.currentPassword && body.newPassword) {
            // Validate password change
            if (!body.currentPassword || !body.newPassword) {
                return NextResponse.json({ error: "All password fields are required" }, { status: 400 })
            }

            if (body.newPassword.length < 6) {
                return NextResponse.json(
                    { error: "New password must be at least 6 characters" },
                    { status: 400 }
                )
            }

            // Get current user with password
            const user = await prisma.user.findUnique({
                where: { id: adminUserId },
                select: { password: true },
            })

            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 })
            }

            // Verify current password
            const isValid = await bcrypt.compare(body.currentPassword, user.password)
            if (!isValid) {
                return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(body.newPassword, 10)

            // Update password
            await prisma.user.update({
                where: { id: adminUserId },
                data: { password: hashedPassword },
            })

            return NextResponse.json({ message: "Password changed successfully" })
        }

        // Otherwise, update profile info
        const updatedUser = await prisma.user.update({
            where: { id: adminUserId },
            data: {
                firstName: body.firstName,
                lastName: body.lastName,
                phone: body.phone || null,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                profileImage: true,
            },
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("PUT /api/admin/profile error", error)
        return NextResponse.json({ error: "Failed to update profile" }, { status: 400 })
    }
}
