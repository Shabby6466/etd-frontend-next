export interface ImageProcessingOptions {
  targetWidth: number;
  targetHeight: number;
  maxSizeKB: number;
  quality?: number;
}

export interface ProcessedImage {
  base64: string;
  sizeKB: number;
  width: number;
  height: number;
}

/**
 * Resize and compress image to meet requirements
 */
export const processImage = (
  file: File,
  options: ImageProcessingOptions
): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Set canvas dimensions to target size
        canvas.width = options.targetWidth;
        canvas.height = options.targetHeight;

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate scaling to maintain aspect ratio
        const scale = Math.min(
          options.targetWidth / img.width,
          options.targetHeight / img.height
        );

        // Calculate dimensions to center the image
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (options.targetWidth - scaledWidth) / 2;
        const offsetY = (options.targetHeight - scaledHeight) / 2;

        // Clear canvas and draw resized image
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          offsetX,
          offsetY,
          scaledWidth,
          scaledHeight
        );

        // Convert to base64 with compression
        let quality = options.quality || 0.8;
        let base64 = canvas.toDataURL('image/jpeg', quality);
        
        // Remove data URL prefix to get pure base64
        const base64Data = base64.split(',')[1];
        
        // Calculate size in KB
        const sizeKB = Math.ceil((base64Data.length * 3) / 4) / 1024;

        // If still too large, compress further
        if (sizeKB > options.maxSizeKB && quality > 0.1) {
          quality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', quality);
          const newBase64Data = base64.split(',')[1];
          const newSizeKB = Math.ceil((newBase64Data.length * 3) / 4) / 1024;
          
          resolve({
            base64: newBase64Data,
            sizeKB: newSizeKB,
            width: options.targetWidth,
            height: options.targetHeight
          });
        } else {
          resolve({
            base64: base64Data,
            sizeKB,
            width: options.targetWidth,
            height: options.targetHeight
          });
        }
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): string | null => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'Please select a valid image file';
  }

  // Check file size (max 10MB for initial upload)
  if (file.size > 10 * 1024 * 1024) {
    return 'Image size must be less than 10MB';
  }

  return null;
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
};
