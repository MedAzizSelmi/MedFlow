"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, DollarSign, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react"

interface Doctor {
    id: string
    user: {
        firstName: string
        lastName: string
    }
    specialization: string | null
    availableFrom: string
    availableTo: string
    availableDays: string[]
}

interface ServiceDoctor {
    id: string
    user: {
        firstName: string
        lastName: string
    }
}

interface Service {
    id: string
    name: string
    description: string | null
    duration: number
    price: number
    doctors: ServiceDoctor[]
}

interface TimeSlot {
    time: string
    available: boolean
    isBooked: boolean
    isPast: boolean
    isLunchBreak?: boolean
}

interface CalendarDay {
    date: string
    day: number
    fullyBooked: boolean
    availableSlots: number
    totalSlots: number
    isPast: boolean
    isDoctorAvailable?: boolean
}

export default function NewAppointmentPage() {
    const router = useRouter()
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [filteredServices, setFilteredServices] = useState<Service[]>([])
    const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
    const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingAvailability, setLoadingAvailability] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [currentMonth, setCurrentMonth] = useState("")
    const [form, setForm] = useState({
        doctorId: "",
        serviceId: "",
        appointmentDate: "",
        appointmentTime: "",
        notes: "",
    })

    useEffect(() => {
        fetchData()
        const now = new Date()
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        setCurrentMonth(monthStr)
    }, [])

    // Filter services when doctor changes (many-to-many)
    useEffect(() => {
        if (form.doctorId) {
            const filtered = services.filter(
                (s) => s.doctors && s.doctors.some((d) => d.id === form.doctorId)
            )
            setFilteredServices(filtered)

            // Reset service/date/time if current service is not valid for this doctor
            if (form.serviceId && !filtered.find((s) => s.id === form.serviceId)) {
                setForm((prev) => ({
                    ...prev,
                    serviceId: "",
                    appointmentDate: "",
                    appointmentTime: "",
                }))
                setCalendarDays([])
                setTimeSlots([])
            }
        } else {
            setFilteredServices(services)
            setCalendarDays([])
            setTimeSlots([])
        }
    }, [form.doctorId, services])

    // Filter doctors when service changes (many-to-many)
    useEffect(() => {
        if (form.serviceId) {
            const selectedService = services.find((s) => s.id === form.serviceId)
            if (selectedService && selectedService.doctors) {
                const serviceDoctorIds = selectedService.doctors.map((d) => d.id)
                const filtered = doctors.filter((d) => serviceDoctorIds.includes(d.id))
                setFilteredDoctors(filtered)

                // Reset doctor if not valid for this service
                if (form.doctorId && !serviceDoctorIds.includes(form.doctorId)) {
                    setForm((prev) => ({
                        ...prev,
                        doctorId: "",
                        appointmentDate: "",
                        appointmentTime: "",
                    }))
                    setCalendarDays([])
                    setTimeSlots([])
                }

                // Auto-select doctor if only one option
                if (filtered.length === 1 && !form.doctorId) {
                    setForm((prev) => ({ ...prev, doctorId: filtered[0].id }))
                }
            }
        } else {
            setFilteredDoctors(doctors)
        }
    }, [form.serviceId, services, doctors])

    // Load calendar when both doctor and service are selected
    useEffect(() => {
        if (form.doctorId && form.serviceId && currentMonth) {
            fetchCalendarAvailability(form.doctorId, form.serviceId, currentMonth)
        } else {
            setCalendarDays([])
        }
    }, [form.doctorId, form.serviceId, currentMonth])

    // Fetch time slots when date changes
    useEffect(() => {
        if (form.doctorId && form.serviceId && form.appointmentDate) {
            fetchTimeSlots(form.doctorId, form.serviceId, form.appointmentDate)
        } else {
            setTimeSlots([])
        }
    }, [form.doctorId, form.serviceId, form.appointmentDate])

    const fetchData = async () => {
        try {
            const [doctorsRes, servicesRes] = await Promise.all([
                fetch("/api/doctors"),
                fetch("/api/services"),
            ])

            if (doctorsRes.ok) {
                const doctorsData = await doctorsRes.json()
                setDoctors(doctorsData)
                setFilteredDoctors(doctorsData)
            }

            if (servicesRes.ok) {
                const servicesData = await servicesRes.json()
                setServices(servicesData)
                setFilteredServices(servicesData)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchCalendarAvailability = async (doctorId: string, serviceId: string, month: string) => {
        setLoadingAvailability(true)
        try {
            const res = await fetch(
                `/api/appointments/calendar-availability?doctorId=${doctorId}&serviceId=${serviceId}&month=${month}`
            )
            if (res.ok) {
                const data = await res.json()
                setCalendarDays(data.days || [])
            }
        } catch (error) {
            console.error("Error fetching calendar availability:", error)
        } finally {
            setLoadingAvailability(false)
        }
    }

    const fetchTimeSlots = async (doctorId: string, serviceId: string, date: string) => {
        setLoadingAvailability(true)
        try {
            const res = await fetch(
                `/api/appointments/availability?doctorId=${doctorId}&serviceId=${serviceId}&date=${date}`
            )
            if (res.ok) {
                const data = await res.json()
                setTimeSlots(data.timeSlots || [])
            }
        } catch (error) {
            console.error("Error fetching time slots:", error)
        } finally {
            setLoadingAvailability(false)
        }
    }

    const handleMonthChange = (direction: number) => {
        const [year, month] = currentMonth.split("-").map(Number)
        const newDate = new Date(year, month - 1 + direction, 1)
        const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`
        setCurrentMonth(newMonth)
    }

    const handleDateSelect = (dateStr: string) => {
        setForm((prev) => ({
            ...prev,
            appointmentDate: dateStr,
            appointmentTime: "",
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            if (!form.doctorId || !form.serviceId || !form.appointmentDate || !form.appointmentTime) {
                throw new Error("Please select doctor, service, date and time")
            }

            const appointmentDateTime = `${form.appointmentDate}T${form.appointmentTime}:00`

            const res = await fetch("/api/patient/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    doctorId: form.doctorId,
                    serviceId: form.serviceId,
                    appointmentDate: appointmentDateTime,
                    notes: form.notes || null,
                }),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to book appointment")
            }

            alert("Appointment booked successfully!")
            router.push("/patient/appointments")
        } catch (error: any) {
            console.error("Error booking appointment:", error)
            alert(error.message || "Failed to book appointment")
        } finally {
            setSubmitting(false)
        }
    }

    const selectedService = services.find((s) => s.id === form.serviceId)
    const selectedDoctor = doctors.find((d) => d.id === form.doctorId)

    const getDayStatus = (day: CalendarDay) => {
        if (day.isPast) return "past"
        if (day.isDoctorAvailable === false) return "unavailable"
        if (day.fullyBooked) return "booked"
        if (day.availableSlots > 0) return "available"
        return "unavailable"
    }

    if (loading) {
        return <div className="text-center py-12">Loading...</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Book New Appointment</h1>
                <p className="text-gray-600 mt-1">Schedule an appointment with a doctor</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Doctor and Service Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Select Doctor & Service</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="doctorId">Select Doctor *</Label>
                                <Select
                                    value={form.doctorId}
                                    onValueChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            doctorId: value,
                                            appointmentDate: "",
                                            appointmentTime: "",
                                        }))
                                    }
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a doctor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredDoctors.map((doctor) => (
                                            <SelectItem key={doctor.id} value={doctor.id}>
                                                Dr. {doctor.user.firstName} {doctor.user.lastName}
                                                {doctor.specialization && ` - ${doctor.specialization}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.serviceId && filteredDoctors.length === 0 && (
                                    <p className="text-xs text-yellow-600">No doctors available for this service</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="serviceId">Select Service *</Label>
                                <Select
                                    value={form.serviceId}
                                    onValueChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            serviceId: value,
                                            appointmentDate: "",
                                            appointmentTime: "",
                                        }))
                                    }
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a service" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredServices.map((service) => (
                                            <SelectItem key={service.id} value={service.id}>
                                                {service.name} - ${service.price} ({service.duration} min)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.doctorId && filteredServices.length === 0 && (
                                    <p className="text-xs text-yellow-600">This doctor has no available services</p>
                                )}
                            </div>
                        </div>

                        {selectedService && (
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="pt-4">
                                    <h3 className="font-semibold text-lg mb-3 text-blue-900">
                                        {selectedService.name}
                                    </h3>
                                    {selectedService.description && (
                                        <p className="text-sm text-gray-700 mb-3">
                                            {selectedService.description}
                                        </p>
                                    )}
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-blue-600" />
                                            <span className="text-gray-700">
                        Duration: <strong>{selectedService.duration} minutes</strong>
                      </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-blue-600" />
                                            <span className="text-gray-700">
                        Price: <strong>${selectedService.price}</strong>
                      </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {selectedDoctor && (
                            <div className="bg-gray-50 p-3 rounded-lg text-sm">
                                <p className="font-medium text-gray-700">Doctor's Available Hours</p>
                                <p className="text-gray-900">
                                    {selectedDoctor.availableFrom} - {selectedDoctor.availableTo}
                                </p>
                                {selectedDoctor.availableDays && selectedDoctor.availableDays.length > 0 && (
                                    <p className="text-xs text-gray-600 mt-1">
                                        Available: {selectedDoctor.availableDays.join(", ")}
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Calendar View */}
                {form.doctorId && form.serviceId && (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Select Date</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleMonthChange(-1)}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="px-4 py-2 text-sm font-medium min-w-[140px] text-center">
                    {new Date(currentMonth + "-01").toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                    })}
                  </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleMonthChange(1)}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingAvailability && !calendarDays.length ? (
                                <div className="text-center py-8 text-gray-500">
                                    Loading availability...
                                </div>
                            ) : calendarDays.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-7 gap-2 mb-4">
                                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                            <div
                                                key={day}
                                                className="text-center text-sm font-medium text-gray-600 py-2"
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-2">
                                        {/* Empty cells before month starts */}
                                        {Array.from({
                                            length: new Date(currentMonth + "-01").getDay(),
                                        }).map((_, i) => (
                                            <div key={`empty-${i}`} />
                                        ))}

                                        {calendarDays.map((day) => {
                                            const status = getDayStatus(day)
                                            const isSelected = form.appointmentDate === day.date
                                            const isClickable =
                                                !day.isPast &&
                                                !day.fullyBooked &&
                                                day.isDoctorAvailable !== false

                                            return (
                                                <button
                                                    key={day.date}
                                                    type="button"
                                                    onClick={() => isClickable && handleDateSelect(day.date)}
                                                    disabled={!isClickable}
                                                    className={`
                            relative p-3 rounded-lg border-2 text-center transition-all min-h-[70px]
                            ${isSelected ? "border-blue-600 bg-blue-50" : "border-gray-200"}
                            ${status === "past" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
                            ${status === "booked" ? "bg-red-50 border-red-200 text-red-600 cursor-not-allowed" : ""}
                            ${status === "unavailable" ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}
                            ${status === "available" ? "hover:border-blue-400 hover:bg-blue-50 cursor-pointer" : ""}
                          `}
                                                >
                                                    <div className="text-lg font-semibold">{day.day}</div>
                                                    {!day.isPast && (
                                                        <div className="text-xs mt-1">
                                                            {day.fullyBooked ? (
                                                                <span className="text-red-600 font-medium">Full</span>
                                                            ) : day.isDoctorAvailable === false ? (
                                                                <span className="text-gray-400">Off</span>
                                                            ) : (
                                                                <span className="text-green-600">
                                  {day.availableSlots} slots
                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {isSelected && (
                                                        <div className="absolute top-1 right-1">
                                                            <CheckCircle className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Select a doctor and service to view availability
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Time Slots */}
                {form.appointmentDate && timeSlots.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Select Time for{" "}
                                {new Date(form.appointmentDate + "T00:00:00").toLocaleDateString(
                                    "en-US",
                                    {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    }
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {timeSlots.filter((slot) => slot.available).length === 0 ? (
                                <div className="text-center py-8 text-red-600">
                                    <XCircle className="w-12 h-12 mx-auto mb-3" />
                                    <p className="font-medium">No available time slots for this date</p>
                                    <p className="text-sm mt-2">Please select another date</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                    {timeSlots.map((slot) => (
                                        <button
                                            key={slot.time}
                                            type="button"
                                            onClick={() =>
                                                slot.available &&
                                                setForm((prev) => ({
                                                    ...prev,
                                                    appointmentTime: slot.time,
                                                }))
                                            }
                                            disabled={!slot.available}
                                            className={`
                        p-3 rounded-lg border-2 text-center transition-all font-medium
                        ${
                                                form.appointmentTime === slot.time
                                                    ? "border-blue-600 bg-blue-600 text-white"
                                                    : "border-gray-200"
                                            }
                        ${
                                                slot.available
                                                    ? "hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
                                                    : ""
                                            }
                        ${
                                                slot.isPast
                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                                    : ""
                                            }
                        ${
                                                slot.isBooked && !slot.isPast
                                                    ? "bg-red-50 border-red-200 text-red-400 cursor-not-allowed line-through"
                                                    : ""
                                            }
                        ${
                                                slot.isLunchBreak && !slot.isPast && !slot.isBooked
                                                    ? "bg-yellow-50 border-yellow-200 text-yellow-600 cursor-not-allowed"
                                                    : ""
                                            }
                      `}
                                        >
                                            <div>{slot.time}</div>
                                            {slot.isLunchBreak && !slot.isPast && (
                                                <div className="text-xs mt-1">Lunch</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Notes */}
                {form.appointmentTime && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={form.notes}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, notes: e.target.value }))
                                    }
                                    placeholder="Any special requests or information for the doctor..."
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Submit */}
                {form.appointmentTime && (
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="font-semibold text-lg text-green-900 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        Ready to Book!
                                    </h3>
                                    <div className="text-sm text-green-700 mt-2 space-y-1">
                                        <p>
                                            <strong>Date:</strong>{" "}
                                            {new Date(
                                                form.appointmentDate + "T00:00:00"
                                            ).toLocaleDateString("en-US", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                        <p>
                                            <strong>Time:</strong> {form.appointmentTime}
                                        </p>
                                        <p>
                                            <strong>Doctor:</strong> Dr. {selectedDoctor?.user.firstName}{" "}
                                            {selectedDoctor?.user.lastName}
                                        </p>
                                        <p>
                                            <strong>Service:</strong> {selectedService?.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Booking..." : "Confirm Booking"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </form>
        </div>
    )
}
