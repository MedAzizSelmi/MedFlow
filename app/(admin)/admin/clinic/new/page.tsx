// app/(admin)/admin/dashboard/clinic/new/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function NewClinicPage() {
    const router = useRouter()
    const [form, setForm] = useState({
        name: "",
        address: "",
        city: "",
        postalCode: "",
        phone: "",
        email: "",
        licenseNumber: "",
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)
        try {
            const res = await fetch("/api/admin/clinic", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || "Failed")
            router.push("/admin/clinic")
        } catch (err: any) {
            setError(err.message || "Error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Create Clinic</h1>
                <p className="text-gray-600 mt-1">Set up your clinic</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Clinic Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="name" placeholder="Clinic Name" value={form.name} onChange={handleChange} required />
                        <Input name="email" type="email" placeholder="clinic@example.com" value={form.email} onChange={handleChange} required />
                        <Input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
                        <Input name="licenseNumber" placeholder="License Number" value={form.licenseNumber} onChange={handleChange} required />
                        <Input name="address" placeholder="Address" value={form.address} onChange={handleChange} required />
                        <Input name="city" placeholder="City" value={form.city} onChange={handleChange} required />
                        <Input name="postalCode" placeholder="Postal Code" value={form.postalCode} onChange={handleChange} required />

                        <div className="col-span-full flex gap-3 mt-4">
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                                {loading ? "Creating..." : "Create Clinic"}
                            </Button>
                        </div>

                        {error && <p className="text-red-600 col-span-full">{error}</p>}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
