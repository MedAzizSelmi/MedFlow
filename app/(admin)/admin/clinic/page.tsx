// app/(admin)/admin/dashboard/clinic/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ClinicPage() {
    const [clinic, setClinic] = useState<any | null>(undefined)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchClinic = async () => {
            try {
                const res = await fetch("/api/admin/clinic")
                const data = await res.json()
                setClinic(data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchClinic()
    }, [])

    if (loading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Clinic</h1>
                <p className="text-gray-600 mt-1">Clinic information and settings</p>
            </div>

            {!clinic ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <p className="text-gray-500">You don't have a clinic yet.</p>
                        <Link href="/admin/clinic/new">
                            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Create Clinic</button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>{clinic.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Address</p>
                                <p className="mt-1">{clinic.address}, {clinic.city} {clinic.postalCode}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="mt-1">{clinic.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="mt-1">{clinic.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">License</p>
                                <p className="mt-1">{clinic.licenseNumber}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
