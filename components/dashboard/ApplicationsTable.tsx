"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  MoreHorizontal, 
  Search, 
  Plus, 
  Upload, 
  Printer, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Download,
  Shield,
  RefreshCw
} from "lucide-react"
import { Application, Region, UserRole } from "@/lib/types"
import { formatDate, formatStatus, getStatusVariant } from "@/lib/utils/formatting"
import { showNotification } from "@/lib/utils/notifications"
import { applicationAPI } from "@/lib/api/applications"
import { locationsAPI, Location } from "@/lib/api/locations"
import QCModal from "./QCModal"

interface ApplicationsTableProps {
  applications: Application[]
  isLoading?: boolean
  onRefresh?: () => void
  userRole?: UserRole
  onApprove?: (id: string, remarks?: string) => Promise<void>
  onReject?: (id: string, remarks: string) => Promise<void>
  onBlacklist?: (id: string, remarks: string) => Promise<void>
  onSendToAgency?: (id: string, region: Region) => Promise<void>
  onUploadAttachment?: (id: string) => void
  onPrint?: (id: string) => void
  onSubmitVerification?: (id: string, remarks: string, attachment?: File) => Promise<void>
  // Pagination props
  pagination?: {
    currentPage: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    totalItems: number
  }
  onPageChange?: (page: number) => void
  // Filter props
  filters?: {
    submittedBy: string
    region: string
    search: string
  }
  onFilterChange?: (filters: { submittedBy?: string; region?: string; search?: string }) => void
  onClearFilters?: () => void
}

export function ApplicationsTable({ 
  applications, 
  isLoading, 
  onRefresh,
  userRole,
  onApprove,
  onReject,
  onBlacklist,
  onSendToAgency,
  onUploadAttachment,
  onPrint,
  onSubmitVerification,
  pagination,
  onPageChange,
  filters,
  onFilterChange,
  onClearFilters
}: ApplicationsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [locationsLoading, setLocationsLoading] = useState(false)
  
  // Internal pagination state (like UserManagementTable)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Use filters.search if available, otherwise use local searchTerm
  const currentSearchTerm = filters?.search || searchTerm
  const [qcModalOpen, setQcModalOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const router = useRouter()

  // Sync internal pagination state with external props
  useEffect(() => {
    if (pagination) {
      setCurrentPage(pagination.currentPage)
      setTotalPages(pagination.totalPages)
      setTotalItems(pagination.totalItems)
      setItemsPerPage(pagination.itemsPerPage)
    }
  }, [pagination])

  // Debug logging to see what's happening
  useEffect(() => {
    console.log('Pagination state:', {
      internalCurrentPage: currentPage,
      externalCurrentPage: pagination?.currentPage,
      totalPages: pagination?.totalPages
    })
  }, [currentPage, pagination])

  // Fetch locations for dropdown
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLocationsLoading(true)
        const locationsData = await locationsAPI.getAllLocations()
        setLocations(locationsData)
        setFilteredLocations(locationsData)
      } catch (error) {
        console.error('Failed to fetch locations:', error)
        showNotification.error('Failed to load locations')
      } finally {
        setLocationsLoading(false)
      }
    }

    fetchLocations()
  }, [])

  const filteredApplications = applications.filter((app) =>
    `${app.firstName} ${app.lastName}`.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
    app.citizenId.includes(currentSearchTerm) ||
    app.id.toLowerCase().includes(currentSearchTerm.toLowerCase())
  )

  const canPerformAction = (application: Application) => {
    switch (userRole) {
      case 'MISSION_OPERATOR':
        return application.status === 'DRAFT'
      case 'AGENCY':
        return ['SUBMITTED', 'AGENCY_REVIEW'].includes(application.status)
      case 'MINISTRY':
        return ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'MINISTRY_REVIEW', 'AGENCY_REVIEW', 'VERIFICATION_SUBMITTED', 'VERIFICATION_RECEIVED'].includes(application.status)
      case 'ADMIN':
        return true
      default:
        return false
    }
  }

  const canPrint = (application: Application) => {
    const canPrintResult = userRole === 'MISSION_OPERATOR' && 
           application.status === 'READY_FOR_PRINT'
    
    console.log('Print button check for application:', application.id, {
      userRole,
      status: application.status,
      canPrint: canPrintResult
    })
    
    return canPrintResult
  }

  const canPerformQC = (application: Application) => {
    return application.status === 'READY_FOR_QC'
  }

  const handleQcClick = (application: Application) => {
    setSelectedApplication(application)
    setQcModalOpen(true)
  }

  const handleQcSuccess = () => {
    onRefresh?.()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading applications...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="rounded-3xl">
        <CardHeader className="flex items-center justify-between gap-4" >
          
            <CardTitle>Applications</CardTitle>
            
            <div className="flex items-center gap-4">
            
              <Button 
                onClick={onRefresh} 
                variant="outline" 
                disabled={isLoading}
                className="flex items-center gap-2 hover:bg-white"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
                {userRole === 'MISSION_OPERATOR' && (
                <Button onClick={() => router.push("/applications/nadra")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Process Nadra
                </Button>
              )}
              {userRole === 'MISSION_OPERATOR' && (
                <Button onClick={() => router.push("/applications/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Application
                </Button>
              )}
            </div>
          
          
        </CardHeader>
        
        {/* Filter Section */}
        {(filters || onFilterChange) && (
          <div className="px-7 pb-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search applications..."
                  value={currentSearchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    onFilterChange?.({ search: e.target.value })
                  }}
                  className="pl-10 w-full rounded-xl"
                />
              </div>
              
                             {/* Region Filter */}
               <Select
                 value={filters?.region || 'all'}
                 onValueChange={(value) => onFilterChange?.({ region: value === 'all' ? '' : value })}
               >
                 <SelectTrigger className="rounded-xl">
                   <SelectValue placeholder={locationsLoading ? "Loading locations..." : "Select region"} />
                 </SelectTrigger>
                 <SelectContent>
                   <div className="p-2">
                     <div className="relative">
                       <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                       <Input
                         placeholder="Search locations..."
                         className="pl-8 h-8 text-sm"
                         onChange={(e) => {
                           const searchTerm = e.target.value.toLowerCase()
                           if (searchTerm === '') {
                             setFilteredLocations(locations)
                           } else {
                             const filtered = locations.filter(location =>
                               location.name.toLowerCase().includes(searchTerm)
                             )
                             setFilteredLocations(filtered)
                           }
                         }}
                       />
                     </div>
                   </div>
                   <SelectItem value="all">All Regions</SelectItem>
                   {filteredLocations.map((location) => (
                     <SelectItem key={location.location_id} value={location.name}>
                       {location.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
              
              {/* Clear Filters Button */}
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="rounded-xl"
                disabled={!filters?.submittedBy && !filters?.region && !currentSearchTerm}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}
        
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Application ID</th>
                <th className="text-left p-4 font-medium">Applicant</th>
                <th className="text-left p-4 font-medium">CNIC</th>
                <th className="text-center p-8 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Created</th>
                {userRole === 'AGENCY' && (
                  <th className="text-left p-5 font-medium">Verification Document</th>
                )}
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((application) => (
                <tr key={application.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <span className="font-mono text-sm">
                      {application.id}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {application.image && (
                        <div className="flex-shrink-0">
                          <img 
                            src={`data:image/jpeg;base64,${application.image}`}
                            alt="Citizen Photo" 
                            className="w-12 h-12 object-cover rounded border border-gray-300"
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {application.firstName && application.lastName 
                            ? `${application.firstName} ${application.lastName}`.trim()
                            : application.firstName || application.lastName || 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-sm">
                      {application.citizenId || 'N/A'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1 items-center">
                      <Badge variant={getStatusVariant(application.status)} >
                        {formatStatus(application.status)}
                      </Badge>
                      {application.processing && (
                        <Badge variant="outline" className="text-xs text-center">
                          Processing: {application.processing.sheet_no || 'No Sheet'}
                        </Badge>
                      )}
                    </div>
                  </td>
              
                  <td className="p-3 text-sm text-gray-500">
                    {formatDate(application.createdAt)}
                  </td>
                  {userRole === 'AGENCY' && (
                    <td className="p-3">
                      {application.verificationDocumentUrl ? (
                        <button
                          onClick={async () => {
                            if (!application.verificationDocumentUrl) return
                            
                            try {
                              const blob = await applicationAPI.downloadVerificationDocument(application.id)
                              const url = window.URL.createObjectURL(blob)
                              
                              const link = document.createElement('a')
                              link.href = url
                              link.download = `verification-document-${application.id.substring(0, 8)}.pdf`
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                              
                              setTimeout(() => window.URL.revokeObjectURL(url), 1000)
                            } catch (error) {
                              console.error('Download failed:', error)
                              // showNotification.error('Failed to download document')
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No document</span>
                      )}
                    </td>
                  )}
                  <td className="p-3">
                  <Button onClick={() => router.push(`/applications/${application.id}`) } className='bg-white text-gray-800  hover:text-gray-100'>
                          View Details
                        </Button>
                      
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/applications/${application.id}`)}
                        >
                          
                        </DropdownMenuItem>
                      
                       
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredApplications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No applications found
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {(pagination?.totalPages || totalPages) > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {((pagination?.currentPage || currentPage) - 1) * (pagination?.itemsPerPage || itemsPerPage) + 1} to{" "}
                {Math.min((pagination?.currentPage || currentPage) * (pagination?.itemsPerPage || itemsPerPage), pagination?.totalItems || totalItems)} of{" "}
                {pagination?.totalItems || totalItems} applications
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = (pagination?.currentPage || currentPage) - 1
                  setCurrentPage(newPage)
                  onPageChange?.(newPage)
                }}
                disabled={(pagination?.currentPage || currentPage) === 1 || isLoading}
              >
                Previous
              </Button>
             
              <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination?.totalPages || totalPages) }, (_, i) => {
                    let pageNum;
                    const currentPageNum = pagination?.currentPage || currentPage;
                    const totalPagesNum = pagination?.totalPages || totalPages;
                    
                    if (totalPagesNum <= 5) {
                      pageNum = i + 1;
                    } else if (currentPageNum <= 3) {
                      pageNum = i + 1;
                    } else if (currentPageNum >= totalPagesNum - 2) {
                      pageNum = totalPagesNum - 4 + i;
                    } else {
                      pageNum = currentPageNum - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPage(pageNum)
                          onPageChange?.(pageNum)
                        }}
                        disabled={isLoading}
                        className={`w-8 h-8 p-0 ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" 
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = (pagination?.currentPage || currentPage) + 1
                  setCurrentPage(newPage)
                  onPageChange?.(newPage)
                }}
                disabled={(pagination?.currentPage || currentPage) === (pagination?.totalPages || totalPages) || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* QC Modal */}
    <QCModal
      application={selectedApplication}
      isOpen={qcModalOpen}
      onClose={() => {
        setQcModalOpen(false)
        setSelectedApplication(null)
      }}
      onSuccess={handleQcSuccess}
    />
  </>
  )
}
