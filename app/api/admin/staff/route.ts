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
        const admin = await prisma.user.findUnique({ where: { id: adminUserId }, select: { clinicId: true } })
        const clinicId = admin?.clinicId
        if (!clinicId) return NextResponse.json([], { status: 200 })

        const users = await prisma.user.findMany({
            where: { clinicId, NOT: { role: "PATIENT" } },
            select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, isActive: true },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error("GET /api/admin/staff error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const {
            email, firstName, lastName, password, role,
            specialization, licenseNumber, experience, department,
            availableFrom, availableTo, availableDays // Add these
        } = body

        const adminUserId = (session.user as any).id
        const admin = await prisma.user.findUnique({ where: { id: adminUserId }, select: { clinicId: true } })
        const clinicId = admin?.clinicId
        if (!clinicId) return NextResponse.json({ error: "Admin has no clinic" }, { status: 400 })

        // check email uniqueness
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 })

        const hashed = await bcrypt.hash(password || "password123", 10)

        const createdUser = await prisma.user.create({
            data: {
                email,
                password: hashed,
                firstName,
                lastName,
                role,
                clinicId,
                phone: body.phone || null,
            },
        })

        // create role-specific profile
        if (role === "DOCTOR") {
            await prisma.doctor.create({
                data: {
                    userId: createdUser.id,
                    clinicId,
                    specialization: specialization || "",
                    licenseNumber: licenseNumber || "",
                    experience: Number(experience) || 0,
                    availableFrom: availableFrom || "09:00", // Add this
                    availableTo: availableTo || "17:00", // Add this
                    availableDays: availableDays || [], // Add this
                },
            })
        } else if (role === "RECEPTIONIST") {
            await prisma.receptionist.create({
                data: {
                    userId: createdUser.id,
                    clinicId,
                    department: department || "",
                },
            })
        }

        return NextResponse.json({ message: "Staff created", user: { id: createdUser.id, email: createdUser.email } }, { status: 201 })
    } catch (error) {
        console.error("POST /api/admin/staff error", error)
        return NextResponse.json({ error: "Failed to create staff" }, { status: 400 })
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const userId = searchParams.get("id")

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

        const adminUserId = (session.user as any).id
        const admin = await prisma.user.findUnique({ where: { id: adminUserId }, select: { clinicId: true } })
        const clinicId = admin?.clinicId

        if (!clinicId) {
            return NextResponse.json({ error: "Admin has no clinic" }, { status: 400 })
        }

        // Verify the user belongs to the admin's clinic and is not a patient
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId },
            select: { clinicId: true, role: true, id: true },
        })

        if (!userToDelete || userToDelete.clinicId !== clinicId) {
            return NextResponse.json({ error: "User not found or unauthorized" }, { status: 404 })
        }

        if (userToDelete.role === "PATIENT") {
            return NextResponse.json({ error: "Cannot delete patients from staff management" }, { status: 400 })
        }

        // Prevent admin from deleting themselves
        if (userToDelete.id === adminUserId) {
            return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
        }

        // Delete role-specific profile first
        if (userToDelete.role === "DOCTOR") {
            await prisma.doctor.deleteMany({ where: { userId } })
        } else if (userToDelete.role === "RECEPTIONIST") {
            await prisma.receptionist.deleteMany({ where: { userId } })
        }

        // Delete the user
        await prisma.user.delete({ where: { id: userId } })

        return NextResponse.json({ message: "Staff member deleted successfully" })
    } catch (error) {
        console.error("DELETE /api/admin/staff error", error)
        return NextResponse.json({ error: "Failed to delete staff member" }, { status: 400 })
    }
}
