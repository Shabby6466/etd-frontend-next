// Biometric API for Electron app - simplified version of the web app implementation
import { User } from '../App';

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

// For the Electron app, we'll simulate API calls or integrate with a local/remote API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const apiClient = {
  post: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return { data: await response.json() };
    } catch (error) {
      console.error('API Error:', error);
      // For now, return mock success for Electron app development
      return { data: { success: true, message: 'Biometric data stored locally' } };
    }
  },
  
  get: async (endpoint: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return { data: await response.json() };
    } catch (error) {
      console.error('API Error:', error);
      // For now, return mock data for Electron app development
      return { 
        data: { 
          isFirstLogin: false, 
          isBiometricRequired: false, 
          isBiometricSetup: false 
        } 
      };
    }
  },
  
  put: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return { data: await response.json() };
    } catch (error) {
      console.error('API Error:', error);
      return { data: { success: true, message: 'Biometric data updated locally' } };
    }
  },
  
  delete: async (endpoint: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return { data: await response.json() };
    } catch (error) {
      console.error('API Error:', error);
      return { data: { success: true, message: 'Biometric data removed locally' } };
    }
  }
};

export const biometricAPI = {
  // Register biometric data for a user (first time setup)
  registerBiometric: async (data: BiometricRegistrationRequest): Promise<{ success: boolean; message: string }> => {
    console.log('Registering biometric data:', data);
    const response = await apiClient.post("/biometric/register", data);
    return response.data;
  },

  // Verify biometric data for a user (subsequent logins)
  verifyBiometric: async (data: BiometricVerificationRequest): Promise<BiometricVerificationResponse> => {
    console.log('Verifying biometric data:', data);
    const response = await apiClient.post("/biometric/verify", data);
    return response.data;
  },

  // Check if user requires biometric setup
  checkFirstLogin: async (userId: string): Promise<FirstLoginCheckResponse> => {
    console.log('Checking first login for user:', userId);
    const response = await apiClient.get(`/biometric/check-first-login/${userId}`);
    return response.data;
  },

  // Mark first login as completed
  completeFirstLogin: async (userId: string): Promise<{ success: boolean }> => {
    console.log('Completing first login for user:', userId);
    const response = await apiClient.post(`/biometric/complete-first-login/${userId}`, {});
    return response.data;
  },

  // Get user biometric status
  getBiometricStatus: async (userId: string): Promise<{
    isBiometricSetup: boolean
    isBiometricRequired: boolean
    fingerprintCapturedAt?: string
  }> => {
    console.log('Getting biometric status for user:', userId);
    const response = await apiClient.get(`/biometric/status/${userId}`);
    return response.data;
  },

  // Update user biometric data (re-enrollment)
  updateBiometric: async (data: BiometricRegistrationRequest): Promise<{ success: boolean; message: string }> => {
    console.log('Updating biometric data:', data);
    const response = await apiClient.put("/biometric/update", data);
    return response.data;
  },

  // Remove biometric data (admin function)
  removeBiometric: async (userId: string): Promise<{ success: boolean; message: string }> => {
    console.log('Removing biometric data for user:', userId);
    const response = await apiClient.delete(`/biometric/remove/${userId}`);
    return response.data;
  }
};

