"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Printer, Clock, CheckCircle } from "lucide-react"
import { ApplicationsTable } from "@/components/dashboard/ApplicationsTable"
import { Application } from "@/lib/types"
import { applicationAPI } from "@/lib/api/applications"
import { showNotification } from "@/lib/utils/notifications"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"

export default function MissionOperatorDashboard() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemCount: 0,
    itemsPerPage: 10,
    totalPages: 0,
    totalItems: 0
  })
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    approved: 0,
    pending: 0,
  })
  const [locationInfo, setLocationInfo] = useState<{
    location_id: string
    name: string
  } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const fetchApplications = async (page: number = 1, limit: number = 10) => {
    try {
      // Check if user has locationId
      if (!user?.locationId) {
        showNotification.error("Location ID not found. Please contact administrator.")
        setIsLoading(false)
        return
      }

      // Set loading state based on whether this is a search or initial load
      if (searchTerm || statusFilter) {
        setIsSearching(true)
      } else {
        setIsLoading(true)
      }

      // Fetch applications for user's specific location with pagination
      console.log('Fetching applications for location:', user.locationId, {
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      })
      
      const response = await applicationAPI.getApplicationsByLocation(user.locationId, {
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      })
      
      console.log('Location applications response:', response)
      
      setApplications(response.data || [])
      setPagination(response.meta)
      
      // Store location information if available
      if (response.location) {
        setLocationInfo(response.location)
      }
      
      // Calculate stats from all applications
      const totalApps = response.meta.totalItems || 0
      const submitted = response.data?.filter(app => 
        ['SUBMITTED', 'UNDER_REVIEW', 'AGENCY_REVIEW', 'MINISTRY_REVIEW'].includes(app.status)
      ).length || 0
      const approved = response.data?.filter(app => 
        ['READY_FOR_PERSONALIZATION', 'READY_FOR_PRINT', 'APPROVED', 'COMPLETED'].includes(app.status)
      ).length || 0
      const pending = response.data?.filter(app => 
        ['DRAFT'].includes(app.status)
      ).length || 0

      setStats({
        total: totalApps,
        submitted,
        approved,
        pending
      })
    } catch (error) {
      console.error('Error fetching applications by location:', error)
      showNotification.error("Failed to fetch applications")
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  const handlePrintApplication = (applicationId: string) => {
    // Open print view for completed/approved applications
    window.open(`/applications/${applicationId}/print`, '_blank')
  }

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (user?.locationId) {
        fetchApplications(1, 10)
      }
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter])

  // Initial load effect
  useEffect(() => {
    if (user?.locationId) {
      fetchApplications(1, 10)
    }
  }, [user])

  return (
    <div className="min-h-screen bg-background dashboardBackgroundColor  p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mission Operator Dashboard</h1>
            <p className="text-gray-600">
              Manage applications for {locationInfo?.name || user?.state} 
              {locationInfo?.location_id && ` (Location ID: ${locationInfo.location_id})`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push('/applications/new')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Application
            </Button>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <FileText className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
            
              <div className="text-sm text-gray-500 font-normal">
                Location: {locationInfo?.name || user?.state}
                {locationInfo?.location_id && ` (ID: ${locationInfo.location_id})`}
              </div>
            </CardTitle>
            {/* Search Bar */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by citizen ID, application ID, first name, or last name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="AGENCY_REVIEW">Agency Review</option>
                <option value="MINISTRY_REVIEW">Ministry Review</option>
                <option value="READY_FOR_PERSONALIZATION">Ready for Personalization</option>
                <option value="READY_FOR_PRINT">Ready for Print</option>
                <option value="APPROVED">Approved</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <Button 
                onClick={() => fetchApplications(1, pagination.itemsPerPage)}
                className="px-4 py-2"
                disabled={isSearching}
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
              {(searchTerm || statusFilter) && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("")
                    fetchApplications(1, pagination.itemsPerPage)
                  }}
                  className="px-4 py-2"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ApplicationsTable
              applications={applications}
              isLoading={isLoading || isSearching}
              onRefresh={() => fetchApplications(pagination.currentPage, pagination.itemsPerPage)}
              userRole="MISSION_OPERATOR"
              onPrint={handlePrintApplication}
              pagination={pagination}
              onPageChange={(page) => fetchApplications(page, pagination.itemsPerPage)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}