"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { showNotification } from "@/lib/utils/notifications"
import { UserRole, Region } from "@/lib/types"
import { userAPI } from "@/lib/api/users"
import { locationsAPI } from "@/lib/api/locations"
import { useAuthStore } from "@/lib/stores/auth-store"
import LocationSelector from "@/components/ui/location-selector"

const createUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(1, "Full name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MINISTRY", "AGENCY", "MISSION_OPERATOR"]),
  agency: z.string().optional(),
  locationId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
}).refine((data) => {
  // Agency role must have agency field
  if (data.role === "AGENCY" && !data.agency) {
    return false;
  }
  // Mission Operator must have locationId field
  if (data.role === "MISSION_OPERATOR" && !data.locationId) {
    return false;
  }
  return true;
}, {
  message: "Please fill in all required fields for the selected role",
  path: ["role"]
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface CreateUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUserModal({ open, onOpenChange }: CreateUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuthStore()

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      role: "MISSION_OPERATOR",
      agency: "",
      locationId: "",
      status: "ACTIVE",
    },
  })

  const watchedRole = form.watch("role")

  const onSubmit = async (data: CreateUserFormData) => {
    setIsLoading(true)
    
    // Prepare payload based on role requirements
    const payload: any = {
      email: data.email,
      fullName: data.fullName,
      password: data.password,
      role: data.role,
      status: data.status,
    }
    
    // Add role-specific fields
    if (data.role === "AGENCY") {
      payload.agencyType = data.agency // Use agencyType parameter
    } else if (data.role === "MISSION_OPERATOR") {
      // For Mission Operators, send both state name and locationId
      if (data.locationId) {
        // Find the location name from the locations list
        const locations = await locationsAPI.getAllLocations()
        const selectedLocation = locations.find((loc: any) => loc.location_id === data.locationId)
        
        if (selectedLocation) {
          payload.state = selectedLocation.name // Location name (e.g., "Punjab")
          payload.locationId = selectedLocation.location_id // Location ID (e.g., "2010")
        } else {
          // Fallback if location not found
          payload.state = data.locationId
          payload.locationId = data.locationId
        }
      }
    }
    // Ministry users don't need state field
    // ADMIN roles don't need additional fields
    
    console.log('Creating user with payload:', payload)
    
    try {
      await userAPI.create(payload)
      showNotification.success("User created successfully")
      onOpenChange(false)
      form.reset()
      // Trigger refresh of user list
      window.location.reload()
    } catch (error: any) {
      console.error('Failed to create user:', error)
      showNotification.error(error.response?.data?.message || error.message || "Failed to create user")
    } finally {
      setIsLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Create New User
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                {...form.register("fullName")}
                className={form.formState.errors.fullName ? "border-red-500" : ""}
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                className={form.formState.errors.email ? "border-red-500" : ""}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                className={form.formState.errors.password ? "border-red-500" : ""}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                {...form.register("role")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MISSION_OPERATOR">Mission Operator</option>
                <option value="AGENCY">Agency</option>
                <option value="MINISTRY">Ministry</option>
                {user?.role === "ADMIN" && (
                  <option value="ADMIN">Admin</option>
                )}
              </select>
            </div>

            {/* Ministry users don't need additional fields */}

            {/* Mission Operator Location */}
            {watchedRole === "MISSION_OPERATOR" && (
              <div className="space-y-2">
                <Label htmlFor="locationId">Location *</Label>
                <LocationSelector
                  value={form.watch("locationId")}
                  onValueChange={(value) => form.setValue("locationId", value)}
                  placeholder="Select location"
                />
                {form.formState.errors.locationId && watchedRole === "MISSION_OPERATOR" && (
                  <p className="text-sm text-red-500">Location is required</p>
                )}
              </div>
            )}

            {watchedRole === "AGENCY" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="agency">Agency *</Label>
                  <select
                    id="agency"
                    {...form.register("agency")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Agency</option>
                    <option value="INTELLIGENCE_BUREAU">Intelligence Bureau</option>
                    <option value="SPECIAL_BRANCH_PUNJAB">Special Branch Punjab</option>
                    <option value="SPECIAL_BRANCH_SINDH">Special Branch Sindh</option>
                    <option value="SPECIAL_BRANCH_KPK">Special Branch KPK</option>
                    <option value="SPECIAL_BRANCH_BALOCHISTAN">Special Branch Balochistan</option>
                    <option value="SPECIAL_BRANCH_FEDERAL">Special Branch Federal</option>
                  </select>
                </div>
            
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...form.register("status")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}