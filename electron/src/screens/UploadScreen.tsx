import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Upload, CheckCircle, AlertCircle } from '../components/Icons';
import { XMLStorage } from '../utils/xmlStorage';

interface UploadScreenProps {
  onBack: () => void;
  user: any; // Using any to avoid circular dependency issues, but ideally should be User
}

interface FileStatus {
  filename: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message?: string;
}

const UploadScreen: React.FC<UploadScreenProps> = ({ onBack, user }) => {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const filenames = await XMLStorage.getSavedApplications();
      setFiles(filenames.map(name => ({ filename: name, status: 'pending' })));
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseXML = (xmlContent: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    
    const getText = (tag: string) => {
      const el = xmlDoc.getElementsByTagName(tag)[0];
      return el ? el.textContent : "";
    };

    return {
      first_name: getText("first_name"),
      last_name: getText("last_name"),
      father_name: getText("father_name"),
      mother_name: getText("mother_name"),
      citizen_id: getText("citizen_id"),
      date_of_birth: getText("date_of_birth"),
      birth_country: getText("birth_country"),
      birth_city: getText("birth_city"),
      profession: getText("profession"),
      pakistan_address: getText("pakistan_address"),
      height: getText("height"),
      color_of_hair: getText("color_of_hair"),
      color_of_eyes: getText("color_of_eyes"),
      gender: getText("gender"),
      transport_mode: getText("transport_mode"),
      investor: getText("investor"),
      requested_by: getText("requested_by"),
      reason_for_deport: getText("reason_for_deport"),
      amount: Number(getText("amount")) || 0,
      currency: getText("currency"),
      location_id: user?.locationId || "2010", // Use user's locationId or default
      image: getText("image_base64") // Note: XML tag is image_base64, API expects image
    };
  };

  const handleUploadAll = async () => {
    setIsUploading(true);
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    setUploadProgress({ current: 0, total: pendingFiles.length });

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.filename === file.filename ? { ...f, status: 'uploading' } : f
      ));

      try {
        // 1. Read file content
        const xmlContent = await XMLStorage.readApplication(file.filename);
        
        // 2. Parse XML
        const payload = parseXML(xmlContent);
        
        // 3. Upload to API
        const response = await fetch('http://localhost:3837/v1/api/applications/temp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        // 4. Move to complete folder
        if (window.electronAPI && window.electronAPI.moveApplicationToComplete) {
          const moveResult = await window.electronAPI.moveApplicationToComplete(file.filename);
          if (!moveResult.success) {
            throw new Error(`Move Error: ${moveResult.error}`);
          }
        }

        // Update status to success
        setFiles(prev => prev.map(f => 
          f.filename === file.filename ? { ...f, status: 'success', message: 'Uploaded successfully' } : f
        ));

      } catch (error) {
        console.error(`Error uploading ${file.filename}:`, error);
        setFiles(prev => prev.map(f => 
          f.filename === file.filename ? { ...f, status: 'error', message: error instanceof Error ? error.message : 'Unknown error' } : f
        ));
      }

      setUploadProgress(prev => ({ ...prev, current: i + 1 }));
    }

    setIsUploading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Upload Pending Applications</h1>
              <p className="text-gray-600">Sync your offline applications with the server</p>
            </div>
            <button
              onClick={onBack}
              disabled={isUploading}
              className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </button>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Pending Uploads</div>
            <div className="text-2xl font-bold text-blue-600">
              {files.filter(f => f.status === 'pending').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Successfully Uploaded</div>
            <div className="text-2xl font-bold text-green-600">
              {files.filter(f => f.status === 'success').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center justify-center">
            <button
              onClick={handleUploadAll}
              disabled={isUploading || files.filter(f => f.status === 'pending' || f.status === 'error').length === 0}
              className="w-full h-full flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="animate-spin mr-2 h-5 w-5" />
                  Uploading ({uploadProgress.current}/{uploadProgress.total})
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload All Pending
                </>
              )}
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">File Queue</h3>
            <button 
              onClick={loadFiles} 
              disabled={isUploading}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {files.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No pending applications found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {files.map((file) => (
                <div key={file.filename} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-4 ${
                      file.status === 'success' ? 'bg-green-100 text-green-600' :
                      file.status === 'error' ? 'bg-red-100 text-red-600' :
                      file.status === 'uploading' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {file.status === 'success' ? <CheckCircle className="h-5 w-5" /> :
                       file.status === 'error' ? <AlertCircle className="h-5 w-5" /> :
                       file.status === 'uploading' ? <RefreshCw className="h-5 w-5 animate-spin" /> :
                       <Upload className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{file.filename}</div>
                      {file.message && (
                        <div className={`text-sm ${
                          file.status === 'error' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {file.message}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {file.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadScreen;
