"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { agencyTrackingAPI, AgencyStatistics as AgencyStats, AgencyTracking } from "@/lib/api/agency-tracking"
import { applicationAPI } from "@/lib/api/applications"
import { showNotification } from "@/lib/utils/notifications"
import { formatDate } from "@/lib/utils/formatting"
import { RefreshCw, TrendingUp, Clock, CheckCircle, XCircle, FileText, Download, Eye } from "lucide-react"

interface ApplicationWithAgencyTracking {
  id: string
  citizenId: string
  firstName: string
  lastName: string
  status: string
  agency_tracking?: AgencyTracking[]
}

// New interface for application-based statistics
interface ApplicationBasedStats {
  agency_name: string
  pending_applications: number
  completed_applications: number
  failed_applications: number
  total_applications: number
}

export function AgencyStatistics() {
  const [statistics, setStatistics] = useState<AgencyStats[]>([])
  const [applicationStats, setApplicationStats] = useState<ApplicationBasedStats[]>([])
  const [applications, setApplications] = useState<ApplicationWithAgencyTracking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'failed' | 'completed'>('pending')
  const [fetchingTracking, setFetchingTracking] = useState(false)
  const [summaryStats, setSummaryStats] = useState({
    totalApplications: 0,
    applicationsWithTracking: 0,
    totalAgencyRecords: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch raw statistics (for reference)
      const statsResponse = await agencyTrackingAPI.getStatistics()
      console.log('Raw Stats Response:', statsResponse)
      setStatistics(statsResponse.agency_statistics)
      
      // Fetch applications with pagination
      const appsResponse = await applicationAPI.getAll({
        page: 1,
        limit: 100 // Fetch more applications for statistics
      })
      console.log('Apps Response:', appsResponse)
      
      // Fetch agency tracking data for each application
      setFetchingTracking(true)
      const applicationsWithTracking: ApplicationWithAgencyTracking[] = []
      
      for (const app of appsResponse.data) {
        try {
          const trackingResponse = await agencyTrackingAPI.getAgencyTracking(app.id)
          applicationsWithTracking.push({
            id: app.id,
            citizenId: app.citizenId,
            firstName: app.firstName,
            lastName: app.lastName,
            status: app.status,
            agency_tracking: trackingResponse.agency_tracking || []
          })
        } catch (trackingError) {
          // If no agency tracking exists for this application, skip it
          console.log(`No agency tracking for application ${app.id}:`, trackingError)
        }
      }
      
      console.log('Applications with agency tracking:', applicationsWithTracking)
      console.log('Total applications with tracking:', applicationsWithTracking.length)
      
      setApplications(applicationsWithTracking)
      
      // Calculate application-based statistics
      const appStats = calculateApplicationBasedStats(applicationsWithTracking)
      setApplicationStats(appStats)
      
      // Set summary statistics
      const totalAgencyRecords = applicationsWithTracking.reduce((total, app) => 
        total + (app.agency_tracking?.length || 0), 0
      )
      
      setSummaryStats({
        totalApplications: appsResponse.data.length,
        applicationsWithTracking: applicationsWithTracking.length,
        totalAgencyRecords: totalAgencyRecords
      })
      
      setFetchingTracking(false)
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError('Failed to fetch agency statistics')
      showNotification.error('Failed to fetch agency statistics')
      setFetchingTracking(false)
    } finally {
      setLoading(false)
    }
  }

  // Calculate application-based statistics
  const calculateApplicationBasedStats = (apps: ApplicationWithAgencyTracking[]): ApplicationBasedStats[] => {
    const agencyMap = new Map<string, ApplicationBasedStats>()
    
    // Initialize all agencies with zero counts
    const allAgencies = new Set<string>()
    apps.forEach(app => {
      app.agency_tracking?.forEach(tracking => {
        allAgencies.add(tracking.agency_name)
      })
    })
    
    allAgencies.forEach(agency => {
      agencyMap.set(agency, {
        agency_name: agency,
        pending_applications: 0,
        completed_applications: 0,
        failed_applications: 0,
        total_applications: 0
      })
    })
    
    // Count applications per agency
    apps.forEach(app => {
      if (!app.agency_tracking || app.agency_tracking.length === 0) return
      
      // Group tracking by agency to avoid double-counting applications
      const agencyTrackingMap = new Map<string, AgencyTracking[]>()
      app.agency_tracking.forEach(tracking => {
        if (!agencyTrackingMap.has(tracking.agency_name)) {
          agencyTrackingMap.set(tracking.agency_name, [])
        }
        agencyTrackingMap.get(tracking.agency_name)!.push(tracking)
      })
      
      // For each agency, determine the overall status for this application
      agencyTrackingMap.forEach((trackings, agencyName) => {
        const stats = agencyMap.get(agencyName)
        if (!stats) return
        
        stats.total_applications++
        
        // Determine overall status for this application with this agency
        const hasPending = trackings.some(t => t.status === 'PENDING')
        const hasCompleted = trackings.some(t => t.status === 'COMPLETED')
        const hasFailed = trackings.some(t => t.status === 'FAILED')
        
        if (hasFailed) {
          stats.failed_applications++
        } else if (hasCompleted && !hasPending) {
          stats.completed_applications++
        } else if (hasPending) {
          stats.pending_applications++
        }
      })
    })
    
    return Array.from(agencyMap.values())
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

  // Filter applications by status
  const getApplicationsByStatus = (status: 'PENDING' | 'FAILED' | 'COMPLETED') => {
    const filtered = applications.filter(app => {
      // Check if application has agency tracking data
      if (!app.agency_tracking || app.agency_tracking.length === 0) {
        return false
      }
      
      // Check if any tracking entry has the specified status
      return app.agency_tracking.some(tracking => {
        console.log('Checking tracking:', tracking)
        return tracking.status === status
      })
    })
    console.log(`${status} applications:`, filtered.length, filtered)
    return filtered
  }

  const pendingApplications = getApplicationsByStatus('PENDING')
  const failedApplications = getApplicationsByStatus('FAILED')
  const completedApplications = getApplicationsByStatus('COMPLETED')

  const handleDownloadAttachment = async (attachmentUrl: string, agencyName: string) => {
    try {
      const response = await fetch(attachmentUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${agencyName}_verification.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download attachment:', error)
      showNotification.error('Failed to download attachment')
    }
  }

  const renderApplicationsTable = (applications: ApplicationWithAgencyTracking[], status: string) => {
    if (applications.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No {status.toLowerCase()} applications found
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left">Application ID</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Citizen Name</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Agency</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Submitted At</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Completed At</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Remarks</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => {
              const agencyTracking = application.agency_tracking?.filter(tracking => tracking.status === status)
              
              return agencyTracking?.map((tracking) => (
                <tr key={`${application.id}-${tracking.agency_name}`} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-mono">
                    {application.id}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {application.firstName} {application.lastName}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {tracking.agency_name}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Badge 
                      variant="outline"
                      className={`flex items-center gap-1 ${getStatusColor(tracking.status)}`}
                    >
                      {getStatusIcon(tracking.status)}
                      {tracking.status}
                    </Badge>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {tracking.submitted_at ? formatDate(tracking.submitted_at) : '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {tracking.completed_at ? formatDate(tracking.completed_at) : '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 max-w-xs">
                    <div className="truncate" title={tracking.remarks || ''}>
                      {tracking.remarks || '-'}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {tracking.attachment_url && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(tracking.attachment_url, '_blank')}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadAttachment(tracking.attachment_url!, tracking.agency_name)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agency Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">
                {fetchingTracking ? 'Fetching agency tracking data...' : 'Loading statistics...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agency Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Agency Statistics
          </CardTitle>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Debug Info */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p>Total Applications: {applications.length}</p>
                <p>Applications with Agency Tracking: {applications.filter(app => app.agency_tracking && app.agency_tracking.length > 0).length}</p>
                <p>Statistics: {JSON.stringify(statistics, null, 2)}</p>
                <details className="mt-2">
                  <summary>Raw Applications Data</summary>
                  <pre className="text-xs bg-gray-100 p-2 mt-2 overflow-auto max-h-40">
                    {JSON.stringify(applications.slice(0, 3), null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card> */}

          {/* Tab Buttons */}
          <div className="flex gap-2 border-b">
            <Button
              variant={activeTab === 'pending' ? 'default' : 'outline'}
              onClick={() => setActiveTab('pending')}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Pending ({pendingApplications.length})
            </Button>
            <Button
              variant={activeTab === 'failed' ? 'default' : 'outline'}
              onClick={() => setActiveTab('failed')}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Failed ({failedApplications.length})
            </Button>
            <Button
              variant={activeTab === 'completed' ? 'default' : 'outline'}
              onClick={() => setActiveTab('completed')}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Completed ({completedApplications.length})
            </Button>
          </div>

          {/* Content */}
          {activeTab === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Verifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderApplicationsTable(pendingApplications, 'PENDING')}
              </CardContent>
            </Card>
          )}

          {activeTab === 'failed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Failed Verifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderApplicationsTable(failedApplications, 'FAILED')}
              </CardContent>
            </Card>
          )}

          {activeTab === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Completed Verifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderApplicationsTable(completedApplications, 'COMPLETED')}
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
