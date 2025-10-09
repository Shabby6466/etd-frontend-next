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
  const [needsUpscaling, setNeedsUpscaling] = useState(false);
  
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
    
    // Check if image needs upscaling
    const needsUpscale = img.naturalWidth < TARGET_WIDTH || img.naturalHeight < TARGET_HEIGHT;
    setNeedsUpscaling(needsUpscale);
    
    // Calculate scale to fit image in container while maintaining aspect ratio
    const containerWidth = container.clientWidth;
    const containerHeight = 400; // Fixed height for preview
    
    // For small images, we might want to scale them up for better visibility
    let scale;
    if (needsUpscale) {
      // Scale up small images to make them more visible in the preview
      const scaleX = Math.min(containerWidth / img.naturalWidth, 2); // Max 2x upscale for preview
      const scaleY = Math.min(containerHeight / img.naturalHeight, 2);
      scale = Math.min(scaleX, scaleY);
    } else {
      const scaleX = containerWidth / img.naturalWidth;
      const scaleY = containerHeight / img.naturalHeight;
      scale = Math.min(scaleX, scaleY);
    }
    
    setImageScale(scale);
    
    // Calculate display size
    const displayWidth = img.naturalWidth * scale;
    const displayHeight = img.naturalHeight * scale;
    setImageDisplaySize({ width: displayWidth, height: displayHeight });
    
    // Center the image
    const offsetX = (containerWidth - displayWidth) / 2;
    const offsetY = (containerHeight - displayHeight) / 2;
    
    setImageOffset({ x: offsetX, y: offsetY });
    
    // Initialize crop area with fixed aspect ratio (540:420)
    const cropAspectRatio = TARGET_WIDTH / TARGET_HEIGHT; // 540/420 = 1.2857
    
    let cropWidth, cropHeight;
    
    if (needsUpscale) {
      // For small images, make the crop area cover as much as possible
      // Use 95% of the image size to maximize the usable area
      const maxCropWidth = displayWidth * 0.95;
      const maxCropHeight = displayHeight * 0.95;
      
      if (maxCropWidth / maxCropHeight > cropAspectRatio) {
        // Limited by height
        cropHeight = maxCropHeight;
        cropWidth = cropHeight * cropAspectRatio;
      } else {
        // Limited by width
        cropWidth = maxCropWidth;
        cropHeight = cropWidth / cropAspectRatio;
      }
    } else {
      // For larger images, use 80% to give more flexibility
      const maxCropWidth = displayWidth * 0.8;
      const maxCropHeight = displayHeight * 0.8;
      
      if (maxCropWidth / maxCropHeight > cropAspectRatio) {
        // Limited by height
        cropHeight = Math.min(maxCropHeight, displayHeight);
        cropWidth = cropHeight * cropAspectRatio;
      } else {
        // Limited by width
        cropWidth = Math.min(maxCropWidth, displayWidth);
        cropHeight = cropWidth / cropAspectRatio;
      }
    }
    
    // Ensure crop area doesn't exceed image bounds
    cropWidth = Math.min(cropWidth, displayWidth);
    cropHeight = Math.min(cropHeight, displayHeight);
    
    // Center the crop area on the image
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
    
    // Check if click is inside crop area - if so, drag from that point
    if (x >= cropArea.x && x <= cropArea.x + cropArea.width &&
        y >= cropArea.y && y <= cropArea.y + cropArea.height) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
      e.preventDefault();
    } else {
      // If clicked outside, center the crop area on the click point
      const newX = x - cropArea.width / 2;
      const newY = y - cropArea.height / 2;
      
      // Constrain to image bounds
      const maxX = imageOffset.x + imageDisplaySize.width - cropArea.width;
      const maxY = imageOffset.y + imageDisplaySize.height - cropArea.height;
      
      setCropArea(prev => ({
        ...prev,
        x: Math.max(imageOffset.x, Math.min(maxX, newX)),
        y: Math.max(imageOffset.y, Math.min(maxY, newY))
      }));
      
      // Start dragging from the center
      setIsDragging(true);
      setDragStart({ x: cropArea.width / 2, y: cropArea.height / 2 });
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !imageLoaded || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let newX = x - dragStart.x;
    let newY = y - dragStart.y;
    
    // Constrain crop area to image bounds
    const minX = imageOffset.x;
    const minY = imageOffset.y;
    const maxX = imageOffset.x + imageDisplaySize.width - cropArea.width;
    const maxY = imageOffset.y + imageDisplaySize.height - cropArea.height;
    
    // Clamp the values
    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));
    
    setCropArea(prev => ({
      ...prev,
      x: newX,
      y: newY
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
      // The scale is the ratio between the original image and the displayed image
      const scaleX = img.naturalWidth / imageDisplaySize.width;
      const scaleY = img.naturalHeight / imageDisplaySize.height;
      
      // Convert crop area from display coordinates to original image coordinates
      // Subtract imageOffset to get position relative to the image (not container)
      const cropXRelative = cropArea.x - imageOffset.x;
      const cropYRelative = cropArea.y - imageOffset.y;
      
      // Scale to original image coordinates
      const cropX = Math.round(cropXRelative * scaleX);
      const cropY = Math.round(cropYRelative * scaleY);
      const cropWidth = Math.round(cropArea.width * scaleX);
      const cropHeight = Math.round(cropArea.height * scaleY);
      
      // Ensure we're within bounds
      const finalCropX = Math.max(0, Math.min(img.naturalWidth - cropWidth, cropX));
      const finalCropY = Math.max(0, Math.min(img.naturalHeight - cropHeight, cropY));
      const finalCropWidth = Math.min(cropWidth, img.naturalWidth - finalCropX);
      const finalCropHeight = Math.min(cropHeight, img.naturalHeight - finalCropY);

      // Set canvas to target size
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;

      // Fill with white background first
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      // Draw the cropped portion to fill the entire canvas
      ctx.drawImage(
        img,
        finalCropX, finalCropY, finalCropWidth, finalCropHeight,
        0, 0, TARGET_WIDTH, TARGET_HEIGHT
      );

      // Convert to base64 with compression - try multiple quality levels
      let quality = 0.9;
      let base64 = canvas.toDataURL("image/jpeg", quality);
      let base64Data = base64.split(",")[1];
      let sizeKB = Math.ceil((base64Data.length * 3) / 4) / 1024;

      // Iteratively reduce quality if needed
      while (sizeKB > MAX_SIZE_KB && quality > 0.1) {
        quality -= 0.05;
        base64 = canvas.toDataURL("image/jpeg", quality);
        base64Data = base64.split(",")[1];
        sizeKB = Math.ceil((base64Data.length * 3) / 4) / 1024;
      }
      
      setProcessedImage({
        base64: base64Data,
        sizeKB,
        width: TARGET_WIDTH,
        height: TARGET_HEIGHT
      });
      
      if (sizeKB > MAX_SIZE_KB) {
        showNotification.warning(`Image size is ${sizeKB.toFixed(1)}KB (max: ${MAX_SIZE_KB}KB). Quality has been reduced to meet requirements.`);
      } else if (needsUpscaling) {
        showNotification.success(`Image processed successfully! Size: ${sizeKB.toFixed(1)}KB (upscaled from smaller original)`);
      } else {
        showNotification.success(`Image processed successfully! Size: ${sizeKB.toFixed(1)}KB`);
      }
    } catch (error) {
      console.error("Image processing error:", error);
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
    setNeedsUpscaling(false);
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
            <div className={`p-4 rounded-lg ${needsUpscaling ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
              <h3 className={`font-semibold mb-2 ${needsUpscaling ? 'text-yellow-900' : 'text-gray-900'}`}>
                Original Image:
              </h3>
              <p className={`text-sm ${needsUpscaling ? 'text-yellow-800' : 'text-gray-700'}`}>
                Dimensions: {originalDimensions.width} × {originalDimensions.height} pixels
              </p>
              {needsUpscaling && (
                <div className="mt-2 text-sm text-yellow-900">
                  <p className="font-medium">⚠️ Image is smaller than required ({TARGET_WIDTH}×{TARGET_HEIGHT})</p>
                  <p className="mt-1">The image will be upscaled to fit the required size. This may result in some quality loss, but the system will optimize for best results.</p>
                </div>
              )}
            </div>
          )}

          {/* Image Preview with Crop Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Preview with Crop */}
            <div>
              <h3 className="font-semibold mb-3">
                {needsUpscaling ? 'Select Area to Crop (Image will be upscaled)' : 'Crop Image (Drag the box to adjust)'}
              </h3>
              <div 
                ref={containerRef}
                className={`relative border-2 rounded-lg overflow-hidden ${needsUpscaling ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-gray-100'}`}
                style={{ height: '400px', cursor: isDragging ? 'grabbing' : 'crosshair' }}
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
                      userSelect: 'none',
                      pointerEvents: 'none'
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
                    
                    {/* Crop area with clear border */}
                    <div
                      className="absolute border-4 border-blue-500 shadow-lg"
                      style={{
                        left: `${cropArea.x}px`,
                        top: `${cropArea.y}px`,
                        width: `${cropArea.width}px`,
                        height: `${cropArea.height}px`,
                        backgroundColor: 'transparent',
                        pointerEvents: 'none',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      {/* Crop area label */}
                      <div className="absolute -top-7 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        {TARGET_WIDTH}×{TARGET_HEIGHT}
                      </div>
                    </div>
                    
                    {/* Corner handles */}
                    {['nw', 'ne', 'sw', 'se'].map((corner) => (
                      <div
                        key={corner}
                        className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full"
                        style={{
                          left: `${cropArea.x + (corner.includes('e') ? cropArea.width : 0) - 8}px`,
                          top: `${cropArea.y + (corner.includes('s') ? cropArea.height : 0) - 8}px`,
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
              <div className="mt-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <Move className="inline w-4 h-4 mr-1" />
                    Click anywhere or drag the blue box to position
                  </div>
                  <Button
                    onClick={processImageFile}
                    disabled={!imageLoaded || isProcessing}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isProcessing ? "Processing..." : "Process Crop"}
                  </Button>
                </div>
                {needsUpscaling && (
                  <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                    💡 Tip: Position the crop area to capture the most important part of the image. The selected area will be enlarged to {TARGET_WIDTH}×{TARGET_HEIGHT}.
                  </div>
                )}
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
                  <div className={`p-3 ${needsUpscaling ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                    <p className="text-sm text-gray-700">
                      Size: {processedImage.sizeKB.toFixed(1)}KB
                      {processedImage.sizeKB > MAX_SIZE_KB && (
                        <span className="text-red-600 ml-2">(Exceeds limit)</span>
                      )}
                      {needsUpscaling && processedImage.sizeKB <= MAX_SIZE_KB && (
                        <span className="text-green-600 ml-2">✓ Upscaled successfully</span>
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
