"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Download, Eye, Search, Calendar } from "lucide-react"
import Link from "next/link"
import jsPDF from "jspdf"

interface Invoice {
    id: string
    invoiceNumber: string
    amount: number
    tax: number
    totalAmount: number
    status: string
    dueDate: string
    createdAt: string
    description: string | null
    clinic: {
        name: string
        email: string
        phone: string
    }
}

export default function PatientInvoicesPage() {
    const searchParams = useSearchParams()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchInvoices()

        // Check for payment result
        const payment = searchParams.get("payment")
        const invoiceId = searchParams.get("invoice")

        if (payment === "success") {
            alert("✅ Payment successful! Your invoice will be updated shortly.\n\n(Note: If using test mode without webhook, the receptionist can mark it as paid manually)")

            // Remove query params from URL
            window.history.replaceState({}, "", "/patient/invoices")
        } else if (payment === "cancelled") {
            alert("❌ Payment was cancelled. You can try again anytime.")

            // Remove query params from URL
            window.history.replaceState({}, "", "/patient/invoices")
        }
    }, [searchParams])

    const fetchInvoices = async () => {
        try {
            const res = await fetch("/api/patient/invoices")
            if (res.ok) {
                const data = await res.json()
                setInvoices(data)
            }
        } catch (error) {
            console.error("Failed to fetch invoices:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePayNow = async (invoiceId: string) => {
        try {
            const res = await fetch("/api/stripe/create-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invoiceId }),
            })

            if (!res.ok) throw new Error("Failed to create checkout")

            const { url } = await res.json()
            window.location.href = url // Redirect to Stripe checkout
        } catch (error) {
            console.error("Payment error:", error)
            alert("Failed to initiate payment")
        }
    }

    const downloadInvoicePDF = (invoice: Invoice) => {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(24)
        doc.setFont("helvetica", "bold")
        doc.text("INVOICE", 105, 25, { align: "center" })

        // Invoice Number
        doc.setFontSize(12)
        doc.setFont("helvetica", "normal")
        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 45)

        // Status Badge
        doc.setFontSize(10)
        if (invoice.status === "PAID") {
            doc.setTextColor(34, 197, 94) // Green
        } else if (invoice.status === "PENDING") {
            doc.setTextColor(234, 179, 8) // Yellow
        } else {
            doc.setTextColor(239, 68, 68) // Red
        }
        doc.text(`Status: ${invoice.status}`, 20, 52)
        doc.setTextColor(0, 0, 0) // Reset to black

        // Clinic Information
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("From:", 20, 70)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        doc.text(invoice.clinic.name, 20, 77)
        doc.text(invoice.clinic.email, 20, 84)
        doc.text(invoice.clinic.phone, 20, 91)

        // Dates
        doc.setFontSize(10)
        doc.text(`Issue Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, 110)
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 20, 117)

        // Description
        if (invoice.description) {
            doc.setFontSize(11)
            doc.setFont("helvetica", "bold")
            doc.text("Description:", 20, 135)
            doc.setFont("helvetica", "normal")
            doc.setFontSize(10)
            const splitDescription = doc.splitTextToSize(invoice.description, 170)
            doc.text(splitDescription, 20, 142)
        }

        // Amount Table
        const startY = invoice.description ? 165 : 145
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

        // Save PDF
        doc.save(`Invoice-${invoice.invoiceNumber}.pdf`)
    }

    const totalOutstanding = invoices
        .filter((inv) => inv.status === "PENDING")
        .reduce((sum, inv) => sum + inv.totalAmount, 0)

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; className: string }> = {
            PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
            PAID: { label: "Paid", className: "bg-green-100 text-green-800" },
            CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800" },
        }
        const { label, className } = config[status] || config.PENDING
        return <Badge className={className}>{label}</Badge>
    }

    const filteredInvoices = invoices.filter(
        (inv) =>
            searchTerm === "" ||
            inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (isLoading) {
        return <div className="text-center py-12">Loading invoices...</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Invoices</h1>
                <p className="text-gray-600 mt-1">View and pay your clinic invoices</p>
            </div>

            {/* Outstanding Balance */}
            {totalOutstanding > 0 && (
                <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-800">Outstanding Balance</p>
                                <p className="text-3xl font-bold text-yellow-900 mt-2">${totalOutstanding.toFixed(2)}</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    {invoices.filter((inv) => inv.status === "PENDING").length} pending invoice(s)
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <Card>
                <CardHeader>
                    <CardTitle>Search</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search invoices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Invoices List */}
            <Card>
                <CardHeader>
                    <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredInvoices.length === 0 ? (
                        <div className="text-center py-12">
                            <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No invoices found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredInvoices.map((invoice) => (
                                <div key={invoice.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-semibold text-lg">{invoice.invoiceNumber}</h4>
                                                {getStatusBadge(invoice.status)}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{invoice.clinic.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-blue-600">${invoice.totalAmount.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded p-3 mb-3">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <p className="text-gray-600">Amount:</p>
                                            <p className="text-right">${invoice.amount.toFixed(2)}</p>
                                            <p className="text-gray-600">Tax:</p>
                                            <p className="text-right">${invoice.tax.toFixed(2)}</p>
                                            <p className="font-semibold text-gray-900">Total:</p>
                                            <p className="text-right font-semibold">${invoice.totalAmount.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Created: {new Date(invoice.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {invoice.description && (
                                        <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                                            <p className="font-medium text-gray-700">Description:</p>
                                            <p className="text-gray-600">{invoice.description}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 flex-wrap">
                                        <Link href={`/patient/invoices/${invoice.id}`}>
                                            <Button size="sm" variant="outline" className="text-blue-600">
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Details
                                            </Button>
                                        </Link>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-gray-600"
                                            onClick={() => downloadInvoicePDF(invoice)}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        {invoice.status === "PENDING" && (
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handlePayNow(invoice.id)}
                                            >
                                                <DollarSign className="w-4 h-4 mr-2" />
                                                Pay Now
                                            </Button>
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
