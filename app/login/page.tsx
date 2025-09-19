"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect authenticated users to their dashboard
      switch (user.role) {
        case "ADMIN":
          router.replace("/admin")
          break
        case "AGENCY":
          router.replace("/agency")
          break
        case "MINISTRY":
          router.replace("/ministry")
          break
        case "MISSION_OPERATOR":
          router.replace("/mission")
          break
        default:
          router.replace("/admin")
      }
    }
  }, [isAuthenticated, user, router])

  // Don't render login form if user is authenticated
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return <LoginForm />
}