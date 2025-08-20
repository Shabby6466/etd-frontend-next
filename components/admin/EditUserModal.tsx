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
import { User } from "@/lib/types"
import { userAPI } from "@/lib/api/users"
import { locationsAPI } from "@/lib/api/locations"
import LocationSelector from "@/components/ui/location-selector"

const editUserSchema = z.object({
  password: z.string().optional().refine((val) => {
    // Only validate if password is provided and not empty
    if (!val || val.trim() === '') return true
    return val.length >= 6
  }, "Password must be at least 6 characters"),
  locationId: z.string().optional(),
  agencyType: z.string().optional(),
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface EditUserModalProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated: () => void
}

export function EditUserModal({ user, open, onOpenChange, onUserUpdated }: EditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      password: "",
      locationId: "",
      agencyType: "",
    },
  })

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        password: "",
        locationId: user.state || "", // For mission operators, location is stored in state
        agencyType: user.agency || "", // For agency users, agency type is stored in agency
      })
    }
  }, [user, form])


  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return

    setIsLoading(true)
    
    try {
      // Prepare payload based on role-specific rules
      const payload: any = {}
      
      if (data.password) {
        payload.password = data.password
      }

      // Role-specific field updates
      if (user.role === "MISSION_OPERATOR" && data.locationId) {
        payload.locationId = data.locationId
      } else if (user.role === "AGENCY" && data.agencyType) {
        payload.agencyType = data.agencyType // Use agencyType parameter
      }

      // Check if any fields were provided
      if (Object.keys(payload).length === 0) {
        showNotification.info("No changes were made")
        onOpenChange(false)
        return
      }

      console.log('Updating user with payload:', payload)
      
      await userAPI.update(user.id, payload)
      showNotification.success("User updated successfully")
      onOpenChange(false)
      form.reset()
      onUserUpdated()
    } catch (error: any) {
      console.error('Failed to update user:', error)
      showNotification.error(error.response?.data?.message || error.message || "Failed to update user")
    } finally {
      setIsLoading(false)
    }
  }

  if (!open || !user) return null

  // Check if user can be edited
  if (user.role === "ADMIN") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Cannot Edit Admin User
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Admin users cannot be edited through this interface for security reasons.
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Edit User: {user.fullName}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Role:</strong> {user.role.replace('_', ' ')}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {user.email}
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password (optional)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Leave blank to keep current password"
                {...form.register("password")}
                className={form.formState.errors.password ? "border-red-500" : ""}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Mission Operator - Location Selection */}
            {user.role === "MISSION_OPERATOR" && (
              <div className="space-y-2">
                <Label htmlFor="locationId">Location</Label>
                <LocationSelector
                  value={form.watch("locationId")}
                  onValueChange={(value) => form.setValue("locationId", value)}
                  placeholder="Select location"
                />
                <p className="text-xs text-gray-500">
                  Select a new location for this mission operator
                </p>
              </div>
            )}

            {/* Agency - Agency Type Selection */}
            {user.role === "AGENCY" && (
              <div className="space-y-2">
                <Label htmlFor="agencyType">Agency Type</Label>
                <select
                  id="agencyType"
                  {...form.register("agencyType")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Agency Type</option>
                  <option value="INTELLIGENCE_BUREAU">Intelligence Bureau</option>
                  <option value="SPECIAL_BRANCH_PUNJAB">Special Branch Punjab</option>
                  <option value="SPECIAL_BRANCH_SINDH">Special Branch Sindh</option>
                  <option value="SPECIAL_BRANCH_KPK">Special Branch KPK</option>
                  <option value="SPECIAL_BRANCH_BALOCHISTAN">Special Branch Balochistan</option>
                  <option value="SPECIAL_BRANCH_FEDERAL">Special Branch Federal</option>
                </select>
                <p className="text-xs text-gray-500">
                  Select the agency type for this user
                </p>
              </div>
            )}

            {/* Ministry - Only password is editable */}
            {user.role === "MINISTRY" && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-600">
                  For Ministry users, only the password can be updated.
                </p>
              </div>
            )}

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
                {isLoading ? "Updating..." : "Update User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
