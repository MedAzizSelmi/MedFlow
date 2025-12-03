import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const doctorId = searchParams.get("doctorId")
        const serviceId = searchParams.get("serviceId")
        const date = searchParams.get("date") // YYYY-MM-DD format

        if (!doctorId || !serviceId || !date) {
            return NextResponse.json({ error: "doctorId, serviceId, and date required" }, { status: 400 })
        }

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

        const [startHour, startMinute] = startTime.split(":").map(Number)
        const [endHour, endMinute] = endTime.split(":").map(Number)

        const duration = service.duration

        // Check if doctor is available on this day of the week
        const selectedDate = new Date(date)
        const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
        const dayName = dayNames[selectedDate.getDay()]
        const isDoctorAvailable = availableDays.includes(dayName)

        if (!isDoctorAvailable) {
            return NextResponse.json({
                date,
                doctorId,
                serviceId,
                availableFrom: startTime,
                availableTo: endTime,
                availableDays,
                serviceDuration: duration,
                lunchBreak: "12:00-13:00",
                timeSlots: [],
                fullyBooked: true,
                message: `Doctor is not available on ${dayName}s`,
            })
        }

        // Define lunch break (12:00 - 13:00)
        const lunchBreakStart = 12
        const lunchBreakEnd = 13

        // Get all appointments for this doctor on this date
        const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0)
        const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59)

        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId,
                appointmentDate: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: {
                    in: ["SCHEDULED"],
                },
            },
            select: {
                appointmentDate: true,
                duration: true,
            },
        })

        // Generate all possible time slots
        const timeSlots = []
        let currentHour = startHour
        let currentMinute = startMinute

        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            const timeString = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`

            // Check if this slot is booked
            const slotDateTime = new Date(selectedDate)
            slotDateTime.setHours(currentHour, currentMinute, 0, 0)

            const slotEndTime = new Date(slotDateTime.getTime() + duration * 60000)

            // Check if slot conflicts with any existing appointment
            const isBooked = appointments.some((apt) => {
                const aptStart = new Date(apt.appointmentDate)
                const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000)

                // Check for overlap
                return (slotDateTime < aptEnd && slotEndTime > aptStart)
            })

            // Check if slot is in the past
            const now = new Date()
            const isPast = slotDateTime < now

            // Check if slot falls during lunch break (12:00 - 13:00)
            const slotEndHour = slotEndTime.getHours()

            const isDuringLunchBreak = (
                // Slot starts during lunch
                (currentHour >= lunchBreakStart && currentHour < lunchBreakEnd) ||
                // Slot ends during lunch
                (slotEndHour > lunchBreakStart && slotEndHour <= lunchBreakEnd) ||
                // Slot spans over lunch
                (currentHour < lunchBreakStart && slotEndHour > lunchBreakStart)
            )

            timeSlots.push({
                time: timeString,
                available: !isBooked && !isPast && !isDuringLunchBreak,
                isBooked,
                isPast,
                isLunchBreak: isDuringLunchBreak,
            })

            // Add duration to current time
            currentMinute += duration
            if (currentMinute >= 60) {
                currentHour += Math.floor(currentMinute / 60)
                currentMinute = currentMinute % 60
            }
        }

        return NextResponse.json({
            date,
            doctorId,
            serviceId,
            availableFrom: startTime,
            availableTo: endTime,
            availableDays,
            serviceDuration: duration,
            lunchBreak: "12:00-13:00",
            timeSlots,
            fullyBooked: timeSlots.every((slot) => !slot.available),
        })
    } catch (error) {
        console.error("GET /api/appointments/availability error", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
