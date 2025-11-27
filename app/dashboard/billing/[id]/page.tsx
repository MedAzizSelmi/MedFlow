"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download, Printer } from "lucide-react"
import Link from "next/link"

interface InvoiceDetail {
  id: string
  invoiceNumber: string
  amount: number
  tax: number
  totalAmount: number
  status: string
  description: string
  dueDate: string
  paymentDate: string | null
  createdAt: string
  clinic: {
    name: string
    email: string
    phone: string
    address: string
  }
  patient: {
    user: {
      firstName: string
      lastName: string
      email: string
      phone: string
    }
  }
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${params.id}`)
        const data = await response.json()
        setInvoice(data)
      } catch (error) {
        console.error("Failed to fetch invoice:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) fetchInvoice()
  }, [params.id])

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!invoice) return <div className="flex items-center justify-center h-screen">Invoice not found</div>

  return (
    <div className="space-y-6">
      <Link href="/dashboard/billing" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Billing
      </Link>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Clinic Info */}
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">FROM</p>
              <h3 className="text-lg font-bold">{invoice.clinic.name}</h3>
              <p className="text-sm text-gray-600">{invoice.clinic.address}</p>
              <p className="text-sm text-gray-600">{invoice.clinic.email}</p>
              <p className="text-sm text-gray-600">{invoice.clinic.phone}</p>
            </div>

            {/* Patient Info */}
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">BILL TO</p>
              <h3 className="text-lg font-bold">
                {invoice.patient.user.firstName} {invoice.patient.user.lastName}
              </h3>
              <p className="text-sm text-gray-600">{invoice.patient.user.email}</p>
              <p className="text-sm text-gray-600">{invoice.patient.user.phone}</p>
            </div>
          </div>

          <div className="border-t my-6"></div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <p className="text-sm text-gray-600">Invoice Number</p>
              <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Invoice Date</p>
              <p className="text-lg font-semibold">{new Date(invoice.createdAt).toLocaleDateString("fr-FR")}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p className="text-lg font-semibold">{new Date(invoice.dueDate).toLocaleDateString("fr-FR")}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  invoice.status === "PAID"
                    ? "bg-green-100 text-green-800"
                    : invoice.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {invoice.status}
              </span>
            </div>
          </div>

          {invoice.description && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-600 mb-2">Description</p>
              <p className="text-gray-700">{invoice.description}</p>
            </div>
          )}

          {/* Amount Summary */}
          <div className="border-t pt-6 space-y-3">
            <div className="flex justify-between">
              <p className="text-gray-600">Subtotal</p>
              <p className="font-semibold">${invoice.amount.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-600">Tax (10%)</p>
              <p className="font-semibold">${invoice.tax.toFixed(2)}</p>
            </div>
            <div className="flex justify-between border-t pt-3">
              <p className="text-lg font-bold">Total</p>
              <p className="text-lg font-bold text-blue-600">${invoice.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {invoice.status === "PENDING" && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Payment pending.</span> This invoice can be paid online or through other
                methods.
              </p>
              <Button className="mt-3 bg-blue-600 hover:bg-blue-700">Pay Invoice</Button>
            </div>
          )}

          {invoice.status === "PAID" && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Paid on</span>{" "}
                {invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString("fr-FR") : "Unknown date"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
