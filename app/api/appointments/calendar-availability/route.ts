import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const doctorId = searchParams.get("doctorId")
        const serviceId = searchParams.get("serviceId")
        const month = searchParams.get("month") // YYYY-MM format

        if (!doctorId || !serviceId || !month) {
            return NextResponse.json({ error: "doctorId, serviceId, and month required" }, { status: 400 })
        }

        const [year, monthNum] = month.split("-").map(Number)

        // Get first and last day of the month
        const firstDay = new Date(year, monthNum - 1, 1, 0, 0, 0)
        const lastDay = new Date(year, monthNum, 0, 23, 59, 59)

        // Get doctor and service info - UPDATED TO USE NEW FIELDS
        const [doctor, service] = await Promise.all([
            prisma.doctor.findUnique({
                where: { id: doctorId },
                select: {
                    availableFrom: true,
                    availableTo: true,
                    availableDays: true
                },
            }),
            prisma.service.findUnique({
                where: { id: serviceId },
                select: { duration: true },
            }),
        ])

        if (!doctor || !service) {
            return NextResponse.json({ error: "Doctor or Service not found" }, { status: 404 })
        }

        // Parse availability times - UPDATED
        const startTime = doctor.availableFrom || "09:00"
        const endTime = doctor.availableTo || "17:00"
        const availableDays = doctor.availableDays || []

        const [startHour] = startTime.split(":").map(Number)
        const [endHour] = endTime.split(":").map(Number)
        const duration = service.duration

        // Calculate total slots per day (excluding lunch break 12:00-13:00)
        const morningMinutes = (12 - startHour) * 60 // Minutes before lunch
        const afternoonMinutes = (endHour - 13) * 60 // Minutes after lunch
        const totalMinutesPerDay = morningMinutes + afternoonMinutes
        const totalSlotsPerDay = Math.floor(totalMinutesPerDay / duration)

        // Get all appointments for this doctor in this month
        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId,
                appointmentDate: {
                    gte: firstDay,
                    lte: lastDay,
                },
                status: {
                    in: ["SCHEDULED"],
                },
            },
            select: {
                appointmentDate: true,
            },
        })

        // Count appointments per day
        const appointmentsByDay: Record<string, number> = {}
        appointments.forEach((apt) => {
            const date = new Date(apt.appointmentDate)
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
            appointmentsByDay[dateKey] = (appointmentsByDay[dateKey] || 0) + 1
        })

        // Day name mapping
        const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]

        // Generate calendar data
        const daysInMonth = new Date(year, monthNum, 0).getDate()
        const calendarDays = []

        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const date = new Date(year, monthNum - 1, day)
            const dayName = dayNames[date.getDay()]

            // Check if doctor is available on this day
            const isDoctorAvailable = availableDays.includes(dayName)
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

            const bookedSlots = appointmentsByDay[dateKey] || 0
            const availableSlots = isDoctorAvailable ? totalSlotsPerDay - bookedSlots : 0

            calendarDays.push({
                date: dateKey,
                day,
                dayName,
                fullyBooked: availableSlots <= 0 || !isDoctorAvailable,
                availableSlots: isPast || !isDoctorAvailable ? 0 : Math.max(0, availableSlots),
                totalSlots: totalSlotsPerDay,
                isPast,
                isDoctorAvailable,
            })
        }

        return NextResponse.json({
            month,
            doctorId,
            serviceId,
            availableFrom: startTime,
            availableTo: endTime,
            availableDays,
            lunchBreak: "12:00-13:00",
            days: calendarDays,
        })
    } catch (error) {
        console.error("GET /api/appointments/calendar-availability error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
