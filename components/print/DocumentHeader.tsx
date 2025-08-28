"use client"

import { Application } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"

interface DocumentHeaderProps {
  application: Application
}

export default function DocumentHeader({ application }: DocumentHeaderProps) {
  return (
    <div className="print:hidden bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Document Print Center</h1>
              <p className="text-sm text-gray-500">Print ETD Application</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            Application ID: {application.id}
          </Badge>
        </div>
      </div>
    </div>
  )
}