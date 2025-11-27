import { useCallback } from "react"
import { Toaster } from "sonner"
import { UploadLoginForm } from "./components/UploadLoginForm"
import { UploadManager } from "./components/UploadManager"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"

export default function App() {
  const { isAuthenticated, user, logout } = useAuthStore()

  const handleLogout = useCallback(async () => {
    await logout()
  }, [logout])

  return (
    <div className="min-h-screen backgroundColor flex items-center justify-center p-4">
      <Toaster position="top-right" />
      {!isAuthenticated || !user ? (
        <UploadLoginForm />
      ) : (
        <div className="w-full max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Upload Console</h1>
              <p className="text-sm text-gray-600 mt-1">
                Signed in as <span className="font-semibold">{user.fullName}</span> ({user.email})
              </p>
            </div>
            <Button variant="secondary" onClick={handleLogout} className="rounded-xl">
              Sign out
            </Button>
          </div>

          <UploadManager />
        </div>
      )}
    </div>
  )
}

