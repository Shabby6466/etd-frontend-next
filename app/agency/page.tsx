"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Send, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { ApplicationsTable } from "@/components/dashboard/ApplicationsTable"
import { Application, Region } from "@/lib/types"
import { applicationAPI } from "@/lib/api/applications"
import { showNotification } from "@/lib/utils/notifications"
import { useAuthStore } from "@/lib/stores/auth-store"

export default function AgencyDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    blacklisted: 0,
  })

  const [applications, setApplications] = useState<Application[]>([])

    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
    const [showVerificationForm, setShowVerificationForm] = useState(false)
    const [fetchingTracking, setFetchingTracking] = useState(false)
    const [isActionLoading, setIsActionLoading] = useState(false)
    const { user, logout } = useAuthStore()
  
    useEffect(() => {
      fetchApplications()
    }, [])
  
    const fetchApplications = async () => {
      try {
        setIsLoading(true)
        const userAgency = user?.state || user?.agency
        console.log('Current user agency:', userAgency)
        
        // Use agency-specific API endpoint instead of fetching all applications
        const response = await applicationAPI.getAgencyApplications({ agency: userAgency })
        console.log('Agency applications:', response.data.length)
        
        // Transform applications to include agency tracking data
        const applicationsWithTracking: Application[] = response.data.map(app => ({
          ...app,
          agency_tracking: app.agency_tracking || []
        }))
        
        console.log('Final agency applications:', applicationsWithTracking.length)
        setApplications(applicationsWithTracking)
        setFetchingTracking(false)
        
       
      } catch (error) {
        console.error('Failed to fetch agency applications:', error)
        showNotification.error('Failed to fetch agency applications')
        setFetchingTracking(false)
      } finally {
        setIsLoading(false)
      }
    }
  
    const handleViewApplication = (application: Application) => {
      setSelectedApplication(application)
      setShowVerificationForm(false)
    }
  
    const handleSubmitVerification = async (data: {
      remarks: string
      attachment?: File
    }) => {
      if (!selectedApplication) return
  
      try {
        setIsActionLoading(true)
        await applicationAPI.submitVerification(selectedApplication.id, data)
        showNotification.success("Verification submitted successfully")
        setShowVerificationForm(false)
        await fetchApplications()
      } catch (error: any) {
        showNotification.error(error.response?.data?.message || "Failed to submit verification")
      } finally {
        setIsActionLoading(false)
      }
    }
  
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200'
        case 'FAILED': return 'bg-red-100 text-red-800 border-red-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }
  
    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'PENDING': return <Clock className="h-4 w-4" />
        case 'COMPLETED': return <CheckCircle className="h-4 w-4" />
        case 'FAILED': return <XCircle className="h-4 w-4" />
        default: return <Clock className="h-4 w-4" />
      }
    }
  
    if (isLoading) {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">
                  {fetchingTracking ? 'Fetching agency tracking data...' : 'Loading applications...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

  return (
    <div className="min-h-screen bg-background p-4 dashboardBackgroundColor ">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agency Dashboard</h1>
            <p className="text-gray-600">
              {/* Final review and approval of emergency travel documents */}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={async () => {
                await logout()
                window.location.href = '/login'
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications for Agency Review</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationsTable
              applications={applications}
              isLoading={isLoading}
              onRefresh={fetchApplications}
              userRole="AGENCY"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}