"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus, Search, X, User, Phone, Mail, DollarSign, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react"

interface Appointment {
    id: string
    appointmentDate: string
    status: string
    notes: string | null
    duration: number
    patient: {
        user: {
            firstName: string
            lastName: string
            email: string
            phone: string | null
        }
    }
    doctor: {
        user: {
            firstName: string
            lastName: string
        }
    }
    service: {
        name: string
        price: number
        duration: number
    }
}

interface Patient {
    id: string
    user: {
        firstName: string
        lastName: string
        email: string
    }
}

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

interface Service {
    id: string
    name: string
    price: number
    duration: number
    description: string | null
    doctors: {
        id: string
        user: {
            firstName: string
            lastName: string
        }
    }[]
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

export default function ReceptionAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [patients, setPatients] = useState<Patient[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
    const [filteredServices, setFilteredServices] = useState<Service[]>([])
    const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingAvailability, setLoadingAvailability] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [currentMonth, setCurrentMonth] = useState("")

    const [form, setForm] = useState({
        patientId: "",
        doctorId: "",
        serviceId: "",
        appointmentDate: "",
        appointmentTime: "",
        notes: "",
    })

    // Initial data fetch
    useEffect(() => {
        fetchData()
        const now = new Date()
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        setCurrentMonth(monthStr)
    }, [])

    // ✅ Filter services when doctor changes
    useEffect(() => {
        if (form.doctorId) {
            const filtered = services.filter(s =>
                s.doctors && s.doctors.some(d => d.id === form.doctorId)
            )
            setFilteredServices(filtered)

            // Reset service if not available for this doctor
            if (form.serviceId && !filtered.find(s => s.id === form.serviceId)) {
                setForm(prev => ({
                    ...prev,
                    serviceId: "",
                    appointmentDate: "",
                    appointmentTime: ""
                }))
                setCalendarDays([])
                setTimeSlots([])
            }
        } else {
            setFilteredServices(services)
        }
    }, [form.doctorId, services])

    // ✅ Filter doctors when service changes
    useEffect(() => {
        if (form.serviceId) {
            const selectedService = services.find(s => s.id === form.serviceId)
            if (selectedService && selectedService.doctors) {
                const serviceDoctorIds = selectedService.doctors.map(d => d.id)
                const filtered = doctors.filter(d => serviceDoctorIds.includes(d.id))
                setFilteredDoctors(filtered)

                // Reset doctor if not available for this service
                if (form.doctorId && !serviceDoctorIds.includes(form.doctorId)) {
                    setForm(prev => ({
                        ...prev,
                        doctorId: "",
                        appointmentDate: "",
                        appointmentTime: ""
                    }))
                    setCalendarDays([])
                    setTimeSlots([])
                }

                // Auto-select if only one doctor
                if (filtered.length === 1 && !form.doctorId) {
                    setForm(prev => ({ ...prev, doctorId: filtered[0].id }))
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
            const [appointmentsRes, patientsRes, doctorsRes, servicesRes] = await Promise.all([
                fetch("/api/receptionist/appointments"),
                fetch("/api/receptionist/patients"),
                fetch("/api/doctors"),
                fetch("/api/services"),
            ])

            if (appointmentsRes.ok) setAppointments(await appointmentsRes.json())
            if (patientsRes.ok) setPatients(await patientsRes.json())

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
            const res = await fetch(`/api/appointments/calendar-availability?doctorId=${doctorId}&serviceId=${serviceId}&month=${month}`)
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
            const res = await fetch(`/api/appointments/availability?doctorId=${doctorId}&serviceId=${serviceId}&date=${date}`)
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
        setForm(prev => ({ ...prev, appointmentDate: dateStr, appointmentTime: "" }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const dateTime = `${form.appointmentDate}T${form.appointmentTime}:00`

            const payload = {
                patientId: form.patientId,
                doctorId: form.doctorId,
                serviceId: form.serviceId,
                appointmentDate: dateTime,
                notes: form.notes,
            }

            console.log("Submitting payload:", payload)

            const res = await fetch("/api/receptionist/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const data = await res.json()
            console.log("Server response:", data)

            if (!res.ok) {
                if (res.status === 409) {
                    alert(data.message || "Patient already has an appointment with this doctor today")
                } else {
                    alert(data.error || "Failed to create appointment")
                }
                return
            }

            await fetchData()
            resetForm()
            alert("Appointment created successfully!")
        } catch (error) {
            console.error("Error creating appointment:", error)
            alert("Failed to create appointment")
        }
    }

    const updateStatus = async (appointmentId: string, newStatus: string) => {
        try {
            const res = await fetch("/api/receptionist/appointments", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: appointmentId, status: newStatus }),
            })

            if (!res.ok) throw new Error("Failed to update")
            await fetchData()
        } catch (error) {
            console.error("Error updating appointment:", error)
            alert("Failed to update appointment")
        }
    }

    const resetForm = () => {
        setForm({
            patientId: "",
            doctorId: "",
            serviceId: "",
            appointmentDate: "",
            appointmentTime: "",
            notes: "",
        })
        setCalendarDays([])
        setTimeSlots([])
        setShowForm(false)
    }

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; className: string }> = {
            SCHEDULED: { label: "Scheduled", className: "bg-blue-100 text-blue-800" },
            COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800" },
            CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800" },
            NO_SHOW: { label: "No Show", className: "bg-gray-100 text-gray-800" },
        }
        const { label, className } = config[status] || config.SCHEDULED
        return <Badge className={className}>{label}</Badge>
    }

    const getDayStatus = (day: CalendarDay) => {
        if (day.isPast) return "past"
        if (!day.isDoctorAvailable) return "unavailable"
        if (day.fullyBooked) return "booked"
        if (day.availableSlots > 0) return "available"
        return "unavailable"
    }

    const filteredAppointments = appointments.filter(apt => {
        const matchesSearch = !searchTerm ||
            apt.patient.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.patient.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.doctor.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.doctor.user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || apt.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const selectedService = services.find(s => s.id === form.serviceId)
    const selectedDoctor = doctors.find(d => d.id === form.doctorId)

    if (loading) {
        return <div className="text-center py-12">Loading appointments...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Appointments</h1>
                    <p className="text-gray-600 mt-1">Create and manage patient appointments</p>
                </div>
                {!showForm && (
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Appointment
                    </Button>
                )}
            </div>

            {/* New Appointment Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Patient Selection */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>New Appointment</CardTitle>
                                <Button variant="ghost" size="sm" onClick={resetForm} type="button">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>Patient *</Label>
                                <Select
                                    value={form.patientId}
                                    onValueChange={(value) => setForm(prev => ({ ...prev, patientId: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select patient" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {patients.map((patient) => (
                                            <SelectItem key={patient.id} value={patient.id}>
                                                {patient.user.firstName} {patient.user.lastName} - {patient.user.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Doctor and Service Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Doctor & Service</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Doctor Selection */}
                                <div className="space-y-2">
                                    <Label>Doctor *</Label>
                                    <Select
                                        value={form.doctorId}
                                        onValueChange={(value) => setForm(prev => ({
                                            ...prev,
                                            doctorId: value,
                                            appointmentDate: "",
                                            appointmentTime: ""
                                        }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select doctor" />
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

                                {/* Service Selection */}
                                <div className="space-y-2">
                                    <Label>Service *</Label>
                                    <Select
                                        value={form.serviceId}
                                        onValueChange={(value) => setForm(prev => ({
                                            ...prev,
                                            serviceId: value,
                                            appointmentDate: "",
                                            appointmentTime: ""
                                        }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select service" />
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

                            {/* Service Details */}
                            {selectedService && (
                                <Card className="bg-blue-50 border-blue-200">
                                    <CardContent className="pt-4">
                                        <h3 className="font-semibold text-lg mb-2 text-blue-900">{selectedService.name}</h3>
                                        {selectedService.description && (
                                            <p className="text-sm text-gray-700 mb-3">{selectedService.description}</p>
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

                            {/* Doctor Availability Info */}
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
                                        <Button type="button" variant="outline" size="sm" onClick={() => handleMonthChange(-1)}>
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="px-4 py-2 text-sm font-medium min-w-[140px] text-center">
                                            {new Date(currentMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                        </span>
                                        <Button type="button" variant="outline" size="sm" onClick={() => handleMonthChange(1)}>
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingAvailability && !calendarDays.length ? (
                                    <div className="text-center py-8 text-gray-500">Loading availability...</div>
                                ) : calendarDays.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-7 gap-2 mb-4">
                                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-2">
                                            {/* Empty cells for days before the 1st */}
                                            {Array.from({ length: new Date(currentMonth + "-01").getDay() }).map((_, i) => (
                                                <div key={`empty-${i}`} />
                                            ))}
                                            {calendarDays.map((day) => {
                                                const status = getDayStatus(day)
                                                const isSelected = form.appointmentDate === day.date
                                                const isClickable = !day.isPast && !day.fullyBooked && day.isDoctorAvailable !== false

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
                                                                    <span className="text-green-600">{day.availableSlots} slots</span>
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
                                    Select Time for {new Date(form.appointmentDate + "T00:00:00").toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric"
                                })}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {timeSlots.filter(slot => slot.available).length === 0 ? (
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
                                                onClick={() => slot.available && setForm(prev => ({ ...prev, appointmentTime: slot.time }))}
                                                disabled={!slot.available}
                                                className={`
                                                    p-3 rounded-lg border-2 text-center transition-all font-medium
                                                    ${form.appointmentTime === slot.time
                                                    ? "border-blue-600 bg-blue-600 text-white"
                                                    : "border-gray-200"}
                                                    ${slot.available
                                                    ? "hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
                                                    : ""}
                                                    ${slot.isPast
                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                                    : ""}
                                                    ${slot.isBooked && !slot.isPast
                                                    ? "bg-red-50 border-red-200 text-red-400 cursor-not-allowed line-through"
                                                    : ""}
                                                    ${slot.isLunchBreak && !slot.isPast && !slot.isBooked
                                                    ? "bg-yellow-50 border-yellow-200 text-yellow-600 cursor-not-allowed"
                                                    : ""}
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
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={form.notes}
                                        onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Additional notes or special requests"
                                        rows={3}
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
                                            Ready to Book Appointment
                                        </h3>
                                        <div className="text-sm text-green-700 mt-2 space-y-1">
                                            <p><strong>Patient:</strong> {patients.find(p => p.id === form.patientId)?.user.firstName} {patients.find(p => p.id === form.patientId)?.user.lastName}</p>
                                            <p><strong>Date:</strong> {new Date(form.appointmentDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                                            <p><strong>Time:</strong> {form.appointmentTime}</p>
                                            <p><strong>Doctor:</strong> Dr. {selectedDoctor?.user.firstName} {selectedDoctor?.user.lastName}</p>
                                            <p><strong>Service:</strong> {selectedService?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button type="button" variant="outline" onClick={resetForm}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                            Create Appointment
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </form>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Search & Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search by patient or doctor..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    <SelectItem value="NO_SHOW">No Show</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Appointments List */}
            <Card>
                <CardHeader>
                    <CardTitle>Appointments ({filteredAppointments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredAppointments.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>No appointments found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAppointments.map((appointment) => (
                                <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {appointment.patient.user.firstName} {appointment.patient.user.lastName}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(appointment.status)}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>{appointment.duration} min</span>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 rounded p-3 mb-3">
                                        <p className="text-sm font-medium text-gray-700">Service</p>
                                        <p className="text-gray-900">{appointment.service.name}</p>
                                        <p className="text-sm text-gray-600 mt-1">Price: ${appointment.service.price}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            <span>{appointment.patient.user.email}</span>
                                        </div>
                                        {appointment.patient.user.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4" />
                                                <span>{appointment.patient.user.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {appointment.notes && (
                                        <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                                            <p className="font-medium text-gray-700">Notes</p>
                                            <p className="text-gray-600">{appointment.notes}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 flex-wrap">
                                        {appointment.status === "SCHEDULED" && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => updateStatus(appointment.id, "COMPLETED")}
                                                >
                                                    Complete
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600"
                                                    onClick={() => updateStatus(appointment.id, "CANCELLED")}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateStatus(appointment.id, "NO_SHOW")}
                                                >
                                                    No Show
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
