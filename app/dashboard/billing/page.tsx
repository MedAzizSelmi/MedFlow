"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Eye, Download, DollarSign } from "lucide-react"
import Link from "next/link"

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
  patient: {
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const url = statusFilter === "ALL" ? "/api/invoices" : `/api/invoices?status=${statusFilter}`
        const response = await fetch(url)
        const data = await response.json()
        setInvoices(data)
      } catch (error) {
        console.error("Failed to fetch invoices:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoices()
  }, [statusFilter])

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patient.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patient.user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    paid: invoices.filter((inv) => inv.status === "PAID").reduce((sum, inv) => sum + inv.totalAmount, 0),
    pending: invoices.filter((inv) => inv.status === "PENDING").reduce((sum, inv) => sum + inv.totalAmount, 0),
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing & Invoices</h1>
          <p className="text-gray-600 mt-1">Manage patient invoices and payments</p>
        </div>
        <Link href="/dashboard/billing/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold mt-2">${stats.total.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold mt-2 text-green-600">${stats.paid.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold mt-2 text-yellow-600">${stats.pending.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 focus-visible:ring-0"
              />
            </div>
            <div className="flex gap-2">
              {["ALL", "PAID", "PENDING", "CANCELLED"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-center text-gray-500">No invoices found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Invoice Number</th>
                    <th className="text-left py-3 px-4 font-semibold">Patient</th>
                    <th className="text-left py-3 px-4 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold">{invoice.invoiceNumber}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">
                            {invoice.patient.user.firstName} {invoice.patient.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{invoice.patient.user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">${invoice.totalAmount.toFixed(2)}</td>
                      <td className="py-3 px-4">{new Date(invoice.dueDate).toLocaleDateString("fr-FR")}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/billing/${invoice.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
