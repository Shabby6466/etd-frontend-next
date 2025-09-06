import { env } from '@/lib/config/env'

export const API_CONFIG = {
  BASE_URL: env.NEXT_PUBLIC_API_URL || 'http://172.17.128.145:3836/v1/api',
  TIMEOUT: 60000, // Increased timeout to 60 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000 // Increased retry delay
}

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    CREATE_USER: '/auth/admin/create-user'
  },
  
  // Users
  USERS: {
    LIST: '/users',
    PROFILE: '/users/profile',
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`
  },
  
  // Applications
  APPLICATIONS: {
    LIST: '/applications',
    CREATE: '/applications',
    GET: (id: string) => `/applications/${id}`,
    UPDATE: (id: string) => `/applications/${id}`,
    DELETE: (id: string) => `/applications/${id}`,
    REVIEW: (id: string) => `/applications/${id}/review`,
    APPROVE: (id: string) => `/applications/${id}/approve`,
    REJECT: (id: string) => `/applications/${id}/reject`
  },
  
  // Dashboard
  DASHBOARD: {
    ADMIN_STATS: '/dashboard/admin/stats',
    AGENCY_APPLICATIONS: '/applications/agency/applications',
    MINISTRY_APPLICATIONS: '/dashboard/ministry/applications',
    MISSION_OPERATOR_SUMMARY: '/dashboard/mission-operator/summary'
  },
  
  // External APIs
  EXTERNAL: {
    NADRA: '/external/nadra',
    PASSPORT: '/external/passport'
  }
}

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
} as const

export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS]
