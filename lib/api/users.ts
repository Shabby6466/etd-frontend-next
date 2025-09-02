import apiClient from "./client"
import { User } from "../types"

export interface CreateUserData {
  email: string
  fullName: string
  password: string
  role: "ADMIN" | "MINISTRY" | "AGENCY" | "MISSION_OPERATOR"
  agency?: string
  state?: string
  status: "ACTIVE" | "INACTIVE"
}

export interface UsersResponse {
  data: User[]
  meta: {
    currentPage: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    totalItems: number
  }
}

export interface UsersFilters {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export const userAPI = {
  // Get all users with pagination
  getAll: async (filters: UsersFilters = {}): Promise<UsersResponse> => {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.role) params.append('role', filters.role)
    if (filters.status) params.append('status', filters.status)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
    
    const response = await apiClient.get(`/users?${params.toString()}`)
    return response.data
  },

  // Get user by ID
  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`)
    return response.data
  },

  // Create new user (Admin only)
  create: async (data: CreateUserData): Promise<User> => {
    const response = await apiClient.post("/auth/admin/create-user", data)
    return response.data
  },

  // Update user
  update: async (id: string, data: Partial<CreateUserData>): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, data)
    return response.data
  },

  // Delete user
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`)
  },

  // Toggle user status (ACTIVE/INACTIVE)
  toggleStatus: async (id: string): Promise<User> => {
    const response = await apiClient.patch(`/users/${id}/toggle-status`)
    return response.data
  },

  // Fetch foreign mission offices for Ministry users
  getForeignMissionOffices: async (): Promise<string[]> => {
    const response = await apiClient.get("/users/foreign-mission-offices")
    return response.data
  },
}