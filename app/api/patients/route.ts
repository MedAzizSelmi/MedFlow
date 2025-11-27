// app/api/patients/route.ts
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    try {
        console.log("🔍 Starting patients API call...")

        const session = await getServerSession(authOptions)
        console.log("🔍 Session:", session)

        if (!session) {
            console.log("❌ No session found")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const searchParams = req.nextUrl.searchParams
        const userId = searchParams.get("userId")
        const email = searchParams.get("search")

        console.log("🔍 Query params:", { userId, email })

        const where: any = {}

        if (userId) {
            where.userId = userId
        }

        if (email) {
            where.user = { email: { contains: email, mode: 'insensitive' } }
        }

        console.log("🔍 Prisma where clause:", where)

        const patients = await prisma.patient.findMany({
            where,
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
            take: 100,
        })

        console.log("✅ Patients found:", patients.length)
        return NextResponse.json(patients)

    } catch (error) {
        console.error("❌ Error fetching patients:", error)
        return NextResponse.json(
            { error: "Failed to fetch patients: " + (error as Error).message },
            { status: 500 }
        )
    }
}