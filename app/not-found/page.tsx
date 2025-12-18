"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFoundPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const handleGoHome = () => {
    if (isAuthenticated && user) {
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
          router.replace("/")
      }
    } else {
      router.replace("/login")
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-400">404</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-gray-600">
            The page you're looking for doesn't exist or you don't have permission to access it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-500">
            {isAuthenticated && user && (
              <p>Your current role: <span className="font-medium">{user.role}</span></p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleGoHome} 
              className="w-full flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Button>
            <Button 
              onClick={handleGoBack} 
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
