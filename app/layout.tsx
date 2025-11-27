import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "sonner"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { QueryProvider } from "@/components/providers/QueryProvider"

export const metadata: Metadata = {
  title: "Emergency Travel Document System",
  description: "Government application for processing emergency travel documents",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
        <Toaster position="top-right" closeButton richColors />
      </body>
    </html>
  )
}
