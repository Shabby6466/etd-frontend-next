import { useState, useEffect } from "react"
import { locationsAPI, Location, LocationFilters, PaginatedLocationsResponse } from "@/lib/api/locations"
import { showNotification } from "@/lib/utils/notifications"

export function useLocations(filters?: LocationFilters) {
  const [locations, setLocations] = useState<Location[]>([])
  const [allLocations, setAllLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Omit<PaginatedLocationsResponse, 'data'>>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  })

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
      showNotification.error("Failed to fetch locations")
    } finally {
      setLoading(false)
    }
  }

  const fetchAllLocations = async () => {
    try {
      const allLocations = await locationsAPI.getAllLocations()
      const sortedLocations = allLocations.sort((a, b) => a.name.localeCompare(b.name))
      setAllLocations(sortedLocations)
    } catch (error) {
      showNotification.error("Failed to fetch all locations")
    }
  }


  const searchLocations = async (query: string, limit?: number) => {
    try {
      return await locationsAPI.searchLocations(query, limit)
    } catch (error) {
      showNotification.error("Failed to search locations")
      throw error
    }
  }

  useEffect(() => {
    fetchLocations()
    fetchAllLocations()
  }, [filters])

  return {
    locations,
    allLocations,
    loading,
    pagination,
    fetchLocations,
    fetchAllLocations,
    searchLocations
  }
}
