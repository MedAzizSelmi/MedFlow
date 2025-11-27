"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Edit, Save, X } from "lucide-react"

interface PatientProfile {
  user: {
    email: string
    firstName: string
    lastName: string
    phone: string
  }
  dateOfBirth: string
  gender: string
  bloodType: string
  allergies: string
  emergencyContact: string
  emergencyPhone: string
}

export default function PatientProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<PatientProfile>>({})

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // TODO: Fetch patient profile
        setProfile({
          user: {
            email: session?.user?.email || "",
            firstName: session?.user?.name?.split(" ")[0] || "",
            lastName: session?.user?.name?.split(" ")[1] || "",
            phone: "",
          },
          dateOfBirth: "",
          gender: "",
          bloodType: "",
          allergies: "",
          emergencyContact: "",
          emergencyPhone: "",
        })
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [session])

  const handleEdit = () => {
    setFormData(profile || {})
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      // TODO: Save profile updates
      setIsEditing(false)
    } catch (error) {
      alert("Failed to save profile")
    }
  }

  if (isLoading) return <div className="text-center py-12">Loading...</div>
  if (!profile) return <div className="text-center py-12">Profile not found</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your personal information</p>
        </div>
        {!isEditing ? (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input value={profile.user.firstName} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input value={profile.user.lastName} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={profile.user.email} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.user?.phone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      user: { ...formData.user, phone: e.target.value },
                    } as any)
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Blood Type</label>
                <select
                  value={formData.bloodType || ""}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option>Select blood type</option>
                  <option>O+</option>
                  <option>O-</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Allergies</label>
                <Input
                  value={formData.allergies || ""}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Emergency Contact</label>
                <Input
                  value={formData.emergencyContact || ""}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Emergency Phone</label>
                <Input
                  value={formData.emergencyPhone || ""}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-medium mt-1">{profile.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-lg font-medium mt-1">{profile.user.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Blood Type</p>
                <p className="text-lg font-medium mt-1">{profile.bloodType || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Allergies</p>
                <p className="text-lg font-medium mt-1">{profile.allergies || "None"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
