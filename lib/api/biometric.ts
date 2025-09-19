import apiClient from "./client"
import { User } from "../types"

export interface BiometricData {
  wsqFingerprint: string // Base64 encoded WSQ fingerprint data
  fingerprintTemplateBase64: string // ISO template for matching
  fingerprintDeviceModel?: string // Device used for capture
  fingerprintDeviceSerial?: string // Device serial number
  imageDpi?: number
  imageQuality?: number
}

export interface BiometricRegistrationRequest {
  userId: string
  biometricData: BiometricData
}

export interface BiometricVerificationRequest {
  userId: string
  fingerprintTemplateBase64: string
}

export interface BiometricVerificationResponse {
  isMatch: boolean
  matchScore: number
  threshold: number
}

export interface FirstLoginCheckResponse {
  isFirstLogin: boolean
  isBiometricRequired: boolean
  isBiometricSetup: boolean
}

export const biometricAPI = {
  // Register biometric data for a user (first time setup)
  registerBiometric: async (data: BiometricRegistrationRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post("/biometric/register", data)
    return response.data
  },

  // Verify biometric data for a user (subsequent logins)
  verifyBiometric: async (data: BiometricVerificationRequest): Promise<BiometricVerificationResponse> => {
    const response = await apiClient.post("/biometric/verify", data)
    return response.data
  },

  // Check if user requires biometric setup
  checkFirstLogin: async (userId: string): Promise<FirstLoginCheckResponse> => {
    const response = await apiClient.get(`/biometric/check-first-login/${userId}`)
    return response.data
  },

  // Mark first login as completed
  completeFirstLogin: async (userId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/biometric/complete-first-login/${userId}`)
    return response.data
  },

  // Get user biometric status
  getBiometricStatus: async (userId: string): Promise<{
    isBiometricSetup: boolean
    isBiometricRequired: boolean
    fingerprintCapturedAt?: string
  }> => {
    const response = await apiClient.get(`/biometric/status/${userId}`)
    return response.data
  },

  // Update user biometric data (re-enrollment)
  updateBiometric: async (data: BiometricRegistrationRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put("/biometric/update", data)
    return response.data
  },

  // Remove biometric data (admin function)
  removeBiometric: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/biometric/remove/${userId}`)
    return response.data
  }
}

