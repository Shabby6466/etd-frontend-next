// SecuGen Device Configuration
// Based on your working Next.js app device information

export interface SecuGenDeviceConfig {
  deviceName: string;
  serialNumber: string;
  model: string;
}

// Your working device configuration from Next.js logs
export const WORKING_DEVICE: SecuGenDeviceConfig = {
  deviceName: "HU20",
  serialNumber: "H58220311290", 
  model: "HU20"
};

// Helper function to add device targeting to SecuGen requests
export const addDeviceTargeting = (baseUrl: string, device: SecuGenDeviceConfig = WORKING_DEVICE): string => {
  const url = new URL(baseUrl);
  url.searchParams.set("DeviceName", device.deviceName);
  url.searchParams.set("SerialNumber", device.serialNumber);
  return url.toString();
};

// Helper function to add device targeting to request parameters
export const addDeviceParams = (params: Record<string, string>, device: SecuGenDeviceConfig = WORKING_DEVICE): Record<string, string> => {
  return {
    ...params,
    DeviceName: device.deviceName,
    SerialNumber: device.serialNumber
  };
};

// Device validation helper
export const validateDeviceResponse = (response: any): boolean => {
  return response && 
         response.ErrorCode === 0 && 
         response.Model === WORKING_DEVICE.model &&
         response.SerialNumber === WORKING_DEVICE.serialNumber;
};

// Console logging helper for device debugging
export const logDeviceInfo = (response: any, mode: 'desktop' | 'browser' = 'desktop') => {
  console.log(`=== ${mode.toUpperCase()} DEVICE RESPONSE ===`);
  console.log("Full Response:", response);
  console.log("Error Code:", response.ErrorCode);
  console.log("Device:", response.Model, "Serial:", response.SerialNumber);
  console.log("Image Quality:", response.ImageQuality, "NFIQ:", response.NFIQ);
  console.log(`=== END ${mode.toUpperCase()} RESPONSE ===`);
};
