// Electron-compatible XML storage using IPC

export interface ApplicationData {
  citizen_id: string;
  first_name: string;
  last_name: string;
  father_name: string;
  mother_name: string;
  gender: string;
  date_of_birth: string;
  profession: string;
  pakistan_city: string;
  pakistan_address: string;
  birth_country: string;
  birth_city: string;
  departure_date: string;
  requested_by: string;
  height?: string;
  color_of_eyes?: string;
  color_of_hair?: string;
  transport_mode?: string;
  investor?: string;
  reason_for_deport?: string;
  amount?: number;
  currency?: string;
  image: string;
  fingerprint?: string;
  fingerprintTemplate?: string;
  fingerprintDevice?: string;
  wsqFingerprint?: string;
  fingerprintDeviceSerial?: string;
  fingerprintDpi?: number;
  fingerprintQuality?: number;
  biometricData?: {
    wsqFingerprint: string;
    fingerprintTemplateBase64: string;
    fingerprintDeviceModel?: string;
    fingerprintDeviceSerial?: string;
    imageDpi?: number;
    imageQuality?: number;
  } | null;
}

export class XMLStorage {
  /**
   * Save application data to XML file using Electron IPC
   */
  static async saveApplication(data: ApplicationData): Promise<string> {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const result = await window.electronAPI.invoke('xml-storage-save-application', data);
      
      if (result.success) {
        console.log(`Application saved to: ${result.filepath}`);
        return result.filepath;
      } else {
        throw new Error(result.error || 'Failed to save application');
      }
    } catch (error) {
      console.error('Error saving application:', error);
      throw new Error(`Failed to save application: ${error}`);
    }
  }
  
  /**
   * Get list of saved applications using Electron IPC
   */
  static async getSavedApplications(): Promise<string[]> {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const result = await window.electronAPI.invoke('xml-storage-get-applications');
      
      if (result.success) {
        return result.applications;
      } else {
        throw new Error(result.error || 'Failed to get applications');
      }
    } catch (error) {
      console.error('Error getting saved applications:', error);
      return [];
    }
  }
  
  /**
   * Read application data from XML file using Electron IPC
   */
  static async readApplication(filename: string): Promise<string> {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const result = await window.electronAPI.invoke('xml-storage-read-application', filename);
      
      if (result.success) {
        return result.content;
      } else {
        throw new Error(result.error || 'Failed to read application');
      }
    } catch (error) {
      console.error('Error reading application:', error);
      throw new Error(`Failed to read application: ${error}`);
    }
  }
  
  /**
   * Get storage directory path (returns placeholder since we can't access it directly)
   */
  static getStorageDirectory(): string {
    return 'C:\\Users\\Default\\AppData\\Local\\xml_draft';
  }
}
