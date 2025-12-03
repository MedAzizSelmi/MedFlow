import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["DOCTOR", "ADMIN"].includes((session.user as any)?.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Validate file type
        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Create unique filename
        const timestamp = Date.now()
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        const filename = `${timestamp}-${originalName}`

        // Save to public/uploads directory
        const uploadDir = join(process.cwd(), "public", "uploads")
        const filePath = join(uploadDir, filename)

        // Create directory if it doesn't exist
        const fs = require("fs")
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }

        await writeFile(filePath, buffer)

        // Return the URL path
        const fileUrl = `/uploads/${filename}`

        return NextResponse.json({ url: fileUrl, filename })
    } catch (error) {
        console.error("File upload error:", error)
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }
}
