import React, { useState, useEffect } from 'react';

interface BiometricCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptured: (data: {
    imageBase64: string;
    templateBase64?: string;
    imageDpi?: number;
    imageQuality?: number;
    wsqBase64?: string;
    wsqSize?: number;
    deviceModel?: string;
    serial?: string;
  }) => void;
  endpoint?: string;
}

interface CaptureResponse {
  ErrorCode: number;
  Manufacturer?: string;
  Model?: string;
  SerialNumber?: string;
  ImageWidth?: number;
  ImageHeight?: number;
  ImageDPI?: number;
  ImageQuality?: number;
  NFIQ?: number;
  ImageDataBase64?: string;
  BMPBase64?: string;
  TemplateBase64?: string;
  ISOTemplateBase64?: string;
  WSQImageSize?: number;
  WSQImage?: string;
}

const BiometricCaptureModal: React.FC<BiometricCaptureModalProps> = ({
  isOpen,
  onClose,
  onCaptured,
  endpoint = "https://localhost:8443/SGIFPCapture"
}) => {
  const endpoints = [
    "https://localhost:8443/SGIFPCapture",
    "https://127.0.0.1:8443/SGIFPCapture", 
    "http://localhost:8443/SGIFPCapture",
    "http://127.0.0.1:8443/SGIFPCapture",
    "https://localhost:8000/SGIFPCapture",
    "http://localhost:8000/SGIFPCapture"
  ];
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [details, setDetails] = useState<Partial<CaptureResponse> | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [workingEndpoint, setWorkingEndpoint] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setPreview(null);
      setDetails(null);
      setError(null);
      setConnectionStatus(null);
      setRetryCount(0);
      setWorkingEndpoint(null);
      setDeviceInfo(null);
    } else {
      testConnection();
    }
  }, [isOpen]);

  const testConnection = async () => {
    setConnectionStatus("🔍 Testing SecuGen connection...");
    setError(null);
    
    try {
      // Use the exact same approach as the working web app
      const response = await fetch(endpoint + "?Timeout=3000", {
        method: "GET",
        headers: {
          'Origin': 'http://localhost:3002',
          'Referer': 'http://localhost:3002/',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("=== CONNECTION TEST RESPONSE ===");
        console.log("Full Response:", data);
        console.log("Error Code:", data.ErrorCode);
        console.log("Device:", data.Model, "Serial:", data.SerialNumber);
        console.log("=== END CONNECTION TEST ===");
        
        // Store device info for debugging
        setDeviceInfo(data);
        
        if (data.ErrorCode === 0) {
          setConnectionStatus("✅ Service ready - Device connected");
          setWorkingEndpoint(endpoint);
          setError(null);
        } else {
          setConnectionStatus(`⚠️ Service running but device error (code ${data.ErrorCode})`);
          setWorkingEndpoint(endpoint);
          
          // Enhanced error handling for device issues
          if (data.ErrorCode === 10004) {
            setError("Device Error: Please check if the fingerprint device is properly connected and try again.");
          } else if (data.ErrorCode === 10001) {
            setError("No device found. Please connect the SecuGen fingerprint device.");
          } else if (data.ErrorCode === 10002) {
            setError("Device initialization failed. Please restart the SecuGen service.");
          } else {
            setError(`SecuGen error (code ${data.ErrorCode}). Please check device connection and drivers.`);
          }
        }
      } else {
        setConnectionStatus("❌ Service not responding");
        setError("Cannot connect to SecuGen WebAPI. Please ensure SgiBioSrv is running and accessible.");
      }
    } catch (e) {
      setConnectionStatus("❌ Cannot connect to SecuGen service");
      setError("Network error: Cannot reach the SecuGen service. Check if SgiBioSrv is running and the endpoint is correct.");
    }
  };

  const startCapture = async () => {
    setIsCapturing(true);
    setError(null);
    
    try {
      // Use the exact same approach as the working web app
      const url = new URL(endpoint);
      url.searchParams.set("FakeDetection", "0");
      url.searchParams.set("Timeout", "25000");
      url.searchParams.set("TemplateFormat", "ISO");
      url.searchParams.set("ImageWSQRate", "0.75");
      url.searchParams.set("Quality", "50");

      console.log("=== STARTING CAPTURE REQUEST ===");
      console.log("Full URL:", url.toString());
      console.log("Parameters:", {
        FakeDetection: "0",
        Timeout: "25000",
        TemplateFormat: "ISO",
        ImageWSQRate: "0.75",
        Quality: "50"
      });
      console.log("=== END CAPTURE REQUEST ===");

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          'Origin': 'http://localhost:3002',
          'Referer': 'http://localhost:3002/',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site'
        }
      });
      
      console.log("=== CAPTURE RESPONSE HEADERS ===");
      console.log("Status:", res.status);
      console.log("Headers:", Object.fromEntries(res.headers.entries()));
      console.log("Content-Length:", res.headers.get('content-length'));
      console.log("=== END RESPONSE HEADERS ===");
      
      if (!res.ok) {
        throw new Error(`Capture service HTTP ${res.status}`);
      }
      
      const responseText = await res.text();
      console.log("=== RAW RESPONSE ===");
      console.log("Response length:", responseText.length);
      console.log("First 200 chars:", responseText.substring(0, 200));
      console.log("=== END RAW RESPONSE ===");
      
      const data = JSON.parse(responseText) as CaptureResponse;
      
      console.log("=== COMPLETE CAPTURE RESPONSE ===");
      console.log("Full Response:", data);
      console.log("Error Code:", data.ErrorCode);
      console.log("Device:", data.Model, "Serial:", data.SerialNumber);
      console.log("Image Quality:", data.ImageQuality, "NFIQ:", data.NFIQ);
      console.log("=== END RESPONSE ===");
      
      if (typeof data.ErrorCode !== "number") {
        throw new Error("Invalid response from capture service");
      }
      
      if (data.ErrorCode === 54) {
        setError("⚠️ Timeout during WSQ processing. Image captured successfully.");
      } else if (data.ErrorCode !== 0) {
        throw new Error(`Capture failed (code ${data.ErrorCode})`);
      }

      const imgB64 = data.ImageDataBase64 || data.BMPBase64 || "";
      setPreview(imgB64 ? `data:image/bmp;base64,${imgB64}` : null);
      
      setDetails(data);
    } catch (e: unknown) {
      let msg = "Failed to start capture";
      if (e instanceof Error) {
        if (e.message.includes("Failed to fetch") || e.message.includes("NetworkError")) {
          msg = "Cannot connect to SecuGen WebAPI. Please ensure:\n• SgiBioSrv service is running\n• Device is connected\n• Browser allows localhost connections";
        } else if (e.message.includes("HTTP 404")) {
          msg = "SecuGen WebAPI not found. Please install SgiBioSrv from https://webapi.secugen.com/";
        } else if (e.message.includes("HTTP 500")) {
          msg = "SecuGen WebAPI error. Check device connection and drivers.";
        } else {
          msg = e.message;
        }
      }
      setError(msg);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleUse = () => {
    if (!details) return;
    const img = details.ImageDataBase64 || details.BMPBase64 || "";
    onCaptured({
      imageBase64: img,
      templateBase64: details.TemplateBase64,
      imageDpi: details.ImageDPI,
      imageQuality: details.ImageQuality,
      wsqBase64: details.WSQImage,
      wsqSize: details.WSQImageSize,
      deviceModel: details.Model,
      serial: details.SerialNumber,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Fingerprint Capture</h2>
          <button
            onClick={onClose}
            disabled={isCapturing}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col items-center">
            <div className="w-64 h-64 border-2 border-gray-300 rounded-md bg-gray-50 flex items-center justify-center overflow-hidden">
              {preview ? (
                <img src={preview} alt="Fingerprint" className="object-contain max-w-full max-h-full" />
              ) : (
                <span className="text-sm text-gray-500">No fingerprint captured</span>
              )}
            </div>
            
            <div className="mt-4 flex gap-2 flex-wrap">
              <button
                onClick={startCapture}
                disabled={isCapturing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCapturing ? "Capturing..." : details?.ErrorCode === 54 ? "Retry for WSQ" : "Capture"}
              </button>
              
              {/* Debug info */}
              {isCapturing && (
                <div className="text-xs text-blue-600 mt-2">
                  Sending capture request with all parameters...
                </div>
              )}
              
              {/* Retry connection button for device errors */}
              {(error && error.includes("Device Error")) && (
                <button
                  onClick={() => {
                    setError(null);
                    setRetryCount(prev => prev + 1);
                    testConnection();
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Retry Connection ({retryCount})
                </button>
              )}
              
              <button
                onClick={handleUse}
                disabled={!details || !preview}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Use Fingerprint
              </button>
            </div>
            
            {connectionStatus && (
              <div className={`mt-2 text-xs p-2 rounded ${
                connectionStatus.includes("✅") 
                  ? "bg-green-50 text-green-700" 
                  : connectionStatus.includes("⚠️") 
                    ? "bg-yellow-50 text-yellow-700" 
                    : "bg-red-50 text-red-700"
              }`}>
                {connectionStatus}
            {workingEndpoint && (
              <div className="mt-1 text-xs text-gray-600">
                <p>Using endpoint: {workingEndpoint}</p>
              </div>
            )}
                {connectionStatus.includes("❌") && (
                  <div className="mt-1 text-xs">
                    <p>• Make sure SgiBioSrv is running</p>
                    <p>• Try running Electron as Administrator</p>
                    <p>• Check if the service is accessible at {endpoint}</p>
                  </div>
                )}
              </div>
            )}
            
            {error && (
              <div className="mt-2 text-sm text-red-600 text-center">
                {error.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
            
            {/* Device Diagnostics */}
            {deviceInfo && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-2">🔍 Device Diagnostics:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p><strong>Error Code:</strong> {deviceInfo.ErrorCode}</p>
                      <p><strong>Model:</strong> {deviceInfo.Model || "Not detected"}</p>
                      <p><strong>Serial:</strong> {deviceInfo.SerialNumber || "Not detected"}</p>
                    </div>
                    <div>
                      <p><strong>Manufacturer:</strong> {deviceInfo.Manufacturer || "Not detected"}</p>
                      <p><strong>DPI:</strong> {deviceInfo.ImageDPI || "N/A"}</p>
                      <p><strong>Quality:</strong> {deviceInfo.ImageQuality || "N/A"}</p>
                    </div>
                  </div>
                  {deviceInfo.ErrorCode === 10004 && !deviceInfo.Model && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-red-800">
                      <p className="font-semibold">⚠️ Device Detection Issue</p>
                      <p className="text-xs">The SecuGen service is running but cannot detect the device. This is common in Electron apps.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Troubleshooting section for device errors */}
            {error && error.includes("Device Error") && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-2">🔧 Troubleshooting Steps:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Check if the SecuGen fingerprint device is properly connected via USB</li>
                    <li>Ensure the device drivers are installed and up to date</li>
                    <li>Try disconnecting and reconnecting the device</li>
                    <li>Restart the SgiBioSrv service if running</li>
                    <li>Check Windows Device Manager for any device conflicts</li>
                    <li>Try a different USB port</li>
                    <li><strong>Try running Electron as Administrator</strong></li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-700 space-y-2">
            <div>
              <p><strong>Device Info:</strong></p>
              <p className="pl-2">Model: {details?.Model ?? "-"}</p>
              <p className="pl-2">Serial: {details?.SerialNumber ?? "-"}</p>
            </div>
            
            <div>
              <p><strong>Image Quality:</strong></p>
              <p className="pl-2">DPI: {details?.ImageDPI ?? "-"}</p>
              <p className="pl-2">Quality (1-100): {details?.ImageQuality ?? "-"}</p>
              <p className="pl-2">NFIQ (1-5): {details?.NFIQ ?? "-"}</p>
            </div>
            
            <div>
              <p><strong>Capture Data:</strong></p>
              <p className="pl-2">Image Size: {details?.ImageWidth}x{details?.ImageHeight}</p>
              <p className="pl-2">Template: {details?.TemplateBase64 ? "Available" : "Not available"}</p>
              <p className="pl-2">WSQ: {details?.WSQImage ? `${details.WSQImageSize} bytes` : "Not available"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricCaptureModal;
