"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { sheetsAPI, Sheet, SheetStats, SheetFilters } from "@/lib/api/sheets"
import { userAPI } from "@/lib/api/users"
import { locationsAPI } from "@/lib/api/locations"
import { showNotification } from "@/lib/utils/notifications"
import { formatDate } from "@/lib/utils/formatting"
import LocationSelector from "@/components/ui/location-selector"
import { parseSheetNumbers, validateSheetNumbers } from "@/lib/utils/sheet-parser"

interface User {
  id: string
  fullName: string
  email: string
  role: string
}

export default function SheetManagementPage() {
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [stats, setStats] = useState<SheetStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Assignment form state
  const [selectedOperator, setSelectedOperator] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [sheetNumbers, setSheetNumbers] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [sheetPreview, setSheetPreview] = useState("")

  // Filters and pagination
  const [filters, setFilters] = useState<SheetFilters>({
    page: 1,
    limit: 10
  })
  
  // Separate filter input states
  const [filterInputs, setFilterInputs] = useState({
    operator_id: "all",
    location_id: "all",
    status: "all",
    limit: "10"
  })
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemCount: 0,
    itemsPerPage: 10,
    totalPages: 0,
    totalItems: 0
  })



  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update preview when sheet numbers change
  useEffect(() => {
    if (sheetNumbers.trim()) {
      const parseResult = parseSheetNumbers(sheetNumbers)
      setSheetPreview(parseResult.preview)
    } else {
      setSheetPreview("")
    }
  }, [sheetNumbers])

  useEffect(() => {
    fetchData()
  }, [filters])

  const applyFilters = () => {
    setFilters(prev => ({
      ...prev,
      operator_id: filterInputs.operator_id && filterInputs.operator_id !== 'all' ? parseInt(filterInputs.operator_id) : undefined,
      location_id: filterInputs.location_id && filterInputs.location_id !== 'all' ? parseInt(filterInputs.location_id) : undefined,
      status: filterInputs.status && filterInputs.status !== 'all' ? filterInputs.status as 'EMPTY' | 'QC_PASS' | 'QC_FAIL' : undefined,
      limit: parseInt(filterInputs.limit),
      page: 1 // Reset to first page when applying filters
    }))
  }

  const clearFilters = () => {
    setFilterInputs({
      operator_id: "all",
      location_id: "all", 
      status: "all",
      limit: "10"
    })
    setFilters(prev => ({
      ...prev,
      operator_id: undefined,
      location_id: undefined,
      status: undefined,
      limit: 10,
      page: 1
    }))
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('Fetching data with filters:', filters)
      
      const [sheetsData, statsData, usersData] = await Promise.all([
        sheetsAPI.getSheets(filters),
        sheetsAPI.getSheetStats(filters),
        userAPI.getAll()
      ])
      
      console.log('Sheets API response:', sheetsData)
      console.log('Stats API response:', statsData)
      console.log('Users API response:', usersData)
      
      // Handle the new pagination structure
      let sheetsArray: Sheet[] = []
      let paginationData = {
        currentPage: 1,
        itemCount: 0,
        itemsPerPage: 10,
        totalPages: 0,
        totalItems: 0
      }
      
      if (sheetsData && typeof sheetsData === 'object') {
        if (Array.isArray(sheetsData)) {
          // API returned a simple array
          sheetsArray = sheetsData
          paginationData = {
            currentPage: 1,
            itemCount: sheetsArray.length,
            itemsPerPage: sheetsArray.length,
            totalPages: 1,
            totalItems: sheetsArray.length
          }
        } else if (sheetsData.data && Array.isArray(sheetsData.data) && sheetsData.meta) {
          // API returned paginated response with new structure
          sheetsArray = sheetsData.data
          paginationData = {
            currentPage: sheetsData.meta.currentPage || 1,
            itemCount: sheetsData.meta.itemCount || 0,
            itemsPerPage: sheetsData.meta.itemsPerPage || 10,
            totalPages: sheetsData.meta.totalPages || 0,
            totalItems: sheetsData.meta.totalItems || 0
          }
        } else if (sheetsData.data && Array.isArray(sheetsData.data)) {
          // Fallback for old pagination structure
          sheetsArray = sheetsData.data
          paginationData = {
            currentPage: (sheetsData as any).page || 1,
            itemCount: (sheetsData as any).limit || 10,
            itemsPerPage: (sheetsData as any).limit || 10,
            totalPages: (sheetsData as any).totalPages || 0,
            totalItems: (sheetsData as any).total || 0
          }
        }
      }
      
      setSheets(sheetsArray)
      setPagination(paginationData)
      setStats(statsData)
      setUsers(usersData.filter((user: any) => user.role === 'MISSION_OPERATOR'))
    } catch (error) {
      console.error('Error fetching data:', error)
      showNotification.error("Failed to fetch data")
      // Set default values on error
      setSheets([])
      setPagination({
        currentPage: 1,
        itemCount: 0,
        itemsPerPage: 10,
        totalPages: 0,
        totalItems: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignSheets = async () => {
    if (!selectedOperator) {
      showNotification.error("Please select an operator")
      return
    }

    // Validate sheet numbers input
    const validationErrors = validateSheetNumbers(sheetNumbers)
    if (validationErrors.length > 0) {
      showNotification.error(validationErrors[0])
      return
    }

    const parseResult = parseSheetNumbers(sheetNumbers)
    const sheetNumbersArray = parseResult.numbers

    if (sheetNumbersArray.length === 0) {
      showNotification.error("Please enter at least one sheet number")
      return
    }

    setAssigning(true)
    try {
      await sheetsAPI.assignSheets({
        operator_id: parseInt(selectedOperator),
        sheet_numbers: sheetNumbersArray
      })
      showNotification.success("Sheets assigned successfully")
      setSheetNumbers("")
      setSelectedOperator("")
      fetchData()
    } catch (error) {
      console.error('Error assigning sheets:', error)
      console.error('Error structure:', {
        hasResponse: error && typeof error === 'object' && 'response' in error,
        responseData: error && typeof error === 'object' && 'response' in error ? (error as any).response?.data : 'no response',
        directMessage: error && typeof error === 'object' && 'message' in error ? (error as any).message : 'no direct message',
        errorType: typeof error,
        errorKeys: error && typeof error === 'object' ? Object.keys(error) : 'not an object'
      })
      
      // Show the actual error message from the API response
      if (error && typeof error === 'object') {
        // Handle axios error response
        if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
          const responseData = error.response.data
          if (responseData && typeof responseData === 'object') {
            // Check for errors field first (contains detailed error message)
            if ('errors' in responseData && responseData.errors) {
              showNotification.error(responseData.errors as string)
            }
            // Fallback to message field
            else if ('message' in responseData && responseData.message) {
              showNotification.error(responseData.message as string)
            } else {
              showNotification.error('Failed to assign sheets')
            }
          } else {
            showNotification.error('Failed to assign sheets')
          }
        }
        // Handle direct error object with message
        else if ('message' in error) {
          showNotification.error(error.message as string)
        } else {
          showNotification.error('Failed to assign sheets')
        }
      } else if (error instanceof Error) {
        showNotification.error(error.message)
      } else {
        showNotification.error('Failed to assign sheets')
      }
    } finally {
      setAssigning(false)
    }
  }

  const handleUploadSheets = async () => {
    if (!selectedFile || !selectedOperator || !selectedLocation) {
      showNotification.error("Please select a file and fill in all required fields")
      return
    }

    setUploading(true)
    try {
      await sheetsAPI.uploadSheets(
        selectedFile,
        parseInt(selectedOperator),
        parseInt(selectedLocation)
      )
      showNotification.success("Sheets uploaded successfully")
      setSelectedFile(null)
      setSelectedOperator("")
      setSelectedLocation("")
      fetchData()
    } catch (error) {
      // Show the actual error message from the API response
      if (error && typeof error === 'object') {
        // Handle axios error response
        if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
          const responseData = error.response.data
          if (responseData && typeof responseData === 'object') {
            // Check for errors field first (contains detailed error message)
            if ('errors' in responseData && responseData.errors) {
              showNotification.error(responseData.errors as string)
            }
            // Fallback to message field
            else if ('message' in responseData && responseData.message) {
              showNotification.error(responseData.message as string)
            } else {
              showNotification.error('Failed to upload sheets')
            }
          } else {
            showNotification.error('Failed to upload sheets')
          }
        }
        // Handle direct error object with message
        else if ('message' in error) {
          showNotification.error(error.message as string)
        } else {
          showNotification.error('Failed to upload sheets')
        }
      } else if (error instanceof Error) {
        showNotification.error(error.message)
      } else {
        showNotification.error('Failed to upload sheets')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/plain") {
      setSelectedFile(file)
    } else {
      showNotification.error("Please select a valid text file")
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading sheet management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sheet Management</h1>
        <Button 
          onClick={() => {
            console.log('Current filters:', filters)
            console.log('Current sheets:', sheets)
            console.log('Current pagination:', pagination)
            fetchData()
          }}
          variant="outline"
          size="sm"
        >
          Refresh Data
        </Button>
      </div>

             {/* Statistics Cards */}
       {stats && (
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card className="rounded-3xl">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium">Total Sheets</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{stats.total_sheets}</div>
             </CardContent>
           </Card>
           <Card className="rounded-3xl">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium">Available Sheets</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-green-600">{stats.available_sheets}</div>
             </CardContent>
           </Card>
           
           {stats.qc_pass_sheets !== undefined && (
             <Card className="rounded-3xl">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium">QC Pass</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-green-600">{stats.qc_pass_sheets}</div>
               </CardContent>
             </Card>
           )}
           {stats.qc_fail_sheets !== undefined && (
             <Card className="rounded-3xl">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium">QC Fail</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-red-600">{stats.qc_fail_sheets}</div>
               </CardContent>
             </Card>
           )}
         </div>
       )}

             {/* Assignment Section */}
       <div className="grid grid-cols-1 gap-6">
         {/* Manual Assignment */}
         <Card className="rounded-3xl"  >
           <CardHeader>
             <CardTitle>Assign Sheets Manually</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="operator">Operator</Label>
                 <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                   <SelectTrigger>
                     <SelectValue placeholder="Select operator" />
                   </SelectTrigger>
                   <SelectContent>
                     {users.map((user) => (
                       <SelectItem key={user.id} value={user.id}>
                         {user.fullName} ({user.email})
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>

             <div className="space-y-2">
               <Label htmlFor="sheetNumbers">Sheet Numbers</Label>
               <div className="text-xs text-gray-500 mb-2">
                 Enter individual numbers (comma or newline separated) or use ranges like "100-104" to assign multiple sheets at once
               </div>
               <textarea
                 id="sheetNumbers"
                 value={sheetNumbers}
                 onChange={(e) => setSheetNumbers(e.target.value)}
                 placeholder="Enter sheet numbers (comma or newline separated, or use ranges like 100-104)"
                 className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 rows={4}
               />
               {sheetPreview && (
                 <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
                   <strong>Preview:</strong> {sheetPreview}
                 </div>
               )}
             </div>

             <Button 
               onClick={handleAssignSheets} 
               disabled={assigning}
               className="w-full"
             >
               {assigning ? "Assigning..." : "Assign Sheets"}
             </Button>
           </CardContent>
         </Card>
       </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filterOperator">Operator</Label>
              <Select 
                value={filterInputs.operator_id} 
                onValueChange={(value) => setFilterInputs(prev => ({ ...prev, operator_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operator (or leave empty for all)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All operators</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterLocation">Location</Label>
              <LocationSelector
                value={filterInputs.location_id}
                onValueChange={(value) => setFilterInputs(prev => ({ 
                  ...prev, 
                  location_id: value 
                }))}
                placeholder="All locations"
              />
            </div>

                          <div className="space-y-2">
                <Label htmlFor="filterStatus">Status</Label>
                <Select 
                  value={filterInputs.status} 
                  onValueChange={(value) => setFilterInputs(prev => ({ 
                    ...prev, 
                    status: value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status (or leave empty for all)" />
                  </SelectTrigger>
                                 <SelectContent>
                   <SelectItem value="all">All statuses</SelectItem>
                   <SelectItem value="EMPTY">Empty</SelectItem>
                   <SelectItem value="QC_PASS">QC Pass</SelectItem>
                   <SelectItem value="QC_FAIL">QC Fail</SelectItem>
                 </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pageSize">Page Size</Label>
              <Select 
                value={filterInputs.limit} 
                onValueChange={(value) => setFilterInputs(prev => ({ 
                  ...prev, 
                  limit: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear Filters
            </Button>
            <Button onClick={applyFilters} size="sm">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sheets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sheets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Sheet No</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Operator</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Issued At</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Used At</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Application</th>
                </tr>
              </thead>
              <tbody>
                {sheets && sheets.length > 0 ? sheets.map((sheet) => (
                  <tr key={sheet.sheet_no} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-mono">
                      {sheet.sheet_no}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {sheet.operator_name}
                    </td>
                                         <td className="border border-gray-300 px-4 py-2">
                                               <Badge 
                          variant={
                            sheet.status === 'QC_PASS' ? 'default' :
                            sheet.status === 'QC_FAIL' ? 'destructive' : 
                            'secondary'
                          }
                          className={
                            sheet.status === 'QC_PASS' ? 'bg-green-600 hover:bg-green-700' : ''
                          }
                        >
                         {sheet.status}
                       </Badge>
                     </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {formatDate(sheet.issued_at)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {sheet.used_at ? formatDate(sheet.used_at) : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {sheet.used_by_application || '-'}
                    </td>
                  </tr>
                )) : null}
              </tbody>
            </table>
            {(!sheets || sheets.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No sheets found matching the current filters
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {sheets && sheets.length > 0 && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} sheets
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newFilters = { ...filters, page: pagination.currentPage - 1 }
                    setFilters(newFilters)
                  }}
                  disabled={pagination.currentPage <= 1}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.currentPage === pageNum ? "default" : "outline"}
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
                  {pagination.totalPages > 5 && (
                    <span className="px-2 text-sm text-gray-500">...</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newFilters = { ...filters, page: pagination.currentPage + 1 }
                    setFilters(newFilters)
                  }}
                  disabled={pagination.currentPage >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
