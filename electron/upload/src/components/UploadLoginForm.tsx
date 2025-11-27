import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { showNotification } from "@/lib/utils/notifications"
import { useAuthStore } from "@/lib/stores/auth-store"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

type UploadLoginFormProps = {
  onSuccess?: () => void
}

export function UploadLoginForm({ onSuccess }: UploadLoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
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
    try {
      const result = await login(data.email, data.password)
      if (result.success) {
        showNotification.success("Login successful")
        onSuccess?.()
      } else {
        showNotification.error(result.error || "Login failed")
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "An error occurred during login"
      showNotification.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md rounded-2xl card-glow">
      <CardHeader className="space-y-1 pb-4 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
          ETD Upload Console
        </CardTitle>
        <CardDescription>
          Authenticate to start syncing offline applications
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
              autoComplete="email"
              {...form.register("email")}
              className={form.formState.errors.email ? "border-red-500 rounded-xl" : "rounded-xl"}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1 pb-4">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              {...form.register("password")}
              className={form.formState.errors.password ? "border-red-500 rounded-xl" : "rounded-xl"}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full rounded-3xl bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

