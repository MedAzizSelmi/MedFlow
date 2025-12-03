"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Search, FileText, Calendar } from "lucide-react"

interface Invoice {
    id: string
    invoiceNumber: string
    amount: number
    tax: number
    totalAmount: number
    status: string
    dueDate: string
    paymentDate: string | null
    description: string | null
    createdAt: string
    patient: {
        user: {
            firstName: string
            lastName: string
            email: string
            phone: string | null
        }
    }
}

export default function ReceptionBillingPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const res = await fetch("/api/receptionist/invoices")
            if (res.ok) setInvoices(await res.json())
        } catch (error) {
            console.error("Error fetching invoices:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCashPayment = async (invoiceId: string) => {
        if (!confirm("Mark this invoice as paid with cash?")) return

        try {
            const res = await fetch(`/api/receptionist/invoices/${invoiceId}/pay-cash`, {
                method: "POST",
            })

            if (!res.ok) throw new Error("Failed to process payment")

            await fetchData()
            alert("Invoice marked as paid!")
        } catch (error) {
            console.error("Error processing cash payment:", error)
            alert("Failed to process cash payment")
        }
    }

    const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
        try {
            const res = await fetch("/api/receptionist/invoices", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: invoiceId,
                    status: newStatus,
                    paymentDate: newStatus === "PAID" ? new Date().toISOString() : null,
                }),
            })

            if (!res.ok) throw new Error("Failed to update invoice")

            await fetchData()
        } catch (error) {
            console.error("Error updating invoice:", error)
            alert("Failed to update invoice")
        }
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

    const filteredInvoices = invoices.filter((invoice) => {
        const matchesSearch =
            searchTerm === "" ||
            invoice.patient.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.patient.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "all" || invoice.status === statusFilter

        return matchesSearch && matchesStatus
    })

    // Calculate stats
    const stats = {
        totalPending: invoices
            .filter((inv) => inv.status === "PENDING")
            .reduce((sum, inv) => sum + inv.totalAmount, 0),
        totalPaid: invoices
            .filter((inv) => inv.status === "PAID")
            .reduce((sum, inv) => sum + inv.totalAmount, 0),
        pendingCount: invoices.filter((inv) => inv.status === "PENDING").length,
    }

    if (loading) return <div className="text-center py-12">Loading invoices...</div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Billing & Payments</h1>
                <p className="text-gray-600 mt-1">Manage patient invoices and payments</p>
                <p className="text-sm text-blue-600 mt-1">
                    💡 Invoices are automatically created when appointments are booked
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Payments</p>
                                <p className="text-2xl font-bold mt-2">${stats.totalPending.toFixed(2)}</p>
                                <p className="text-xs text-gray-600 mt-1">{stats.pendingCount} invoices</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Paid</p>
                                <p className="text-2xl font-bold mt-2">${stats.totalPaid.toFixed(2)}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold mt-2">
                                    ${(stats.totalPending + stats.totalPaid).toFixed(2)}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                                    placeholder="Search by patient or invoice number..."
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
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="PAID">Paid</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>No invoices found</p>
                            <p className="text-sm mt-2">Invoices will appear here when appointments are booked</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredInvoices.map((invoice) => (
                                <div key={invoice.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-lg">
                                                    {invoice.patient.user.firstName} {invoice.patient.user.lastName}
                                                </h3>
                                                {getStatusBadge(invoice.status)}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">Invoice #{invoice.invoiceNumber}</p>
                                            {invoice.patient.user.phone && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    📞 {invoice.patient.user.phone}
                                                </p>
                                            )}
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

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Created: {new Date(invoice.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                                        </div>
                                        {invoice.paymentDate && (
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-green-600 font-medium">
                                                    Paid: {new Date(invoice.paymentDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {invoice.description && (
                                        <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                                            <p className="font-medium text-gray-700">Description:</p>
                                            <p className="text-gray-600">{invoice.description}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 flex-wrap">
                                        {invoice.status === "PENDING" && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleCashPayment(invoice.id)}
                                                >
                                                    💵 Mark as Paid (Cash)
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600"
                                                    onClick={() => updateInvoiceStatus(invoice.id, "CANCELLED")}
                                                >
                                                    Cancel Invoice
                                                </Button>
                                            </>
                                        )}
                                        {invoice.status === "PAID" && (
                                            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                                                ✓ Payment Received
                                            </span>
                                        )}
                                        {invoice.status === "CANCELLED" && (
                                            <span className="text-sm text-red-600 font-medium">Cancelled</span>
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
