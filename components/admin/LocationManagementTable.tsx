"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { locationsAPI, Location } from "@/lib/api/locations"
import { showNotification } from "@/lib/utils/notifications"
import { Search, Filter, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"

interface LocationFilters {
  page: number
  limit: number
  search?: string
  sortBy?: 'name' | 'location_id' | 'created_at'
  sortOrder?: 'ASC' | 'DESC'
}

export function LocationManagementTable() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Filters and pagination
  const [filters, setFilters] = useState<LocationFilters>({
    page: 1,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'ASC'
  })

  // Separate filter input states
  const [filterInputs, setFilterInputs] = useState({
    search: "",
    sortBy: "name",
    sortOrder: "ASC",
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
    fetchLocations()
  }, [filters])

  const fetchLocations = async () => {
    try {
      setLoading(true)
      const response = await locationsAPI.getLocations(filters)
      
      setLocations(response.data)
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev
      })
    } catch (error) {
      console.error('Error fetching locations:', error)
      showNotification.error('Failed to fetch locations')
      setLocations([])
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
      sortBy: filterInputs.sortBy as 'name' | 'location_id' | 'created_at',
      sortOrder: filterInputs.sortOrder as 'ASC' | 'DESC',
      limit: parseInt(filterInputs.limit),
      page: 1 // Reset to first page when applying filters
    }))
  }

  const clearFilters = () => {
    setFilterInputs({
      search: "",
      sortBy: "name",
      sortOrder: "ASC",
      limit: "10"
    })
    setFilters(prev => ({
      ...prev,
      search: undefined,
      sortBy: 'name',
      sortOrder: 'ASC',
      limit: 10,
      page: 1
    }))
  }

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading locations...</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search locations..."
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
              <Label htmlFor="sortBy">Sort By</Label>
              <Select 
                value={filterInputs.sortBy} 
                onValueChange={(value) => setFilterInputs(prev => ({ ...prev, sortBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="location_id">Location ID</SelectItem>
                  <SelectItem value="created_at">Created Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Select 
                value={filterInputs.sortOrder} 
                onValueChange={(value) => setFilterInputs(prev => ({ ...prev, sortOrder: value as 'ASC' | 'DESC' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASC">Ascending</SelectItem>
                  <SelectItem value="DESC">Descending</SelectItem>
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

      {/* Locations Table */}
      <Card className="rounded-3xl" >
        <CardHeader className="flex items-center justify-between">
            <CardTitle>Locations ({pagination.total})</CardTitle>
            <Button 
              onClick={fetchLocations} 
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
                  <th className="text-left p-4 font-medium">Location ID</th>
                  <th className="text-left p-4 font-medium">Name</th>  
                </tr>
              </thead>
              <tbody>
                {locations && locations.length > 0 ? locations.map((location) => (
                  <tr key={location.location_id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <span className="font-mono text-sm">
                        {location.location_id}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">
                        {location.name}
                      </div>
                    </td>
                  </tr>
                )) : null}
              </tbody>
            </table>
            {(!locations || locations.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No locations found matching the current filters
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {locations && locations.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} locations
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
