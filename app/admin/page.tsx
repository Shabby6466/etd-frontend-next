"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileText, CheckCircle, XCircle, Plus, UserPlus, ClipboardList, MapPin } from "lucide-react"
import { ApplicationsTable } from "@/components/dashboard/ApplicationsTable"
import { UserManagementTable } from "@/components/admin/UserManagementTable"
import { CreateUserModal } from "@/components/admin/CreateUserModal"
import { CompletedApplicationsTable } from "@/components/admin/CompletedApplicationsTable"
import { LocationManagementTable } from "@/components/admin/LocationManagementTable"
import { SheetManagementTable } from "@/components/admin/SheetManagementTable"
import { AgencyStatistics } from "@/components/admin/AgencyStatistics"
import { RejectedApplicationsStats } from "@/components/admin/RejectedApplicationsStats"
import { RejectedApplicationsTable } from "@/components/admin/RejectedApplicationsTable"
import { Application } from "@/lib/types"
import { applicationAPI } from "@/lib/api/applications"
import { showNotification } from "@/lib/utils/notifications"
import { useAuthStore } from "@/lib/stores/auth-store"


export default function AdminDashboard() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'applications' | 'users' | 'sheets' | 'locations' | 'completed' | 'rejected' | 'agency-stats'>('applications')
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
  const { logout } = useAuthStore()
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  })

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemCount: 0,
    itemsPerPage: 10,
    totalPages: 0,
    totalItems: 0
  })

  // Filter state
  const [filters, setFilters] = useState({
    submittedBy: '',
    region: '',
    search: ''
  })

  const fetchApplications = async (page: number = 1, limit: number = 10) => {
    try {
      setIsLoading(true)
      const response = await applicationAPI.getAll({
        page,
        limit,
        search: filters.search,
        submittedBy: filters.submittedBy || undefined,
        region: filters.region || undefined
      })
      setApplications(response.data)
      setPagination(response.meta)
    } catch (error) {
      showNotification.error("Failed to fetch applications")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await applicationAPI.getDashboardStats("admin")
      setStats(response)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    // The useEffect will handle the API call with debouncing
  }

  const clearFilters = async () => {
    setFilters({
      submittedBy: '',
      region: '',
      search: ''
    })
    await fetchApplications(1, pagination.itemsPerPage)
  }

  useEffect(() => {
    fetchApplications(1, 10)
    fetchStats()
  }, [])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchApplications(1, pagination.itemsPerPage)
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [filters.search, filters.submittedBy, filters.region])

  return (
    <div className="min-h-screen bg-background p-4 dashboardBackgroundColor">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage Emergency Travel Document applications and users</p>
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

        {/* Navigation Tabs */}
        <div className="flex ">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'applications'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Applications
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            User Management
          </button>
                     <button
             onClick={() => setActiveTab('sheets')}
             className={`px-6 py-3 font-medium text-sm ${
               activeTab === 'sheets'
                 ? 'border-b-2 border-blue-500 text-blue-600'
                 : 'text-gray-500 hover:text-gray-700'
             }`}
           >
             Sheet Management
           </button>
           <button
             onClick={() => setActiveTab('locations')}
             className={`px-6 py-3 font-medium text-sm ${
               activeTab === 'locations'
                 ? 'border-b-2 border-blue-500 text-blue-600'
                 : 'text-gray-500 hover:text-gray-700'
             }`}
           >
             Location Management
           </button>
           <button
             onClick={() => setActiveTab('completed')}
             className={`px-6 py-3 font-medium text-sm ${
               activeTab === 'completed'
                 ? 'border-b-2 border-blue-500 text-blue-600'
                 : 'text-gray-500 hover:text-gray-700'
             }`}
           >
             Completed Applications
           </button>
           <button
             onClick={() => setActiveTab('rejected')}
             className={`px-6 py-3 font-medium text-sm ${
               activeTab === 'rejected'
                 ? 'border-b-2 border-blue-500 text-blue-600'
                 : 'text-gray-500 hover:text-gray-700'
             }`}
           >
             Rejected Applications
           </button>
           <button
             onClick={() => setActiveTab('agency-stats')}
             className={`px-6 py-3 font-medium text-sm ${
               activeTab === 'agency-stats'
                 ? 'border-b-2 border-blue-500 text-blue-600'
                 : 'text-gray-500 hover:text-gray-700'
             }`}
           >
             Agency Statistics
           </button>
        </div>


        {/* Content based on active tab */}
        {activeTab === 'applications' && (
          <ApplicationsTable
            applications={applications}
            isLoading={isLoading}
            onRefresh={() => fetchApplications(pagination.currentPage, pagination.itemsPerPage)}
            pagination={pagination}
            onPageChange={(page) => fetchApplications(page, pagination.itemsPerPage)}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
          />
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* <div className="flex justify-between items-center">
              <Button
                onClick={() => setIsCreateUserModalOpen(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Create User
              </Button>
            </div> */}
            <UserManagementTable />
          </div>
        )}

                 {activeTab === 'sheets' && (
           <SheetManagementTable />
         )}

         {activeTab === 'locations' && (
           <LocationManagementTable />
         )}

         {activeTab === 'completed' && (
           <CompletedApplicationsTable />
         )}

         {activeTab === 'rejected' && (
           <div className="space-y-6">
             <RejectedApplicationsStats />
             <RejectedApplicationsTable />
           </div>
         )}

         {activeTab === 'agency-stats' && (
           <AgencyStatistics />
         )}

        {/* Create User Modal */}
        {/* <CreateUserModal
          open={isCreateUserModalOpen}
          onOpenChange={setIsCreateUserModalOpen}
        /> */}
      </div>
    </div>
  )
}
