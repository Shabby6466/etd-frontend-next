import { apiClient } from "./client"

export interface PassportApiResponse {
  token_id: string | null
  first_names: string
  last_name: string
  father_first_names: string
  father_last_name: string
  spouse_birthname: string | null
  birthcity: string
  birthcountry: string
  birthdate: string
  gender: string
  qualification: string
  religion: string
  passport_no: string
  booklet_no: string
  citizen_no: string
  issue_date: string
  expiry_date: string
  active_p: string
  profession: string
  photograph: string
  old_passport_no: string
  other_passport_no: string
  other_citizenships: string
  guardian_first_names: string
  guardian_last_name: string
}

export interface PassportResponseData {
  citizen_id: string
  image_url: string
  first_name: string
  last_name: string
  father_name: string
  pakistan_city: string
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
      
      // Make request to the external passport API with authentication token
      const response = await fetch('http://10.111.101.24:9009/api/passport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoidGVzdGZpYSIsImp0aSI6ImZjZTM3ZDM4LTJlZmEtNDEzNy05YWZlLTc3YzQ5ZjIwMzYwOSIsImRlcGFydG1lbnQiOiJGSUEiLCJJZCI6IjIiLCJleHAiOjE4MDI5MTYwMDQsImlzcyI6ImRnaXAuZ292LnBrIiwiYXVkIjoiZGdpcC5nb3YucGsifQ.8k7QzIF8VCBmDsAp780jExecj3BK2fKZ62rDHbQ_CXo',
        },
        body: JSON.stringify({
          citizen_no: citizenNo
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Passport API response:', data)
      
      return data
    } catch (error) {
      console.error('Error fetching passport data:', error)
      throw error
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
