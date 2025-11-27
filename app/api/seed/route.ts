import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    // Create clinic
    const clinic = await prisma.clinic.create({
      data: {
        name: "Central Medical Clinic",
        address: "123 Medical Street",
        city: "New York",
        postalCode: "10001",
        phone: "+1-555-0123",
        email: "contact@centralclinic.com",
        licenseNumber: "LIC-2024-001",
      },
    })

    // Create admin user
    const adminPassword = await bcrypt.hash("password123", 10)
    const admin = await prisma.user.create({
      data: {
        email: "admin@clinic.com",
        password: adminPassword,
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        clinicId: clinic.id,
        phone: "+1-555-0100",
      },
    })

    // Create doctor user
    const doctorPassword = await bcrypt.hash("password123", 10)
    const doctorUser = await prisma.user.create({
      data: {
        email: "doctor@clinic.com",
        password: doctorPassword,
        firstName: "Dr. John",
        lastName: "Smith",
        role: "DOCTOR",
        clinicId: clinic.id,
        phone: "+1-555-0101",
      },
    })

    // Create doctor profile
    await prisma.doctor.create({
      data: {
        userId: doctorUser.id,
        clinicId: clinic.id,
        specialization: "General Medicine",
        licenseNumber: "DOC-2024-001",
        experience: 5,
        bio: "Experienced general practitioner with 5 years of experience.",
      },
    })

    // Create receptionist user
    const receptionistPassword = await bcrypt.hash("password123", 10)
    const receptionistUser = await prisma.user.create({
      data: {
        email: "receptionist@clinic.com",
        password: receptionistPassword,
        firstName: "Jane",
        lastName: "Doe",
        role: "RECEPTIONIST",
        clinicId: clinic.id,
        phone: "+1-555-0102",
      },
    })

    // Create receptionist profile
    await prisma.receptionist.create({
      data: {
        userId: receptionistUser.id,
        clinicId: clinic.id,
        department: "Front Desk",
      },
    })

    // Create patient user
    const patientPassword = await bcrypt.hash("password123", 10)
    const patientUser = await prisma.user.create({
      data: {
        email: "patient@clinic.com",
        password: patientPassword,
        firstName: "Mike",
        lastName: "Johnson",
        role: "PATIENT",
        clinicId: clinic.id,
        phone: "+1-555-0103",
      },
    })

    // Create patient profile
    await prisma.patient.create({
      data: {
        userId: patientUser.id,
        clinicId: clinic.id,
        dateOfBirth: new Date("1990-01-15"),
        gender: "Male",
        bloodType: "O+",
        allergies: "Penicillin",
      },
    })

    return Response.json({
      message: "Database seeded successfully",
      clinic,
      users: [admin, doctorUser, receptionistUser, patientUser],
    })
  } catch (error) {
    console.error("Seed error:", error)
    return Response.json({ error: "Failed to seed database" }, { status: 500 })
  }
}
