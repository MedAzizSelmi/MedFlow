import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = (session.user as any).id
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { clinicId: true },
        })

        const clinicId = user?.clinicId
        if (!clinicId) {
            return NextResponse.json([])
        }

        const services = await prisma.service.findMany({
            where: { clinicId, isActive: true },
            include: {
                doctors: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(services)
    } catch (error) {
        console.error("GET /api/services error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMIN", "DOCTOR"].includes((session.user as any)?.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { name, description, price, duration, doctorIds } = body

        const userId = (session.user as any).id
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { clinicId: true },
        })

        const clinicId = user?.clinicId
        if (!clinicId) {
            return NextResponse.json({ error: "No clinic found" }, { status: 400 })
        }

        if (!doctorIds || !Array.isArray(doctorIds) || doctorIds.length === 0) {
            return NextResponse.json({ error: "At least one doctor is required" }, { status: 400 })
        }

        // Verify all doctors belong to this clinic
        const doctors = await prisma.doctor.findMany({
            where: {
                id: { in: doctorIds },
                clinicId,
            },
        })

        if (doctors.length !== doctorIds.length) {
            return NextResponse.json({ error: "Invalid doctors" }, { status: 400 })
        }

        const service = await prisma.service.create({
            data: {
                name,
                description: description || null,
                price: parseFloat(price),
                duration: parseInt(duration),
                clinicId,
                isActive: true,
                doctors: {
                    connect: doctorIds.map((id: string) => ({ id })),
                },
            },
            include: {
                doctors: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        })

        return NextResponse.json(service, { status: 201 })
    } catch (error) {
        console.error("POST /api/services error:", error)
        return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMIN", "DOCTOR"].includes((session.user as any)?.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { id, name, description, price, duration, isActive, doctorIds } = body

        if (!id) {
            return NextResponse.json({ error: "Service ID required" }, { status: 400 })
        }

        const updateData: any = {
            name,
            description: description || null,
            price: parseFloat(price),
            duration: parseInt(duration),
            isActive,
        }

        if (doctorIds && Array.isArray(doctorIds)) {
            const userId = (session.user as any).id
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { clinicId: true },
            })
            const clinicId = user?.clinicId

            if (clinicId) {
                const doctors = await prisma.doctor.findMany({
                    where: {
                        id: { in: doctorIds },
                        clinicId,
                    },
                })

                if (doctors.length === doctorIds.length) {
                    updateData.doctors = {
                        set: doctorIds.map((doctorId: string) => ({ id: doctorId })),
                    }
                }
            }
        }

        const service = await prisma.service.update({
            where: { id },
            data: updateData,
            include: {
                doctors: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        })

        return NextResponse.json(service)
    } catch (error) {
        console.error("PUT /api/services error:", error)
        return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMIN"].includes((session.user as any)?.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "Service ID required" }, { status: 400 })
        }

        await prisma.service.delete({
            where: { id },
        })

        return NextResponse.json({ message: "Service deleted successfully" })
    } catch (error) {
        console.error("DELETE /api/services error:", error)
        return NextResponse.json({ error: "Failed to delete service" }, { status: 500 })
    }
}
