import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover",
})

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== "PATIENT") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { invoiceId } = body

        const userId = (session.user as any).id

        // Get patient
        const patient = await prisma.patient.findUnique({
            where: { userId },
            select: { id: true },
        })

        if (!patient) {
            return NextResponse.json({ error: "Patient not found" }, { status: 404 })
        }

        // Get invoice
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                patient: {
                    include: {
                        user: {
                            select: {
                                email: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                clinic: {
                    select: {
                        name: true,
                    },
                },
            },
        })

        if (!invoice || invoice.patientId !== patient.id) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
        }

        if (invoice.status !== "PENDING") {
            return NextResponse.json({ error: "Invoice already paid or cancelled" }, { status: 400 })
        }

        // Create Stripe checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `Invoice ${invoice.invoiceNumber}`,
                            description: invoice.description || `Payment for ${invoice.clinic.name}`,
                        },
                        unit_amount: Math.round(invoice.totalAmount * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_URL}/patient/invoices?payment=success&invoice=${invoiceId}`, // Changed
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/patient/invoices?payment=cancelled`, // Changed
            customer_email: invoice.patient.user.email,
            metadata: {
                invoiceId: invoice.id,
                patientId: patient.id,
            },
        })

        // Store the Stripe session ID in the invoice
        await prisma.invoice.update({
            where: { id: invoiceId },
            data: { stripePaymentId: checkoutSession.id },
        })

        return NextResponse.json({ url: checkoutSession.url })
    } catch (error) {
        console.error("Stripe checkout error:", error)
        return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
    }
}
