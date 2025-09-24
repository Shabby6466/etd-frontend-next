import { useState, useEffect } from 'react';

interface XmlDraftData {
  // Required fields
  citizenId: string;
  firstName: string;
  lastName: string;
  imageBase64: string;
  fatherName: string;
  motherName: string;
  gender: string;
  dateOfBirth: string;
  profession: string;
  pakistanCity: string;
  pakistanAddress: string;
  birthCountry: string;
  birthCity: string;
  departureDate: string;
  requestedBy: string;
  
  // Optional fields
  height?: string;
  colorOfEyes?: string;
  colorOfHair?: string;
  transportMode?: string;
  reasonForDeport?: string;
  amount?: string;
  currency?: string;
  investor?: string;
  securityDeposit?: string;
  
  // Biometric data
  fingerprint?: string;
  fingerprintTemplate?: string;
  biometricImage?: string;
  
  // Additional data
  xmlContent: string;
}

interface XmlDraftHook {
  fileCount: number;
  files: string[];
  isLoading: boolean;
  error: string | null;
  currentFileName: string | null;
  loadFile: (fileName: string) => Promise<XmlDraftData | null>;
  refreshFileList: () => Promise<void>;
  moveCurrentFile: () => Promise<boolean>;
}

export function useXmlDraft(): XmlDraftHook {
  const [fileCount, setFileCount] = useState(0);
  const [files, setFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  const refreshFileList = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/xml-draft');
      const data = await response.json();
      
      if (data.success) {
        setFileCount(data.fileCount);
        setFiles(data.files);
      } else {
        setError(data.message || 'Failed to load file list');
      }
    } catch (err) {
      setError('Network error while loading file list');
      console.error('Error loading XML draft files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFile = async (fileName: string): Promise<XmlDraftData | null> => {
    setIsLoading(true);
    setError(null);
    setCurrentFileName(fileName); // Track the current file being processed
    
    try {
      const response = await fetch('/api/xml-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'loadFile',
          fileName: fileName
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        setError(data.message || 'Failed to load file');
        return null;
      }
    } catch (err) {
      setError('Network error while loading file');
      console.error('Error loading XML draft file:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const moveCurrentFile = async (): Promise<boolean> => {
    if (!currentFileName) {
      setError('No current file to move');
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/xml-draft/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: currentFileName
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the file list to reflect the moved file
        await refreshFileList();
        setCurrentFileName(null);
        return true;
      } else {
        setError(data.message || 'Failed to move file');
        return false;
      }
    } catch (err) {
      setError('Network error while moving file');
      console.error('Error moving XML file:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load file list on mount
  useEffect(() => {
    refreshFileList();
  }, []);

  return {
    fileCount,
    files,
    isLoading,
    error,
    currentFileName,
    loadFile,
    refreshFileList,
    moveCurrentFile
  };
}
