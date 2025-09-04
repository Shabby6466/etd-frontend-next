import axios from "axios"
import { useAuthStore } from "@/lib/stores/auth-store"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://172.17.128.145:3836/v1/api"
const PASSPORT_URL = "http://10.111.101.24:9009/api/passport"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000, // 8 second timeout for all API calls
  headers: {
    "Content-Type": "application/json",
  },
})
export const passportApiClient = axios.create({
  baseURL: PASSPORT_URL,
  timeout: 8000, // 8 second timeout for all API calls
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const { token } = useAuthStore.getState()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details for debugging
    console.log('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    })

    if (error.response?.status === 401) {
      // Only auto-logout if it's not a login endpoint or token verification endpoint
      const isLoginEndpoint = error.config?.url?.includes('/auth/login')
      const isVerifyEndpoint = error.config?.url?.includes('/auth/verify')
      
      if (!isLoginEndpoint && !isVerifyEndpoint && typeof window !== "undefined") {
        console.log('401 error on non-auth endpoint, logging out')
        const { logout } = useAuthStore.getState()
        logout()
        window.location.href = "/login"
      } else if (isLoginEndpoint || isVerifyEndpoint) {
        console.log('401 error on auth endpoint, not auto-logging out')
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
