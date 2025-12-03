import { NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
    try {
        const body = await req.text()
        const headersList = await headers() // Added await
        const signature = headersList.get("stripe-signature")!

        let event: Stripe.Event

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
        } catch (err: any) {
            console.error(`Webhook signature verification failed: ${err.message}`)
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
        }

        // Handle the event
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session
            const invoiceId = session.metadata?.invoiceId

            console.log("checkout.session.completed, metadata.invoiceId:", invoiceId, {
                payment_status: session.payment_status,
                payment_intent: session.payment_intent,
            })

            if (!invoiceId) {
                console.warn("⚠️ No invoiceId in metadata")
            } else {
                try {
                    const updated = await prisma.invoice.update({
                        where: { id: invoiceId },
                        data: {
                            status: "PAID",
                            paymentDate: new Date(),
                            stripePaymentId: (session.payment_intent as string) ?? session.id,
                        },
                    })
                    console.log("✅ Invoice updated:", updated.id, updated.status)
                } catch (err) {
                    console.error("❌ Failed to update invoice in webhook:", err)
                }
            }
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("Webhook error:", error)
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
    }
}
