"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { agencyTrackingAPI, AgencyTracking } from "@/lib/api/agency-tracking"
import { showNotification } from "@/lib/utils/notifications"
import { formatDate } from "@/lib/utils/formatting"
import { Download, Eye, Clock, CheckCircle, XCircle } from "lucide-react"

interface AgencyTrackingDashboardProps {
  applicationId: string
  onRefresh?: () => void
}

export function AgencyTrackingDashboard({ applicationId, onRefresh }: AgencyTrackingDashboardProps) {
  const [tracking, setTracking] = useState<AgencyTracking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAgencyTracking()
  }, [applicationId])

  const fetchAgencyTracking = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await agencyTrackingAPI.getAgencyTracking(applicationId)
      setTracking(response.agency_tracking)
    } catch (err) {
      console.error('Failed to fetch agency tracking:', err)
      setError('Failed to fetch agency tracking')
      showNotification.error('Failed to fetch agency tracking')
    } finally {
      setLoading(false)
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
      // showNotification.error('Failed to download attachment')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agency Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading agency tracking...</p>
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
          <CardTitle>Agency Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAgencyTracking} variant="outline">
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
          <CardTitle>Agency Tracking</CardTitle>
          <Button onClick={fetchAgencyTracking} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tracking.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No agency tracking found for this application
          </div>
        ) : (
          <div className="space-y-4">
            {tracking.map((agency) => (
              <div key={agency.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{agency.agency_name}</h3>
                    <p className="text-sm text-gray-500">ID: {agency.id}</p>
                  </div>
                  <Badge 
                    variant="outline"
                    className={`flex items-center gap-1 ${getStatusColor(agency.status)}`}
                  >
                    {getStatusIcon(agency.status)}
                    {agency.status}
                  </Badge>
                </div>
                
                {agency.remarks && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Remarks:</span> {agency.remarks}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <p><span className="font-medium">Submitted:</span> {agency.submitted_at ? formatDate(agency.submitted_at) : 'Not submitted'}</p>
                    {agency.submittedBy && (
                      <p><span className="font-medium">By:</span> {agency.submittedBy.fullName} ({agency.submittedBy.role})</p>
                    )}
                  </div>
                  
                  {agency.completed_at && (
                    <div>
                      <p><span className="font-medium">Completed:</span> {formatDate(agency.completed_at)}</p>
                      {agency.completedBy && (
                        <p><span className="font-medium">By:</span> {agency.completedBy.fullName} ({agency.completedBy.role})</p>
                      )}
                    </div>
                  )}
                </div>

                {agency.attachment_url && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(agency.attachment_url, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadAttachment(agency.attachment_url!, agency.agency_name)}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
