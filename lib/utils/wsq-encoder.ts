/**
 * Client-side WSQ-like encoding utility
 * 
 * Note: This is a simplified WSQ-like implementation for demonstration.
 * For production use with FBI/NIST compliance, use certified WSQ libraries.
 */

export interface WSQResult {
  wsqBase64: string
  compressionRatio: number
  originalSize: number
  compressedSize: number
  quality: number
}

/**
 * Convert BMP base64 to WSQ-like compressed format
 */
export async function encodeToWSQ(
  bmpBase64: string, 
  compressionRatio: number = 15
): Promise<WSQResult> {
  try {
    // Create image from base64
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // Set canvas dimensions
          canvas.width = img.width
          canvas.height = img.height
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0)
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const originalSize = imageData.data.length
          
          // Convert to grayscale and apply WSQ-like compression
          const compressed = applyWSQCompression(imageData, compressionRatio)
          
          // Convert back to base64
          const wsqBase64 = arrayBufferToBase64(compressed.data)
          
          resolve({
            wsqBase64,
            compressionRatio,
            originalSize,
            compressedSize: compressed.data.byteLength,
            quality: compressed.quality
          })
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = `data:image/bmp;base64,${bmpBase64}`
    })
  } catch (error) {
    throw new Error(`WSQ encoding failed: ${error}`)
  }
}

/**
 * Apply WSQ-like compression algorithm
 */
function applyWSQCompression(
  imageData: ImageData, 
  ratio: number
): { data: ArrayBuffer; quality: number } {
  const { width, height, data } = imageData
  
  // Convert to grayscale
  const grayscale = new Uint8Array(width * height)
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    )
    grayscale[i / 4] = gray
  }
  
  // Apply wavelet-like transform (simplified)
  const compressed = applyWaveletCompression(grayscale, width, height, ratio)
  
  // Calculate quality metric
  const quality = calculateCompressionQuality(grayscale, compressed.data, ratio)
  
  return {
    data: compressed.buffer,
    quality
  }
}

/**
 * Simplified wavelet-like compression
 */
function applyWaveletCompression(
  data: Uint8Array, 
  width: number, 
  height: number, 
  ratio: number
): { buffer: ArrayBuffer; data: Uint8Array } {
  // This is a simplified compression - in real WSQ, this would be much more complex
  const blockSize = Math.max(1, Math.floor(ratio / 3))
  const compressed: number[] = []
  
  // Header: width, height, ratio
  compressed.push(...encodeHeader(width, height, ratio))
  
  // Block-based compression
  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      const block = extractBlock(data, x, y, blockSize, width, height)
      const compressedBlock = compressBlock(block, ratio)
      compressed.push(...compressedBlock)
    }
  }
  
  const result = new Uint8Array(compressed)
  return {
    buffer: result.buffer,
    data: result
  }
}

/**
 * Encode WSQ header
 */
function encodeHeader(width: number, height: number, ratio: number): number[] {
  // Simple header format: [magic, width, height, ratio]
  return [
    0x57, 0x53, 0x51, 0x00, // "WSQ" magic number
    width & 0xFF, (width >> 8) & 0xFF,
    height & 0xFF, (height >> 8) & 0xFF,
    ratio & 0xFF
  ]
}

/**
 * Extract block from image
 */
function extractBlock(
  data: Uint8Array, 
  x: number, 
  y: number, 
  size: number, 
  width: number, 
  height: number
): number[] {
  const block: number[] = []
  for (let by = 0; by < size && y + by < height; by++) {
    for (let bx = 0; bx < size && x + bx < width; bx++) {
      const idx = (y + by) * width + (x + bx)
      block.push(data[idx])
    }
  }
  return block
}

/**
 * Compress block using quantization
 */
function compressBlock(block: number[], ratio: number): number[] {
  if (block.length === 0) return []
  
  // Calculate average
  const avg = block.reduce((sum, val) => sum + val, 0) / block.length
  
  // Quantize based on ratio
  const quantStep = Math.max(1, Math.floor(ratio / 2))
  const quantized = Math.round(avg / quantStep) * quantStep
  
  // Store as [quantized_value, block_size]
  return [Math.min(255, Math.max(0, quantized)), block.length]
}

/**
 * Calculate compression quality metric
 */
function calculateCompressionQuality(
  original: Uint8Array, 
  compressed: Uint8Array, 
  ratio: number
): number {
  // Simple quality metric based on compression ratio and data reduction
  const compressionFactor = original.length / compressed.length
  const expectedCompression = ratio
  
  // Quality decreases as we deviate from expected compression
  const efficiency = Math.min(1, compressionFactor / expectedCompression)
  
  // Return quality as percentage (higher is better)
  return Math.round(efficiency * 100)
}

/**
 * Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
  return btoa(binary)
}

/**
 * Create WSQ-like file header for display
 */
export function createWSQInfo(wsqResult: WSQResult): {
  header: string
  stats: {
    originalSize: number
    compressedSize: number
    compressionRatio: number
    quality: number
    savings: string
  }
} {
  const savings = (((wsqResult.originalSize - wsqResult.compressedSize) / wsqResult.originalSize) * 100).toFixed(1)
  
  return {
    header: `WSQ v1.0 - ${wsqResult.compressionRatio}:1 compression`,
    stats: {
      originalSize: wsqResult.originalSize,
      compressedSize: wsqResult.compressedSize,
      compressionRatio: wsqResult.compressionRatio,
      quality: wsqResult.quality,
      savings: `${savings}%`
    }
  }
}
