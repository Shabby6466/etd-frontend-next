import apiClient from "./client"

export interface TempApplicationData {
    first_name: string
    last_name: string
    father_name: string
    mother_name: string
    citizen_id: string
    date_of_birth: string
    birth_country: string
    birth_city: string
    profession: string
    pakistan_address: string
    height?: string
    color_of_hair?: string
    color_of_eyes?: string
    gender: string
    transport_mode?: string
    investor?: string
    requested_by: string
    reason_for_deport?: string
    amount: number
    currency: string
    location_id: string
    image: string
    wsqFingerprint?: string
    created_by_id: number
}

export const applicationsAPI = {
    createTempApplication: async (data: TempApplicationData) => {
        const response = await apiClient.post("/applications/temp", data)
        return response.data
    },
}
