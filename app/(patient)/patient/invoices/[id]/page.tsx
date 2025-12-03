"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Printer, DollarSign } from "lucide-react"
import jsPDF from "jspdf"

interface Invoice {
    id: string
    invoiceNumber: string
    amount: number
    tax: number
    totalAmount: number
    status: string
    dueDate: string
    paymentDate: string | null
    createdAt: string
    description: string | null
    clinic: {
        name: string
        address: string
        city: string
        postalCode: string
        email: string
        phone: string
    }
    patient: {
        user: {
            firstName: string
            lastName: string
            email: string
        }
    }
}

export default function PatientInvoiceDetailPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchInvoice()

        // Check for payment result
        const payment = searchParams.get("payment")
        if (payment === "success") {
            alert("✅ Payment successful! Your invoice will be updated shortly.")
        } else if (payment === "cancelled") {
            alert("❌ Payment was cancelled.")
        }
    }, [params.id, searchParams])

    const fetchInvoice = async () => {
        try {
            const res = await fetch(`/api/patient/invoices/${params.id}`)
            if (res.ok) {
                const data = await res.json()
                setInvoice(data)
            } else {
                console.error("Failed to fetch invoice:", res.status)
            }
        } catch (error) {
            console.error("Error fetching invoice:", error)
        } finally {
            setLoading(false)
        }
    }

    const handlePayNow = async () => {
        if (!invoice) return

        try {
            const res = await fetch("/api/stripe/create-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invoiceId: invoice.id }),
            })

            if (!res.ok) throw new Error("Failed to create checkout")

            const { url } = await res.json()
            window.location.href = url
        } catch (error) {
            console.error("Payment error:", error)
            alert("Failed to initiate payment")
        }
    }

    const downloadPDF = () => {
        if (!invoice) return

        const doc = new jsPDF()

        // Header
        doc.setFontSize(24)
        doc.setFont("helvetica", "bold")
        doc.text("INVOICE", 105, 25, { align: "center" })

        // Invoice details
        doc.setFontSize(12)
        doc.setFont("helvetica", "normal")
        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 45)

        // Status
        doc.setFontSize(10)
        if (invoice.status === "PAID") {
            doc.setTextColor(34, 197, 94)
        } else if (invoice.status === "PENDING") {
            doc.setTextColor(234, 179, 8)
        } else {
            doc.setTextColor(239, 68, 68)
        }
        doc.text(`Status: ${invoice.status}`, 20, 52)
        doc.setTextColor(0, 0, 0)

        // Clinic info
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("From:", 20, 70)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        doc.text(invoice.clinic.name, 20, 77)
        doc.text(`${invoice.clinic.address}, ${invoice.clinic.city}`, 20, 84)
        doc.text(invoice.clinic.email, 20, 91)
        doc.text(invoice.clinic.phone, 20, 98)

        // Patient info
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("Bill To:", 120, 70)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        doc.text(`${invoice.patient.user.firstName} ${invoice.patient.user.lastName}`, 120, 77)
        doc.text(invoice.patient.user.email, 120, 84)

        // Dates
        doc.setFontSize(10)
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, 115)
        doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, 20, 122)
        if (invoice.paymentDate) {
            doc.text(`Paid: ${new Date(invoice.paymentDate).toLocaleDateString()}`, 20, 129)
        }

        // Description
        if (invoice.description) {
            doc.setFontSize(11)
            doc.setFont("helvetica", "bold")
            doc.text("Description:", 20, 145)
            doc.setFont("helvetica", "normal")
            doc.setFontSize(10)
            const splitDesc = doc.splitTextToSize(invoice.description, 170)
            doc.text(splitDesc, 20, 152)
        }

        // Amount table
        const startY = 175
        doc.setDrawColor(200, 200, 200)
        doc.line(20, startY, 190, startY)

        doc.setFontSize(11)
        doc.text("Subtotal:", 20, startY + 10)
        doc.text(`$${invoice.amount.toFixed(2)}`, 190, startY + 10, { align: "right" })

        doc.text("Tax:", 20, startY + 20)
        doc.text(`$${invoice.tax.toFixed(2)}`, 190, startY + 20, { align: "right" })

        doc.line(20, startY + 25, 190, startY + 25)

        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("TOTAL:", 20, startY + 35)
        doc.text(`$${invoice.totalAmount.toFixed(2)}`, 190, startY + 35, { align: "right" })

        // Footer
        doc.setFontSize(9)
        doc.setFont("helvetica", "italic")
        doc.setTextColor(128, 128, 128)
        doc.text("Thank you for your business!", 105, 270, { align: "center" })

        doc.save(`Invoice-${invoice.invoiceNumber}.pdf`)
    }

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; className: string }> = {
            PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
            PAID: { label: "Paid", className: "bg-green-100 text-green-800" },
            CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800" },
        }
        const { label, className } = config[status] || config.PENDING
        return <Badge className={className}>{label}</Badge>
    }

    if (loading) {
        return <div className="text-center py-12">Loading invoice...</div>
    }

    if (!invoice) {
        return (
            <div className="space-y-6">
                <Link href="/patient/invoices" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Invoices
                </Link>
                <div className="text-center py-12 text-red-600">
                    <p className="text-xl font-semibold">Invoice not found</p>
                    <p className="text-sm text-gray-600 mt-2">This invoice may have been deleted or you don't have access to it.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Link href="/patient/invoices" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <ArrowLeft className="w-4 h-4" />
                Back to Invoices
            </Link>

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Invoice Details</h1>
                    <p className="text-gray-600 mt-1">{invoice.invoiceNumber}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadPDF}>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                    {invoice.status === "PENDING" && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handlePayNow}>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Pay Now
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl mb-2">{invoice.clinic.name}</CardTitle>
                            <p className="text-sm text-gray-600">{invoice.clinic.address}</p>
                            <p className="text-sm text-gray-600">
                                {invoice.clinic.city}, {invoice.clinic.postalCode}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                Email: {invoice.clinic.email} | Phone: {invoice.clinic.phone}
                            </p>
                        </div>
                        {getStatusBadge(invoice.status)}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Patient Info */}
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Bill To:</h3>
                        <p className="text-gray-900">
                            {invoice.patient.user.firstName} {invoice.patient.user.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{invoice.patient.user.email}</p>
                    </div>

                    {/* Invoice Details */}
                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-b">
                        <div>
                            <p className="text-sm text-gray-600">Invoice Number:</p>
                            <p className="font-medium">{invoice.invoiceNumber}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Invoice Date:</p>
                            <p className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Due Date:</p>
                            <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                        </div>
                        {invoice.paymentDate && (
                            <div>
                                <p className="text-sm text-gray-600">Payment Date:</p>
                                <p className="font-medium">{new Date(invoice.paymentDate).toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {invoice.description && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Description:</h3>
                            <p className="text-gray-700">{invoice.description}</p>
                        </div>
                    )}

                    {/* Amount Breakdown */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <div className="space-y-3">
                            <div className="flex justify-between text-lg">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">${invoice.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg">
                                <span className="text-gray-600">Tax:</span>
                                <span className="font-medium">${invoice.tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-2xl font-bold pt-3 border-t">
                                <span>Total:</span>
                                <span className="text-blue-600">${invoice.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {invoice.status === "PENDING" && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-yellow-800 font-medium">Payment Due</p>
                            <p className="text-sm text-yellow-700 mt-1">
                                This invoice is due by {new Date(invoice.dueDate).toLocaleDateString()}. Please make payment
                                to avoid late fees.
                            </p>
                        </div>
                    )}

                    {invoice.status === "PAID" && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-green-800 font-medium">✅ Payment Received</p>
                            <p className="text-sm text-green-700 mt-1">
                                Thank you for your payment! This invoice has been marked as paid.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
