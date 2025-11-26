"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Application } from "@/lib/types"
import { showNotification } from "@/lib/utils/notifications"
import { applicationAPI } from "@/lib/api/applications"
import { FileText } from "lucide-react"
import DocumentHeader from "@/components/print/DocumentHeader"
import PrintSidebar from "@/components/print/PrintSidebar"
import DocumentPreview from "@/components/print/DocumentPreview"
import DocumentPreviewToggle from "@/components/print/DocumentPreviewToggle"

export default function PrintApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const [application, setApplication] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sheetNo, setSheetNo] = useState("")
  const [isPrinting, setIsPrinting] = useState(false)
  const [isNewDesign, setIsNewDesign] = useState(false)

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const data = await applicationAPI.getById(params.id as string)
        setApplication(data)
      } catch (error) {
        showNotification.error("Failed to fetch application details")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchApplication()
    }
  }, [params.id])

  const handlePrint = async () => {
    if (!sheetNo.trim()) {
      showNotification.error("Please select a sheet number")
      return
    }

    // Check application status before printing
    if (!application) {
      showNotification.error("Application data not available")
      return
    }

    // Check if application status allows printing
    const allowedStatuses = ['READY_FOR_PRINT', 'APPROVED', 'VERIFIED', 'READY_FOR_PERSONALIZATION']
    if (!allowedStatuses.includes(application.status)) {
      showNotification.error(`Application status "${application.status}" does not allow printing. Status must be: ${allowedStatuses.join(', ')}`)
      return
    }

    setIsPrinting(true)
    try {
      // Call the print API with sheet number
      await applicationAPI.printApplicationWithSheet(application.id, sheetNo.trim())

      // Show success message
      showNotification.success("Print request submitted successfully")

      // Trigger browser print
      window.print()
      
      // Wait a moment for print dialog to close, then close the window/tab
      setTimeout(() => {
        // Close the current window/tab after successful printing
        window.close()
        // Fallback: if window.close() doesn't work (due to browser security), redirect to dashboard
        setTimeout(() => {
          router.back()
        }, 1000)
      }, 3000) // 3 second delay to allow print dialog to close and user to see success message
    } catch (error) {
      showNotification.error("Failed to submit print request")
      console.error('Print error:', error)
    } finally {
      setIsPrinting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading application details...</p>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <FileText className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Application Not Found</h2>
          <p className="text-gray-600">The requested application could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DocumentHeader application={application} />

      <div className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <PrintSidebar application={application} sheetNo={sheetNo} setSheetNo={setSheetNo} handlePrint={handlePrint} isPrinting={isPrinting} />
          
          <div className="lg:col-span-2">
            <DocumentPreviewToggle 
              isNewDesign={isNewDesign} 
              onToggle={setIsNewDesign} 
            />
            <DocumentPreview application={application} isNewDesign={isNewDesign} />
          </div>
        </div>
      </div>
    </div>
  )
}