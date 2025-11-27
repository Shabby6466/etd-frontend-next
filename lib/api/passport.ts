import { apiClient } from "./client"

export interface PassportApiResponse {
  citizen_no: string
  first_names: string
  last_name: string
  father_first_names: string
  father_last_name: string
  gender: string
  birthdate: string
  birthcountry: string
  birthcity: string
  pakistan_address: string
  profession: string
  photograph: string
  religion: string
  response_status: string
  old_passport_no: string
  issue_date: string
  passport_no: string
  expiry_date: string
  api_response_date: string
  raw_response: any
}

export interface PassportResponseData {
  citizen_id: string
  tracking_id?: string
  volume_tracking_id?: string
  image_url: string
  first_name: string
  last_name: string
  father_name: string
  gender: string
  date_of_birth: string
  birth_country: string
  birth_city: string
  profession: string
  pakistan_address: string
  response_status: string
  api_response_date: string
  raw_response: any
}

export interface PassportVolumeTrackingResponse {
  id: number
  createdAt: string
  updatedAt: string
  citizen_id: string
  volume_tracking_id: string
  image_url: string
  first_name: string
  last_name: string
  father_name: string
  gender: string
  date_of_birth: string
  birth_country: string
  birth_city: string
  profession: string
  pakistan_address: string
  response_status: string
  api_response_date: string
  raw_response: any
}

export const passportAPI = {
  getCitizenData: async (citizenNo: string): Promise<PassportApiResponse> => {
    try {
      console.log('Fetching passport data for citizen ID:', citizenNo)
      
      const response = await apiClient.post('/passport/citizen-data', {
        citizen_no: citizenNo
      })

      console.log('Passport API response:', response.data)
      
      return response.data.data
    } catch (error) {
      console.error('Error fetching passport data:', error)
      throw error
    }
  },

  // Get passport response by volume tracking ID
  getPassportResponseByVolumeTracking: async (volumeTrackingId: string): Promise<PassportVolumeTrackingResponse | null> => {
    try {
      console.log('Fetching passport response for volume tracking ID:', volumeTrackingId)
      
      const response = await apiClient.get(`/applications/passport-responses/volume-tracking/${volumeTrackingId}`)
      console.log('Passport volume tracking response:', response.data)
      
      return response.data
    } catch (error) {
      console.error('Error fetching passport response by volume tracking ID:', error)
      return null
    }
  },

  // Store passport response data in the database
  storePassportResponse: async (data: PassportResponseData): Promise<any> => {
    try {
      console.log('Storing passport response data:', data)
      
      const response = await apiClient.post('/applications/passport-response', data)
      console.log('Passport response stored successfully:', response.data)
      
      return response.data
    } catch (error) {
      console.error('Error storing passport response:', error)
      throw error
    }
  }
}
