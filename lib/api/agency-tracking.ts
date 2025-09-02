import apiClient from "./client"

export interface AgencyTracking {
  id: number
  application_id: string
  agency_name: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  remarks?: string
  attachment_url?: string
  submitted_at?: string
  submitted_by_user_id?: number
  completed_at?: string
  completed_by_user_id?: number
  created_at: string
  updated_at: string
  submittedBy?: {
    id: number
    email: string
    fullName: string
    role: string
  }
  completedBy?: {
    id: number
    email: string
    fullName: string
    role: string
  }
}

export interface AgencyStatistics {
  agency_name: string
  status: string
  count: string
}

export interface AgencyTrackingResponse {
  application_id: string
  agency_tracking: AgencyTracking[]
}

export interface PendingAgenciesResponse {
  application_id: string
  pending_agencies: AgencyTracking[]
}

export interface CompletedAgenciesResponse {
  application_id: string
  completed_agencies: AgencyTracking[]
}

export interface AgencyStatisticsResponse {
  agency_statistics: AgencyStatistics[]
}

export interface AgencyVerificationSubmitRequest {
  agency_name: string
  remarks: string
  attachment?: File
}

export const agencyTrackingAPI = {
  // Get agency statistics (Admin/Ministry Only)
  getStatistics: async (): Promise<AgencyStatisticsResponse> => {
    const response = await apiClient.get('/agency-tracking/statistics/overview')
    return response.data
  },

  // Get agency tracking for application
  getAgencyTracking: async (applicationId: string): Promise<AgencyTrackingResponse> => {
    const response = await apiClient.get(`/agency-tracking/${applicationId}`)
    return response.data
  },

  // Get specific agency tracking
  getAgencyTrackingByAgency: async (applicationId: string, agencyName: string): Promise<AgencyTracking> => {
    const response = await apiClient.get(`/agency-tracking/${applicationId}/${agencyName}`)
    return response.data
  },

  // Get pending agencies
  getPendingAgencies: async (applicationId: string): Promise<PendingAgenciesResponse> => {
    const response = await apiClient.get(`/agency-tracking/${applicationId}/pending`)
    return response.data
  },

  // Get completed agencies
  getCompletedAgencies: async (applicationId: string): Promise<CompletedAgenciesResponse> => {
    const response = await apiClient.get(`/agency-tracking/${applicationId}/completed`)
    return response.data
  },

  // Submit agency verification (Agency Only)
  submitVerification: async (
    applicationId: string, 
    agencyName: string, 
    data: AgencyVerificationSubmitRequest
  ): Promise<{ message: string; agency_tracking: AgencyTracking }> => {
    const formData = new FormData()
    formData.append('agency_name', data.agency_name)
    formData.append('remarks', data.remarks)
    
    if (data.attachment) {
      formData.append('attachment', data.attachment)
    }

    const response = await apiClient.post(
      `/agency-tracking/${applicationId}/${agencyName}/submit`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }
}
