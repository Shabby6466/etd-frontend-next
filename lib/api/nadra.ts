import { apiClient } from "./client";


// 1:1 API Types
export interface Nadra1to1Request {
  citizenNumber: string;
  fingerTemplate: string;
  photograph: string;
}

export interface Nadra1to1ApiResponse {
  citizenData: NadraCitizenData;
  modalityResult: ModalityResult;
  sessionId: string;
  citizenNumber: string;
  fingerIndex: string;
  responseStatus: {
    code: string;
    message: string;
  };
}



export interface NadraCitizenData {
  name: string;
  fatherName: string;
  fatherNameEnglish: string;
  presentAddress: string;
  permanentAddress: string;
  dateOfBirth: string;
  gender: string;
  motherName: string;
  motherNameEnglish: string;
  photograph: string;
}

export interface ModalityResult {
  facialResult: string;
  fingerprintResult: string;
}

export interface NadraMatch {
  citizenData: NadraCitizenData;
  modalityResult: ModalityResult;
  sessionId: string;
  citizenNumber: string;
  fingerIndex: string | null;
  responseStatus: {
    code: string;
    message: string;
  };
}

export interface IdentifyResponse {
  transactionId: string
  status: string
  requestMetadata?: any
}

export interface ResultResponse {
  responseStatus: {
    code: string;
    message: string
  }
  matches: NadraMatch[]
}

export const nadraAPI = {
  getCitizenData: async (
    input: Nadra1to1Request
  ): Promise<Nadra1to1ApiResponse> => {
    try {
      console.log(`citzen number nadra input --> ${input.citizenNumber}`)
      const response = await apiClient.post(`/nadra/1to1`, {
        citizenNumber: input.citizenNumber,
        fingerTemplate: input.fingerTemplate,
        photograph: input.photograph,
      });
      console.log("NADRA 1TO1 API response:", response.data);
      return response.data;
    } catch (err) {
      console.error("Error fetching nadra data:", err);
      throw err;
    }
  },

  identify1toN: async (payload: {
    referenceNumber: string;
    photograph: string;
    fingerprintMap: Record<string, string>;
  }): Promise<IdentifyResponse> => {
    try {
      const response = await apiClient.post(`/nadra/1toNIdentify`, payload);
      return response.data;
    } catch (err) {
      console.error("Error in nadra 1:N identify:", err);
      throw err;
    }
  },

  getIdentificationResult: async (transactionId: string): Promise<ResultResponse> => {
    try {
      const response = await apiClient.post(`/nadra/1toNGetResult`, { transactionId });
      return response.data;
    } catch (err) {
      console.error("Error getting nadra 1:N result:", err);
      throw err;
    }
  }
};

