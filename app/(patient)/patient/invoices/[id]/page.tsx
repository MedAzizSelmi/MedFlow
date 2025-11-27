"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download, Printer } from "lucide-react"

export default function PatientInvoiceDetailPage() {
  const params = useParams()

  return (
    <div className="space-y-6">
      <Link href="/patient/invoices" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Invoices
      </Link>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Invoice</h1>
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
          <div className="text-center py-12 text-gray-500">Invoice details will load here</div>
        </CardContent>
      </Card>
    </div>
  )
}
