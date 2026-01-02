"use client"

import { AuthGuard } from "@/lib/auth/auth-guard"
import { SheetManagementTable } from "@/components/admin/SheetManagementTable"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { LogOut } from "lucide-react"

export default function SheetManagementPage() {
    const { logout } = useAuthStore()

    return (
        <AuthGuard roles={['ADMIN', 'PRINT']}>
            <div className="min-h-screen bg-gray-50/50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Sheet Management</h1>
                            <p className="text-gray-500 mt-1">Manage and assign sheets for printing</p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={async () => {
                                await logout()
                                window.location.href = '/login'
                            }}
                            className="gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </div>

                    <SheetManagementTable />
                </div>
            </div>
        </AuthGuard>
    )
}
