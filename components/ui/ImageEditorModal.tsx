"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { validateImageFile, getImageDimensions } from "@/lib/utils/image-processing";
import { showNotification } from "@/lib/utils/notifications";
import { X, Check, Move } from "lucide-react";

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (base64: string) => void;
  file: File | null;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageEditorModal({ isOpen, onClose, onSave, file }: ImageEditorModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [processedImage, setProcessedImage] = useState<{
    base64: string;
    sizeKB: number;
    width: number;
    height: number;
  } | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 540, height: 420 });
  const [imageScale, setImageScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 });
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const TARGET_WIDTH = 540;
  const TARGET_HEIGHT = 420;
  const MAX_SIZE_KB = 18;

  useEffect(() => {
    if (isOpen && file) {
      loadImage();
    }
  }, [isOpen, file]);

  const loadImage = async () => {
    if (!file) return;

    try {
      // Validate file
      const validationError = validateImageFile(file);
      if (validationError) {
        showNotification.error(validationError);
        onClose();
        return;
      }

      // Get original dimensions
      const dimensions = await getImageDimensions(file);
      setOriginalDimensions(dimensions);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } catch (error) {
      showNotification.error("Failed to load image");
      onClose();
    }
  };

  const handleImageLoad = () => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const container = containerRef.current;
    
    // Calculate scale to fit image in container while maintaining aspect ratio
    const containerWidth = container.clientWidth;
    const containerHeight = 400; // Fixed height for preview
    
    const scaleX = containerWidth / img.naturalWidth;
    const scaleY = containerHeight / img.naturalHeight;
    const scale = Math.min(scaleX, scaleY);
    
    setImageScale(scale);
    
    // Calculate display size
    const displayWidth = img.naturalWidth * scale;
    const displayHeight = img.naturalHeight * scale;
    setImageDisplaySize({ width: displayWidth, height: displayHeight });
    
    // Center the image
    const offsetX = (containerWidth - displayWidth) / 2;
    const offsetY = (containerHeight - displayHeight) / 2;
    
    setImageOffset({ x: offsetX, y: offsetY });
    
    // Initialize crop area to center of image with target aspect ratio
    const cropAspectRatio = TARGET_WIDTH / TARGET_HEIGHT;
    let cropWidth, cropHeight;
    
    if (displayWidth / displayHeight > cropAspectRatio) {
      // Image is wider than target ratio
      cropHeight = displayHeight;
      cropWidth = displayHeight * cropAspectRatio;
    } else {
      // Image is taller than target ratio
      cropWidth = displayWidth;
      cropHeight = displayWidth / cropAspectRatio;
    }
    
    const cropX = offsetX + (displayWidth - cropWidth) / 2;
    const cropY = offsetY + (displayHeight - cropHeight) / 2;
    
    setCropArea({
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight
    });
    
    setImageLoaded(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageLoaded) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is inside crop area
    if (x >= cropArea.x && x <= cropArea.x + cropArea.width &&
        y >= cropArea.y && y <= cropArea.y + cropArea.height) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !imageLoaded || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newX = x - dragStart.x;
    const newY = y - dragStart.y;
    
    // Constrain crop area to image bounds
    const maxX = imageOffset.x + imageDisplaySize.width - cropArea.width;
    const maxY = imageOffset.y + imageDisplaySize.height - cropArea.height;
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(imageOffset.x, Math.min(maxX, newX)),
      y: Math.max(imageOffset.y, Math.min(maxY, newY))
    }));
  }, [isDragging, imageLoaded, dragStart, imageOffset, imageDisplaySize, cropArea.width, cropArea.height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const processImageFile = async () => {
    if (!file || !imageRef.current) return;

    setIsProcessing(true);
    try {
      // Create a canvas to crop the image
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      const img = imageRef.current;
      
      // Calculate the actual crop coordinates in the original image
      const scaleX = img.naturalWidth / imageDisplaySize.width;
      const scaleY = img.naturalHeight / imageDisplaySize.height;
      
      const cropX = (cropArea.x - imageOffset.x) * scaleX;
      const cropY = (cropArea.y - imageOffset.y) * scaleY;
      const cropWidth = cropArea.width * scaleX;
      const cropHeight = cropArea.height * scaleY;

      // Set canvas to target size
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;

      // Fill with white background first
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      // Draw the cropped portion to fill the entire canvas
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, TARGET_WIDTH, TARGET_HEIGHT
      );

      // Convert to base64 with compression
      let quality = 0.8;
      let base64 = canvas.toDataURL("image/jpeg", quality);
      
      // Remove data URL prefix to get pure base64
      const base64Data = base64.split(",")[1];
      
      // Calculate size in KB
      const sizeKB = Math.ceil((base64Data.length * 3) / 4) / 1024;

      // If still too large, compress further
      if (sizeKB > MAX_SIZE_KB && quality > 0.1) {
        quality -= 0.1;
        base64 = canvas.toDataURL("image/jpeg", quality);
        const newBase64Data = base64.split(",")[1];
        const newSizeKB = Math.ceil((newBase64Data.length * 3) / 4) / 1024;
        
        setProcessedImage({
          base64: newBase64Data,
          sizeKB: newSizeKB,
          width: TARGET_WIDTH,
          height: TARGET_HEIGHT
        });
      } else {
        setProcessedImage({
          base64: base64Data,
          sizeKB,
          width: TARGET_WIDTH,
          height: TARGET_HEIGHT
        });
      }
      
      if (sizeKB > MAX_SIZE_KB) {
        showNotification.warning(`Image size is ${sizeKB.toFixed(1)}KB (max: ${MAX_SIZE_KB}KB). Quality has been reduced to meet requirements.`);
      } else {
        showNotification.success(`Image processed successfully! Size: ${sizeKB.toFixed(1)}KB`);
      }
    } catch (error) {
      showNotification.error("Failed to process image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (processedImage) {
      onSave(processedImage.base64);
      onClose();
    }
  };

  const handleClose = () => {
    setPreviewUrl("");
    setProcessedImage(null);
    setOriginalDimensions(null);
    setImageLoaded(false);
    setIsDragging(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Image Editor</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Requirements Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Image Requirements:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Dimensions: {TARGET_WIDTH} × {TARGET_HEIGHT} pixels</li>
              <li>• Maximum size: {MAX_SIZE_KB}KB</li>
              <li>• Format: JPEG</li>
              <li>• Drag the crop box to select the area you want to crop</li>
            </ul>
          </div>

          {/* Original Image Info */}
          {originalDimensions && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Original Image:</h3>
              <p className="text-sm text-gray-700">
                Dimensions: {originalDimensions.width} × {originalDimensions.height} pixels
              </p>
            </div>
          )}

          {/* Image Preview with Crop Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Preview with Crop */}
            <div>
              <h3 className="font-semibold mb-3">Crop Image (Drag the box to adjust)</h3>
              <div 
                ref={containerRef}
                className="relative border rounded-lg overflow-hidden bg-gray-100"
                style={{ height: '400px' }}
                onMouseDown={handleMouseDown}
              >
                {previewUrl && (
                  <img
                    ref={imageRef}
                    src={previewUrl}
                    alt="Original"
                    className="absolute"
                    style={{
                      width: `${imageDisplaySize.width}px`,
                      height: `${imageDisplaySize.height}px`,
                      left: `${imageOffset.x}px`,
                      top: `${imageOffset.y}px`,
                      cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                    onLoad={handleImageLoad}
                  />
                )}
                
                {/* Crop Overlay */}
                {imageLoaded && (
                  <>
                    {/* Semi-transparent overlay */}
                    <div 
                      className="absolute inset-0 bg-black bg-opacity-50"
                      style={{ pointerEvents: 'none' }}
                    />
                    
                    {/* Crop area (transparent) */}
                    <div
                      className="absolute border-2 border-white border-dashed"
                      style={{
                        left: `${cropArea.x}px`,
                        top: `${cropArea.y}px`,
                        width: `${cropArea.width}px`,
                        height: `${cropArea.height}px`,
                        backgroundColor: 'transparent',
                        pointerEvents: 'none'
                      }}
                    />
                    
                    {/* Crop area outline */}
                    <div
                      className="absolute border-2 border-blue-500"
                      style={{
                        left: `${cropArea.x}px`,
                        top: `${cropArea.y}px`,
                        width: `${cropArea.width}px`,
                        height: `${cropArea.height}px`,
                        backgroundColor: 'transparent',
                        pointerEvents: 'none'
                      }}
                    />
                    
                    {/* Corner handles */}
                    {['nw', 'ne', 'sw', 'se'].map((corner) => (
                      <div
                        key={corner}
                        className="absolute w-3 h-3 bg-blue-500 border border-white"
                        style={{
                          left: `${cropArea.x + (corner.includes('e') ? cropArea.width : 0) - 6}px`,
                          top: `${cropArea.y + (corner.includes('s') ? cropArea.height : 0) - 6}px`,
                          pointerEvents: 'none'
                        }}
                      />
                    ))}
                  </>
                )}
                
                {/* Instructions */}
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-500">Loading image...</p>
                  </div>
                )}
              </div>
              
              {/* Crop Controls */}
              <div className="mt-3 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <Move className="inline w-4 h-4 mr-1" />
                  Drag to move crop area
                </div>
                <Button
                  onClick={processImageFile}
                  disabled={!imageLoaded || isProcessing}
                  size="sm"
                >
                  {isProcessing ? "Processing..." : "Process Crop"}
                </Button>
              </div>
            </div>

            {/* Processed Preview */}
            <div>
              <h3 className="font-semibold mb-3">Processed Image ({TARGET_WIDTH}×{TARGET_HEIGHT})</h3>
              {processedImage ? (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={`data:image/jpeg;base64,${processedImage.base64}`}
                    alt="Processed"
                    className="w-full h-auto max-h-80 object-contain"
                  />
                  <div className="p-3 bg-gray-50">
                    <p className="text-sm text-gray-700">
                      Size: {processedImage.sizeKB.toFixed(1)}KB
                      {processedImage.sizeKB > MAX_SIZE_KB && (
                        <span className="text-red-600 ml-2">(Exceeds limit)</span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg h-80 flex items-center justify-center bg-gray-50">
                  {isProcessing ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Processing image...</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Click "Process Crop" to see result</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!processedImage || isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Save Image
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
