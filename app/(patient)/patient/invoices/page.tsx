"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DollarSign, Download, Eye, Search } from "lucide-react"
import Link from "next/link"

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  totalAmount: number
  status: string
  dueDate: string
  createdAt: string
}

export default function PatientInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // TODO: Fetch invoices for current patient
    setIsLoading(false)
  }, [])

  const totalOutstanding = invoices
    .filter((inv) => inv.status === "PENDING")
    .reduce((sum, inv) => sum + inv.totalAmount, 0)

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
              </div>
              <Button className="bg-yellow-600 hover:bg-yellow-700">Pay Now</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No invoices found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h4 className="font-semibold">{invoice.invoiceNumber}</h4>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">${invoice.totalAmount.toFixed(2)}</p>
                      <span
                        className={`text-xs font-medium ${
                          invoice.status === "PAID" ? "text-green-600" : "text-yellow-600"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/patient/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="text-gray-600">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
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
