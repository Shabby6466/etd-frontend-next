"use client"

import { Application } from "@/lib/types"
import { showNotification } from "@/lib/utils/notifications"
import { formatDate } from "@/lib/utils/formatting"
import SheetSelector from "@/components/operator/SheetSelector"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Printer, User, Calendar } from "lucide-react"

interface PrintSidebarProps {
  application: Application
  sheetNo: string
  setSheetNo: (sheetNo: string) => void
  handlePrint: () => void
  isPrinting: boolean
}

export default function PrintSidebar({ 
  application, 
  sheetNo, 
  setSheetNo, 
  handlePrint, 
  isPrinting 
}: PrintSidebarProps) {
  return (
    <div className="print:hidden lg:col-span-1">
      <div className="space-y-6">
        {/* Application Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Application Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{application.firstName} {application.lastName}</p>
              </div>
              <div>
                <p className="text-gray-500">Citizen ID</p>
                <p className="font-medium">{application.citizenId}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <Badge variant="secondary" className="text-xs">
                  {application.status}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium">{formatDate(application.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print Controls Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Printer className="h-5 w-5" />
              <span>Print Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sheet Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sheet Number</label>
              <SheetSelector
                onSheetSelect={setSheetNo}
                selectedSheet={sheetNo}
                disabled={isPrinting}
                compact={true}
              />
            </div>

            {/* Print Button */}
            <Button
              onClick={handlePrint}
              disabled={isPrinting || !sheetNo.trim()}
              className="w-full"
              size="lg"
            >
              {isPrinting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Document
                </>
              )}
            </Button>

            {/* Validation Message */}
            {!sheetNo.trim() && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                Please select a sheet number to proceed with printing
              </div>
            )}

            {/* Print Instructions */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <p className="font-medium mb-1">Print Instructions:</p>
              <ul className="space-y-1 text-xs">
                <li>• Document will be formatted for A4 paper</li>
                <li>• Ensure printer is properly configured</li>
                <li>• Use high-quality paper for best results</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Print History Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Print History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              <p>Last printed: {application.etdIssueDate ? formatDate(application.etdIssueDate) : 'Never'}</p>
              <p>Document type: {application.processing?.type || 'ETD'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
