import { apiClient } from "./client";

class CitizenData {
  name: string;

  fatherName: string;

  fatherNameEnglish: string;

  dateOfBirth: string;

  gender: string;

  motherName: string;

  motherNameEnglish: string;

  photograph: string;
}

class ModalityResult {
  facialResult: string;

  fingerprintResilt: string;
}

class ResponseStatus {
  code: string;

  message: string;
}

export class Nadra1to1ApiResponse {
  citizenData: CitizenData;

  modalityResult: ModalityResult;

  sessionId: string;

  citizenNumber: string;

  fingerIndex: string;

  responseStatus: ResponseStatus;
}

export class Nadra1to1Request {
  citizenNumber: string;
  fingerTemplate: string;
  photograph: string;
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
};
