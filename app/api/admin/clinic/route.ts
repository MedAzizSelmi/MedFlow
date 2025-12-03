// app/api/admin/clinic/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Admin user might be assigned to a clinic (user.clinicId)
        const adminUserId = (session.user as any).id
        const user = await prisma.user.findUnique({ where: { id: adminUserId }, select: { clinicId: true } })

        if (!user?.clinicId) {
            return NextResponse.json(null)
        }

        const clinic = await prisma.clinic.findUnique({
            where: { id: user.clinicId },
        })

        return NextResponse.json(clinic)
    } catch (error) {
        console.error("GET /api/admin/clinic error", error)
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
        const adminUserId = (session.user as any).id

        // create clinic
        const clinic = await prisma.clinic.create({
            data: {
                name: body.name,
                address: body.address,
                city: body.city,
                postalCode: body.postalCode,
                phone: body.phone,
                email: body.email,
                licenseNumber: body.licenseNumber,
                logo: body.logo || null,
            },
        })

        // assign admin user to clinic (update user.clinicId)
        await prisma.user.update({
            where: { id: adminUserId },
            data: { clinicId: clinic.id },
        })

        return NextResponse.json(clinic, { status: 201 })
    } catch (error) {
        console.error("POST /api/admin/clinic error", error)
        return NextResponse.json({ error: "Failed to create clinic" }, { status: 400 })
    }
}
