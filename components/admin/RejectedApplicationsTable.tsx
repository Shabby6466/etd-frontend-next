"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { useRejectedApplications } from "@/lib/hooks/queries"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Application } from "@/lib/types"
import { applicationAPI } from "@/lib/api/applications"
import { showNotification } from "@/lib/utils/notifications"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/utils/formatting"



interface RejectedApplicationFilters {
  page: number
  limit: number
  search?: string
  citizen_id?: string
  application_id?: string
  sheet_no?: string
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_order?: 'ASC' | 'DESC'
}

export function RejectedApplicationsTable() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [pageSize] = useState(10)

  // Filters and pagination
  const [filters, setFilters] = useState<RejectedApplicationFilters>({
    page: 1,
    limit: 10,
    search: "",
  })

  const [filterInputs, setFilterInputs] = useState({
    search: "",
    citizen_id: "",
    application_id: "",
    sheet_no: "",
    date_from: "",
    date_to: "",
    sort_by: "created_at",
    sort_order: "DESC",
    limit: "10"
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchRejectedApplications()
  }, [filters])
  
  const fetchRejectedApplications = async () => {
    try {
      setLoading(true)
      console.log('Fetching rejected applications with filters:', filters)
      
      const response = await applicationAPI.getRejectedApplications(filters)
      
      console.log('Rejected applications response:', response)
      
      setApplications(response.data)
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev
      })
    } catch (error) {
      console.error('Error fetching rejected applications:', error)
      showNotification.error('Failed to fetch rejected applications')
      setApplications([])
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    setFilters(prev => ({
      ...prev,
      search: filterInputs.search || undefined,
      citizen_id: filterInputs.citizen_id || undefined,
      application_id: filterInputs.application_id || undefined,
      sheet_no: filterInputs.sheet_no || undefined,
      date_from: filterInputs.date_from || undefined,
      date_to: filterInputs.date_to || undefined,
      sort_by: filterInputs.sort_by,
      sort_order: filterInputs.sort_order as 'ASC' | 'DESC',
      limit: parseInt(filterInputs.limit),
      page: 1 // Reset to first page when applying filters
    }))
  }

  const clearFilters = () => {
    setFilterInputs({
      search: "",
      citizen_id: "",
      application_id: "",
      sheet_no: "",
      date_from: "",
      date_to: "",
      sort_by: "created_at",
      sort_order: "DESC",
      limit: "10"
    })
    setFilters(prev => ({
      ...prev,
      search: undefined,
      citizen_id: undefined,
      application_id: undefined,
      sheet_no: undefined,
      date_from: undefined,
      date_to: undefined,
      sort_by: 'created_at',
      sort_order: 'DESC',
      limit: 10,
      page: 1
    }))
  }

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading rejected applications...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search applications..."
                  value={filterInputs.search}
                  onChange={(e) => setFilterInputs(prev => ({ ...prev, search: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyFilters()
                    }
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="citizen_id">Citizen ID</Label>
              <Input
                id="citizen_id"
                placeholder="Enter citizen ID"
                value={filterInputs.citizen_id}
                onChange={(e) => setFilterInputs(prev => ({ ...prev, citizen_id: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="application_id">Application ID</Label>
              <Input
                id="application_id"
                placeholder="Enter application ID"
                value={filterInputs.application_id}
                onChange={(e) => setFilterInputs(prev => ({ ...prev, application_id: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet_no">Sheet Number</Label>
              <Input
                id="sheet_no"
                placeholder="Enter sheet number"
                value={filterInputs.sheet_no}
                onChange={(e) => setFilterInputs(prev => ({ ...prev, sheet_no: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_from">Date From</Label>
              <Input
                id="date_from"
                type="date"
                value={filterInputs.date_from}
                onChange={(e) => setFilterInputs(prev => ({ ...prev, date_from: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_to">Date To</Label>
              <Input
                id="date_to"
                type="date"
                value={filterInputs.date_to}
                onChange={(e) => setFilterInputs(prev => ({ ...prev, date_to: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_by">Sort By</Label>
              <Select 
                value={filterInputs.sort_by} 
                onValueChange={(value) => setFilterInputs(prev => ({ ...prev, sort_by: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="print_time_stamp">Print Time</SelectItem>
                  <SelectItem value="first_name">First Name</SelectItem>
                  <SelectItem value="last_name">Last Name</SelectItem>
                  <SelectItem value="citizen_id">Citizen ID</SelectItem>
                  <SelectItem value="application_id">Application ID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Select 
                value={filterInputs.sort_order} 
                onValueChange={(value) => setFilterInputs(prev => ({ ...prev, sort_order: value as 'ASC' | 'DESC' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESC">Descending</SelectItem>
                  <SelectItem value="ASC">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Page Size</Label>
              <Select 
                value={filterInputs.limit} 
                onValueChange={(value) => setFilterInputs(prev => ({ ...prev, limit: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={clearFilters} variant="outline" size="sm" className="rounded-xl">
              Clear Filters
            </Button>
            <Button onClick={applyFilters} size="sm" className="rounded-xl">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card className="rounded-3xl">
        <CardHeader className="flex items-center justify-between">
            <CardTitle>Rejected Applications ({pagination.total})</CardTitle>
            <Button 
              onClick={fetchRejectedApplications} 
              variant="outline" 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Application ID</th>
                  <th className="text-left p-4 font-medium">Citizen ID</th>
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-center p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Created</th>
                  <th className="text-left p-4 font-medium">Created By</th>
                </tr>
              </thead>
              <tbody>
                {applications && applications.length > 0 ? applications.map((application) => (
                  <tr key={application.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <span className="font-mono text-sm">
                        {application.id}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-sm">
                        {application.citizenId}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">
                        {application.firstName} {application.lastName}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        <Badge 
                          variant={
                            application.status === 'APPROVED' ? 'default' :
                            application.status === 'REJECTED' ? 'destructive' : 
                            'secondary'
                          }
                          className={
                            application.status === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : ''
                          }
                        >
                          {application.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {formatDate(application.createdAt)}
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-sm">
                        {application.created_by_id || '-'}
                      </span>
                    </td>
                  </tr>
                )) : null}
              </tbody>
            </table>
            {(!applications || applications.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No rejected applications found matching the current filters
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {applications && applications.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} applications
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newFilters = { ...filters, page: pagination.page - 1 }
                    setFilters(newFilters)
                  }}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newFilters = { ...filters, page: pageNum }
                          setFilters(newFilters)
                        }}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newFilters = { ...filters, page: pagination.page + 1 }
                    setFilters(newFilters)
                  }}
                  disabled={!pagination.hasNext}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
