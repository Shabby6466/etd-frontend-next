import { apiClient } from './client'

export interface SheetAssignmentRequest {
  operator_id: number
  sheet_numbers: string[]
}

export interface SheetAssignmentResponse {
  message: string
  assigned_count: number
}

export interface Sheet {
  sheet_no: string
  issued_to: number
  issued_by: number
  location_id: number
  status: 'EMPTY' | 'QC_PASS' | 'QC_FAIL'
  issued_at: string
  used_at: string | null
  used_by_application: string | null
  operator_name: string
  admin_name: string
}

export interface SheetStats {
  total_sheets: number
  available_sheets: number
  qc_pass_sheets?: number
  qc_fail_sheets?: number
}

export interface SheetStatsFilters {
  page?: number
  limit?: number
  status?: 'EMPTY' | 'QC_PASS' | 'QC_FAIL'
  operator_id?: number
  location_id?: number
}

export interface SheetFilters {
  page?: number
  limit?: number
  operator_id?: number
  location_id?: number
  status?: 'EMPTY' | 'QC_PASS' | 'QC_FAIL'
}

export interface PaginatedSheetsResponse {
  data: Sheet[]
  meta: {
    currentPage: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    totalItems: number
  }
}

export const sheetsAPI = {
  // Assign sheet numbers to operator
  assignSheets: async (data: SheetAssignmentRequest): Promise<SheetAssignmentResponse> => {
    const response = await apiClient.post('/sheets/assign', data)
    return response.data
  },

  // Upload sheet numbers from file
  uploadSheets: async (file: File, operatorId: number, locationId: number): Promise<SheetAssignmentResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('operator_id', operatorId.toString())
    formData.append('location_id', locationId.toString())

    const response = await apiClient.post('/sheets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Get sheets with filtering and pagination
  getSheets: async (filters?: SheetFilters): Promise<PaginatedSheetsResponse> => {
    const params = new URLSearchParams()
    
    // Add pagination parameters
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    
    // Add filter parameters
    if (filters?.operator_id) params.append('operator_id', filters.operator_id.toString())
    if (filters?.location_id) params.append('location_id', filters.location_id.toString())
    if (filters?.status) params.append('status', filters.status)

    const response = await apiClient.get(`/sheets?${params.toString()}`)
    
    console.log('Raw sheets API response:', response.data)
    
    // Handle the API response structure
    let sheets = []
    let meta = {
      currentPage: 1,
      itemCount: 0,
      itemsPerPage: 10,
      totalPages: 0,
      totalItems: 0
    }
    
    if (response.data.data && response.data.meta) {
      // API returns { data: [...], meta: {...} }
      sheets = response.data.data
      meta = {
        currentPage: response.data.meta.currentPage || 1,
        itemCount: response.data.meta.itemCount || 0,
        itemsPerPage: response.data.meta.itemsPerPage || 10,
        totalPages: response.data.meta.totalPages || 0,
        totalItems: response.data.meta.totalItems || 0
      }
    } else if (response.data.sheets && response.data.pagination) {
      // Fallback for different API structure
      sheets = response.data.sheets
      const pagination = response.data.pagination
      meta = {
        currentPage: pagination.current_page || pagination.page || 1,
        itemCount: pagination.item_count || pagination.limit || 0,
        itemsPerPage: pagination.items_per_page || pagination.limit || 10,
        totalPages: pagination.total_pages || pagination.totalPages || 0,
        totalItems: pagination.total_items || pagination.total || 0
      }
    } else if (Array.isArray(response.data)) {
      // Fallback for array response (no pagination)
      sheets = response.data
      meta = {
        currentPage: 1,
        itemCount: sheets.length,
        itemsPerPage: sheets.length,
        totalPages: 1,
        totalItems: sheets.length
      }
    } else {
      // Fallback for empty response
      sheets = []
      meta = {
        currentPage: 1,
        itemCount: 0,
        itemsPerPage: 10,
        totalPages: 0,
        totalItems: 0
      }
    }
    
    return {
      data: sheets,
      meta
    }
  },

  // Get available sheets for operator
  getAvailableSheets: async (): Promise<string[]> => {
    const response = await apiClient.get('/sheets/available')
    return response.data
  },

  // Get sheet statistics
  getSheetStats: async (filters?: SheetStatsFilters): Promise<SheetStats> => {
    const params = new URLSearchParams()
    
    // Add pagination parameters
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    
    // Add filter parameters
    if (filters?.status) params.append('status', filters.status)
    if (filters?.operator_id) params.append('operator_id', filters.operator_id.toString())
    if (filters?.location_id) params.append('location_id', filters.location_id.toString())

    const response = await apiClient.get(`/sheets/stats?${params.toString()}`)
    return response.data
  },
}
