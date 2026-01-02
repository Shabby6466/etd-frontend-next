"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showNotification } from "@/lib/utils/notifications"
import { useAuthStore } from "@/lib/stores/auth-store"
import DGIPWatermarks from "../ui/dgip_watermark"
import Image from "next/image"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const login = useAuthStore((state) => state.login)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    console.log('Login attempt:', { email: data.email })
    try {
      const result = await login(data.email, data.password)
      console.log('Login result:', { success: result.success, error: result.error })

      if (result.success) {
        showNotification.success("Login successful")

        const user = useAuthStore.getState().user
        console.log('User after login:', user)

        if (user) {
          switch (user.role) {
            case "ADMIN":
              console.log('Redirecting to admin dashboard')
              router.replace("/admin")
              break
            case "AGENCY":
              console.log('Redirecting to agency dashboard')
              router.replace("/agency")
              break
            case "MINISTRY":
              console.log('Redirecting to control center dashboard')
              router.replace("/ministry")
              break
            case "MISSION_OPERATOR":
              console.log('Redirecting to mission dashboard')
              router.replace("/mission")
              break
            case "PRINT":
              console.log('Redirecting to sheets dashboard')
              router.replace("/sheets")
              break
            default:
              console.log('Unknown role, redirecting to admin')
              router.replace("/admin")
          }
        } else {
          console.log('No user found, redirecting to home')
          router.replace("/")
        }
      } else {
        console.error('Login failed:', result.error)
        // Show the specific error message from the API
        showNotification.error(result.error || "Login failed")
      }
    } catch (error: any) {
      console.error('Login error:', error)
      // Enhanced error logging for debugging
      console.log('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      })

      // Try to extract error message from response
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "An error occurred during login"
      showNotification.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center backgroundColor p-4 ">
      <DGIPWatermarks />
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader className="space-y-1 pb-4 flex flex-col items-center justify-center">
          <div className="pb-2">
            <Image src="/login-logo.png" alt="DGIP Logo" width={250} height={150} />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Emergency Travel Document
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...form.register("email")}
                className={form.formState.errors.email ? "border-red-500 rounded-xl" : "rounded-xl"}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1 pb-8">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...form.register("password")}
                className={form.formState.errors.password ? "border-red-500 rounded-xl" : "rounded-xl"}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full rounded-3xl"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
