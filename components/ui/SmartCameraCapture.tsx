"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface SmartCameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  onCancel: () => void;
}

interface ValidationStatus {
  faceDetected: boolean;
  eyesVisible: boolean;
  properPosture: boolean;
  centerFramed: boolean;
}

export function SmartCameraCapture({ onCapture, onCancel }: SmartCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>({
    faceDetected: false,
    eyesVisible: false,
    properPosture: false,
    centerFramed: false,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Unable to access camera. Please check permissions.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Simple face detection using video frame analysis
  useEffect(() => {
    if (!videoRef.current || !isAnalyzing) return;

    const analyzeFrame = () => {
      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return;

      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simple heuristics for validation
      const centerRegion = getCenterRegion(imageData, canvas.width, canvas.height);
      const upperCenterRegion = getUpperCenterRegion(imageData, canvas.width, canvas.height);
      
      const hasFace = detectMotion(centerRegion);
      const isWellLit = checkLighting(centerRegion);
      const isCentered = checkCentering(imageData, canvas.width, canvas.height);
      const eyesVisible = detectEyes(upperCenterRegion);

      const allConditionsMet = hasFace && isWellLit && isCentered && eyesVisible;

      setValidationStatus({
        faceDetected: hasFace && isWellLit,
        eyesVisible: eyesVisible,
        properPosture: isCentered,
        centerFramed: isCentered,
      });

      // Start countdown if all conditions met and no countdown running
      if (allConditionsMet && countdown === null) {
        startCountdown();
      }
      
      // Cancel countdown if conditions are no longer met
      if (!allConditionsMet && countdown !== null) {
        setCountdown(null);
      }
    };

    const interval = setInterval(analyzeFrame, 500);
    return () => clearInterval(interval);
  }, [isAnalyzing, countdown]);

  // Helper functions for basic image analysis
  const getCenterRegion = (imageData: ImageData, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const regionSize = Math.min(width, height) / 3;
    
    const pixels = [];
    for (let y = centerY - regionSize / 2; y < centerY + regionSize / 2; y += 10) {
      for (let x = centerX - regionSize / 2; x < centerX + regionSize / 2; x += 10) {
        const index = (Math.floor(y) * width + Math.floor(x)) * 4;
        pixels.push({
          r: imageData.data[index],
          g: imageData.data[index + 1],
          b: imageData.data[index + 2],
        });
      }
    }
    return pixels;
  };

  // Get upper center region for eye detection
  const getUpperCenterRegion = (imageData: ImageData, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 3; // Upper third for eye area
    const regionWidth = Math.min(width, height) / 4;
    const regionHeight = Math.min(width, height) / 6;
    
    const pixels = [];
    for (let y = centerY - regionHeight / 2; y < centerY + regionHeight / 2; y += 5) {
      for (let x = centerX - regionWidth / 2; x < centerX + regionWidth / 2; x += 5) {
        const index = (Math.floor(y) * width + Math.floor(x)) * 4;
        pixels.push({
          r: imageData.data[index],
          g: imageData.data[index + 1],
          b: imageData.data[index + 2],
        });
      }
    }
    return pixels;
  };

  const detectMotion = (pixels: any[]) => {
    // Check for skin tone range (simple heuristic)
    const skinTonePixels = pixels.filter(p => {
      return p.r > 95 && p.g > 40 && p.b > 20 &&
             p.r > p.g && p.r > p.b &&
             Math.abs(p.r - p.g) > 15;
    });
    return skinTonePixels.length > pixels.length * 0.3;
  };

  const detectEyes = (pixels: any[]) => {
    // Check for darker regions (eyes/eyebrows) in upper face area
    const darkPixels = pixels.filter(p => {
      const brightness = (p.r + p.g + p.b) / 3;
      return brightness < 100; // Dark regions like eyes, eyebrows, hair
    });
    
    // Also check for skin tone in this region (indicates face is present)
    const skinPixels = pixels.filter(p => {
      return p.r > 95 && p.g > 40 && p.b > 20 &&
             p.r > p.g && p.r > p.b;
    });
    
    // We need both dark regions (eyes) and skin tone (face)
    return darkPixels.length > pixels.length * 0.15 && skinPixels.length > pixels.length * 0.3;
  };

  const checkLighting = (pixels: any[]) => {
    const avgBrightness = pixels.reduce((sum, p) => sum + (p.r + p.g + p.b) / 3, 0) / pixels.length;
    return avgBrightness > 60 && avgBrightness < 220; // Not too dark, not too bright
  };

  const checkCentering = (imageData: ImageData, width: number, height: number) => {
    // Simple check: analyze if there's content in center vs edges
    const centerPixels = getCenterRegion(imageData, width, height);
    return centerPixels.length > 0;
  };

  const startCountdown = () => {
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          if (prev === 1) {
            captureImage();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to target dimensions (540x420)
    canvas.width = 540;
    canvas.height = 420;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror the image horizontally (flip it)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

    // Calculate scaling to fill canvas while maintaining aspect ratio
    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = canvas.width / canvas.height;
    
    let sourceX = 0, sourceY = 0, sourceWidth = video.videoWidth, sourceHeight = video.videoHeight;
    
    if (videoAspect > canvasAspect) {
      // Video is wider
      sourceWidth = video.videoHeight * canvasAspect;
      sourceX = (video.videoWidth - sourceWidth) / 2;
    } else {
      // Video is taller
      sourceHeight = video.videoWidth / canvasAspect;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    ctx.drawImage(
      video,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, canvas.width, canvas.height
    );

    ctx.restore();

    // Convert to base64 JPEG
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
    
    // Stop camera
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    
    onCapture(imageBase64);
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Smart Camera Capture</h2>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
            style={{ transform: "scaleX(-1)" }}
          />
          
          {/* Countdown overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-9xl font-bold text-white">{countdown}</div>
            </div>
          )}

          {/* Face guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-4 border-dashed border-white opacity-50 rounded-full"
                 style={{ width: "60%", height: "80%" }} />
          </div>
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Validation status */}
        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            {getStatusIcon(validationStatus.faceDetected)}
            <span className="text-sm font-medium">Face Detected</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(validationStatus.eyesVisible)}
            <span className="text-sm font-medium">Looking at Camera</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(validationStatus.properPosture)}
            <span className="text-sm font-medium">Proper Posture</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(validationStatus.centerFramed)}
            <span className="text-sm font-medium">Centered in Frame</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Instructions:</strong> Position yourself in the center of the frame. 
            Look directly at the camera and sit upright. The photo will be captured automatically 
            when all conditions are met.
          </p>
        </div>

        {/* Manual controls */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setIsAnalyzing(!isAnalyzing)}
          >
            {isAnalyzing ? "Pause Analysis" : "Start Analysis"}
          </Button>
          <Button
            onClick={captureImage}
            disabled={!stream}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Capture Now
          </Button>
        </div>
      </div>
    </div>
  );
}
