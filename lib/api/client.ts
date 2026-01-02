import axios from "axios"
import { useAuthStore } from "@/lib/stores/auth-store"
import { env } from "@/lib/config/env"

const API_BASE_URL = "http://localhost:3836/v1/api"
// const API_BASE_URL = "http://10.11.1.122:3836/v1/api"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
  },
})

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
      // Check if it's a "Not Found" error disguised as 401
      const errorMessage = error.response?.data?.message || error.response?.data?.error;
      const isApplicationNotFound = typeof errorMessage === 'string' &&
        errorMessage.toLowerCase().includes('application not found');

      // Only auto-logout if it's not a login endpoint or token verification endpoint
      // AND it's not an "Application not found" error (which should be 404 but might come as 401)
      const isLoginEndpoint = error.config?.url?.includes('/auth/login')
      const isVerifyEndpoint = error.config?.url?.includes('/auth/verify')

      if (!isLoginEndpoint && !isVerifyEndpoint && !isApplicationNotFound && typeof window !== "undefined") {
        console.log('401 error on non-auth endpoint, logging out')
        const { logout } = useAuthStore.getState()
        logout()
        window.location.href = "/login"
      } else if (isLoginEndpoint || isVerifyEndpoint) {
        console.log('401 error on auth endpoint, not auto-logging out')
      } else if (isApplicationNotFound) {
        console.log('401 error is "Application not found", not auto-logging out')
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
