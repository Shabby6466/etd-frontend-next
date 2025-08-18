"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { agencyTrackingAPI, AgencyTracking } from "@/lib/api/agency-tracking"
import { applicationAPI } from "@/lib/api/applications"
import { showNotification } from "@/lib/utils/notifications"
import { formatDate, formatDateTime, formatStatus, getStatusVariant } from "@/lib/utils/formatting"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Application } from "@/lib/types"
import { Eye, FileText, Clock, CheckCircle, XCircle, LogOut, Download, Upload, Send, RefreshCw } from "lucide-react"
import { SubmitVerificationModal } from "@/components/agency/SubmitVerificationModal"
import { PDFLink } from "@/components/ui/PDFViewer"

export default function AgencyDashboard() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showVerificationForm, setShowVerificationForm] = useState(false)
  const [selectedAgency, setSelectedAgency] = useState<string>("")
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [fetchingTracking, setFetchingTracking] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const { user, logout } = useAuthStore()

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setLoading(true)
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
      setLoading(false)
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
      await fetchApplications() // Refresh the list
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

  if (loading) {
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agency Dashboard</h1>
            <p className="text-gray-600">
              Welcome, {user?.fullName} ({user?.state || user?.agency})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={fetchApplications} 
              variant="outline" 
              size="sm"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                await logout()
                window.location.href = '/login'
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Pending Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No pending verifications found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((application) => {
                      const agencyTracking = application.agency_tracking?.find(
                        tracking => tracking.agency_name === (user?.state || user?.agency)
                      )
                      
                      return (
                        <div
                          key={application.id}
                          className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
                            selectedApplication?.id === application.id ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                          onClick={() => handleViewApplication(application)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-sm">{application.id}</h3>
                            {agencyTracking && (
                              <Badge 
                                variant="outline"
                                className={`flex items-center gap-1 ${getStatusColor(agencyTracking.status)}`}
                              >
                                {getStatusIcon(agencyTracking.status)}
                                {agencyTracking.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">
                            {application.firstName} {application.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {application.citizenId}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Application Details */}
          <div className="lg:col-span-2">
            {selectedApplication ? (
              <div className="space-y-6">
                {/* Header with Status */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Application #{selectedApplication.id}</CardTitle>
                      <Badge variant={getStatusVariant(selectedApplication.status)}>
                        {formatStatus(selectedApplication.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Header Section with Photos and Data Sources */}
                    <div className="mb-8">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Photos Section */}
                        {(selectedApplication.image || selectedApplication.nadra_api_data?.image_url || selectedApplication.passport_api_data?.image_url) && (
                          <div className={`${(selectedApplication.nadra_api_data?.image_url || selectedApplication.passport_api_data?.image_url) ? 'lg:w-1/2' : 'lg:w-1/3'}`}>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
                              <h3 className="text-lg font-semibold mb-4 text-gray-800">Citizen Photographs</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                                {/* Main Citizen Photo */}
                                {selectedApplication.image && (
                                  <div className="flex flex-col items-center">
                                    <div className="border-2 border-gray-300 rounded-lg p-3 bg-white shadow-sm">
                                      <img
                                        src={`data:image/jpeg;base64,${selectedApplication.image}`}
                                        alt="Citizen Photograph"
                                        className="w-32 h-40 object-cover rounded"
                                      />
                                    </div>
                                    <span className="text-sm text-gray-600 mt-2">Uploaded Photo</span>
                                  </div>
                                )}

                                {/* NADRA Photo */}
                                {selectedApplication.nadra_api_data?.image_url && (
                                  <div className="flex flex-col items-center">
                                    <div className="border-2 border-blue-300 rounded-lg p-3 bg-white shadow-sm">
                                      <img
                                        src={selectedApplication.nadra_api_data.image_url}
                                        alt="NADRA Photograph"
                                        className="w-32 h-40 object-cover rounded"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                      />
                                      <div className="hidden w-32 h-40 bg-blue-50 border-2 border-blue-300 rounded flex items-center justify-center">
                                        <span className="text-blue-600 text-sm text-center">NADRA Photo<br />Not Available</span>
                                      </div>
                                    </div>
                                    <span className="text-sm text-blue-600 mt-2">NADRA Photo</span>
                                  </div>
                                )}

                                {/* Passport Photo */}
                                {selectedApplication.passport_api_data?.image_url && (
                                  <div className="flex flex-col items-center">
                                    <div className="border-2 border-green-300 rounded-lg p-3 bg-white shadow-sm">
                                      <img
                                        src={selectedApplication.passport_api_data.image_url}
                                        alt="Passport Photograph"
                                        className="w-32 h-40 object-cover rounded"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                      />
                                      <div className="hidden w-32 h-40 bg-green-50 border-2 border-green-300 rounded flex items-center justify-center">
                                        <span className="text-green-600 text-sm text-center">Passport Photo<br />Not Available</span>
                                      </div>
                                    </div>
                                    <span className="text-sm text-green-600 mt-2">Passport Photo</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Data Sources and Quick Info */}
                        <div className={`${(selectedApplication.nadra_api_data?.image_url || selectedApplication.passport_api_data?.image_url) ? 'lg:w-1/2' : 'lg:w-2/3'}`}>
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">
                              Data Sources & Verification
                            </h3>

                            {/* Data Source Indicators */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                              {/* NADRA */}
                              <div className="flex items-center justify-between rounded-xl border p-4 bg-blue-50/70 border-blue-200">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shrink-0" />
                                  <span className="font-medium text-blue-900 truncate">NADRA Data</span>
                                </div>
                                <Badge
                                  variant={selectedApplication.nadra_api_data ? "default" : "secondary"}
                                  className="shrink-0 px-3 py-1 text-xs rounded-full"
                                >
                                  {selectedApplication.nadra_api_data ? "Available" : "Not Available"}
                                </Badge>
                              </div>

                              {/* Passport */}
                              <div className="flex items-center justify-between rounded-xl border p-4 bg-green-50/70 border-green-200">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="w-3.5 h-3.5 rounded-full bg-green-500 shrink-0" />
                                  <span className="font-medium text-green-900 truncate">Passport Data</span>
                                </div>
                                <Badge
                                  variant={selectedApplication.passport_api_data ? "default" : "secondary"}
                                  className="shrink-0 px-3 py-1 text-xs rounded-full"
                                >
                                  {selectedApplication.passport_api_data ? "Available" : "Not Available"}
                                </Badge>
                              </div>
                            </div>

                            {/* Quick Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr flex-1">
                              <div className="rounded-xl border bg-gray-50 p-4 flex flex-col justify-between">
                                <div className="text-xl font-bold text-gray-900 leading-tight">
                                  {selectedApplication.firstName || "-"}
                                </div>
                                <div className="text-sm text-gray-600 mt-2">First Name</div>
                              </div>

                              <div className="rounded-xl border bg-gray-50 p-4 flex flex-col justify-between">
                                <div className="text-xl font-bold text-gray-900 leading-tight">
                                  {selectedApplication.lastName || "-"}
                                </div>
                                <div className="text-sm text-gray-600 mt-2">Last Name</div>
                              </div>

                              <div className="rounded-xl border bg-gray-50 p-4 flex flex-col justify-between">
                                <div className="font-mono text-base font-semibold text-gray-900 leading-tight break-all">
                                  {selectedApplication.citizenId || "-"}
                                </div>
                                <div className="text-sm text-gray-600 mt-2">Citizen ID</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Personal & Address */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 auto-rows-fr items-stretch">
                      <Section title="Personal Information" className="h-full">
                        <GridItem label="First Name" value={selectedApplication.firstName} />
                        <GridItem label="Last Name" value={selectedApplication.lastName} />
                        <GridItem label="Father's Name" value={selectedApplication.fatherName} />
                        <GridItem label="Mother's Name" value={selectedApplication.motherName} />
                        <GridItem label="Citizen ID" value={selectedApplication.citizenId} mono />
                        <GridItem label="Date of Birth" value={formatDate(selectedApplication.dateOfBirth)} />
                        <GridItem label="Birth Country" value={selectedApplication.birthCountry || '-'} />
                        <GridItem label="Birth City" value={selectedApplication.birthCity || '-'} />
                        <GridItem label="Profession" value={selectedApplication.profession} />
                      </Section>

                      <Section title="Physical & Address Information" className="h-full">
                        <GridItem label="Height" value={selectedApplication.height || '-'} />
                        <GridItem label="Eye Color" value={selectedApplication.colorOfEyes || '-'} />
                        <GridItem label="Hair Color" value={selectedApplication.colorOfHair || '-'} />
                        <GridItem label="City" value={selectedApplication.pakistanCity} />
                        <GridItem label="Address" value={selectedApplication.pakistanAddress} />
                      </Section>
                    </div>

                    {/* Travel & Request */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 auto-rows-fr items-stretch">
                      <Section title="Travel Information" className="h-full">
                        <GridItem label="Departure Date" value={formatDate(selectedApplication.departureDate)} />
                        <GridItem label="Transport Mode" value={selectedApplication.transportMode || '-'} />
                      </Section>

                      <Section title="Request & Financial Information" className="h-full">
                        <GridItem label="Investor" value={selectedApplication.investor || '-'} />
                        <GridItem label="Requested By" value={selectedApplication.requestedBy || '-'} />
                        <GridItem label="Reason for Deport" value={selectedApplication.reason_for_deport || '-'} />
                        <GridItem label="Amount" value={selectedApplication.securityDeposit || '-'} />
                      </Section>
                    </div>

                    {/* Status & Security */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 auto-rows-fr items-stretch">
                      <Section title="Application Status & Audit" className="h-full">
                        <GridItem label="Status" value={formatStatus(selectedApplication.status)} />
                        <GridItem label="Created At" value={formatDate(selectedApplication.createdAt)} />
                        <GridItem label="Last Updated" value={formatDate(selectedApplication.updatedAt)} />
                        {selectedApplication.createdBy?.fullName && (
                          <GridItem
                            label="Created By"
                            value={`${selectedApplication.createdBy.fullName}${selectedApplication.createdBy.state ? ` (${selectedApplication.createdBy.state})` : ` (${selectedApplication.createdBy.role})`}`}
                          />
                        )}
                        {selectedApplication.reviewedByUser?.fullName && (
                          <GridItem label="Reviewed By" value={`${selectedApplication.reviewedByUser.fullName} (${selectedApplication.reviewedByUser.role})`} />
                        )}
                      </Section>

                      {selectedApplication.reviewedBy && (
                        <Section title="Security & Verification" className="h-full">
                          <GridItem
                            label="FIA Blacklist Status"
                            value={
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${selectedApplication.isFiaBlacklist ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                <span>{selectedApplication.isFiaBlacklist ? "Blacklisted" : "Clear"}</span>
                              </div>
                            }
                          />
                          {selectedApplication.blacklistCheckPassed !== undefined && (
                            <GridItem
                              label="Blacklist Check"
                              value={
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${selectedApplication.blacklistCheckPassed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                  <span>{!selectedApplication.blacklistCheckPassed ? "Passed" : "Failed (Still Approved)"}</span>
                                </div>
                              }
                            />
                          )}
                        </Section>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Verification Document - For Agency Users */}
                {selectedApplication.status === "PENDING_VERIFICATION" && selectedApplication.verificationDocumentUrl && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Verification Document</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Ministry Verification Document */}
                        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-blue-600" />
                            <div>
                              <div className="bg-white border-l-4 border-blue-400 p-3 rounded-r-lg mt-2">
                                <div className="flex items-start gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm text-blue-800 font-medium mb-1">Verification Remarks</p>
                                    <p className="text-sm text-blue-700 leading-relaxed">
                                      {selectedApplication.verificationRemarks || 'No remarks provided.'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={async () => {
                              try {
                                const blob = await applicationAPI.downloadVerificationDocument(selectedApplication.id)
                                const url = URL.createObjectURL(blob)

                                const link = document.createElement('a')
                                link.href = url
                                link.download = `verification-document-${selectedApplication.id.substring(0, 8)}.pdf`
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)

                                setTimeout(() => URL.revokeObjectURL(url), 1000)
                              } catch (error) {
                                console.error('Download failed:', error)
                                showNotification.error('Failed to download document')
                              }
                            }}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>

                        {/* Agency Verification Remarks */}
                        {selectedApplication.agencyRemarks && selectedApplication.agencyRemarks.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-4">Verification Remarks</h4>
                            <div className="space-y-4">
                              {selectedApplication.agencyRemarks.map((remark: any, index: number) => (
                                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      <span className="font-medium text-gray-800">{remark.agency || 'Unknown Agency'}</span>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                      {remark.submittedAt ? formatDateTime(remark.submittedAt) : 'N/A'}
                                    </span>
                                  </div>

                                  <div className="mb-3">
                                    <div className="text-sm text-gray-600 mb-2">Remarks:</div>
                                    <div className="bg-white rounded-lg p-3 text-gray-800 border border-gray-200">
                                      {remark.remarks || 'No remarks provided'}
                                    </div>
                                  </div>

                                  {remark.attachmentUrl && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-blue-600" />
                                          <span className="text-sm font-medium text-blue-900">Agency Attachment</span>
                                        </div>
                                        <div className="flex gap-2">
                                          <PDFLink
                                            url=""
                                            fileName={`verification-${remark.agency}-${remark.submittedAt}.pdf`}
                                            className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                            applicationId={selectedApplication.id}
                                            agency={remark.agency}
                                          >
                                            <Eye className="h-3 w-3" />
                                            View
                                          </PDFLink>
                                          <span className="text-gray-400">|</span>
                                          <button
                                            onClick={async () => {
                                              try {
                                                const blob = await applicationAPI.downloadVerificationAttachment(
                                                  selectedApplication.id,
                                                  remark.agency
                                                )
                                                const downloadUrl = URL.createObjectURL(blob)

                                                const link = document.createElement('a')
                                                link.href = downloadUrl
                                                link.download = `verification-${remark.agency}-${remark.submittedAt}.pdf`
                                                document.body.appendChild(link)
                                                link.click()
                                                document.body.removeChild(link)

                                                setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
                                              } catch (error) {
                                                console.error('Download failed:', error)
                                                showNotification.error('Failed to download file')
                                              }
                                            }}
                                            className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                          >
                                            <Download className="h-3 w-3" />
                                            Download
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                {selectedApplication.status === "PENDING_VERIFICATION" && (() => {
                  const userAgency = user?.state || user?.agency
                  const agencyTracking = selectedApplication.agency_tracking?.find(
                    tracking => tracking.agency_name === userAgency
                  )
                  const hasCompletedVerification = agencyTracking?.status === 'COMPLETED' || agencyTracking?.status === 'FAILED'
                  
                  return !hasCompletedVerification ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-3">
                          <Button 
                            onClick={() => setShowVerificationForm(true)} 
                            disabled={isActionLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Upload className="mr-2 h-4 w-4" /> Submit Verification
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null
                })()}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Select an application to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Submit Verification Modal */}
      <SubmitVerificationModal
        isOpen={showVerificationForm}
        onClose={() => setShowVerificationForm(false)}
        onSubmit={handleSubmitVerification}
        isLoading={isActionLoading}
        applicationId={selectedApplication?.id}
      />
    </div>
  )
}

// Helper components
function Section({
  title,
  children,
  className = "",
  cols = 2,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col h-full ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-3">{title}</h3>
      <div className={`grid grid-cols-1 ${cols === 2 ? "md:grid-cols-2" : ""} gap-4 flex-1`}>
        {children}
      </div>
    </div>
  )
}

function GridItem({ label, value, mono }: { label: string; value?: string | React.ReactNode; mono?: boolean }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
      <div className={`text-gray-900 ${mono ? "font-mono" : "font-medium"}`}>{value || "-"}</div>
    </div>
  )
}