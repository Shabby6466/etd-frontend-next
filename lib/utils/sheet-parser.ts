/**
 * Utility functions for parsing sheet numbers with range support
 */

export interface SheetNumberParseResult {
  numbers: string[]
  totalCount: number
  preview: string
}

/**
 * Parse sheet numbers input with support for ranges
 * @param input - The input string containing sheet numbers
 * @returns Object with parsed numbers, total count, and preview
 */
export const parseSheetNumbers = (input: string): SheetNumberParseResult => {
  const numbers: string[] = []
  
  // Split by comma and newline, then process each part
  const parts = input.split(/[,\n]/).map(part => part.trim()).filter(part => part.length > 0)
  
  for (const part of parts) {
    // Check if it's a range (e.g., "100-104")
    if (part.includes('-')) {
      const rangeMatch = part.match(/^(\d+)-(\d+)$/)
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1])
        const end = parseInt(rangeMatch[2])
        
        if (start <= end) {
          // Generate all numbers in the range
          for (let i = start; i <= end; i++) {
            numbers.push(i.toString())
          }
        } else {
          // Invalid range (start > end), add as individual number
          numbers.push(part)
        }
      } else {
        // Invalid range format, add as individual number
        numbers.push(part)
      }
    } else {
      // Single number, add directly
      numbers.push(part)
    }
  }
  
  // Remove duplicates and sort
  const uniqueNumbers = Array.from(new Set(numbers)).sort((a, b) => parseInt(a) - parseInt(b))
  
  // Create preview string
  let preview = ''
  if (uniqueNumbers.length <= 10) {
    preview = uniqueNumbers.join(', ')
  } else {
    preview = `${uniqueNumbers.slice(0, 5).join(', ')} ... ${uniqueNumbers.slice(-5).join(', ')} (${uniqueNumbers.length} total)`
  }
  
  return {
    numbers: uniqueNumbers,
    totalCount: uniqueNumbers.length,
    preview
  }
}

/**
 * Validate sheet numbers input and return any errors
 * @param input - The input string to validate
 * @returns Array of error messages, empty if valid
 */
export const validateSheetNumbers = (input: string): string[] => {
  const errors: string[] = []
  
  if (!input.trim()) {
    return ['Please enter at least one sheet number']
  }
  
  const parts = input.split(/[,\n]/).map(part => part.trim()).filter(part => part.length > 0)
  
  for (const part of parts) {
    if (part.includes('-')) {
      const rangeMatch = part.match(/^(\d+)-(\d+)$/)
      if (!rangeMatch) {
        errors.push(`Invalid range format: "${part}". Use format like "100-104"`)
      } else {
        const start = parseInt(rangeMatch[1])
        const end = parseInt(rangeMatch[2])
        if (start > end) {
          errors.push(`Invalid range: "${part}". Start number must be less than or equal to end number`)
        }
        if (end - start > 1000) {
          errors.push(`Range too large: "${part}". Maximum range is 1000 numbers`)
        }
      }
    } else {
      if (!/^\d+$/.test(part)) {
        errors.push(`Invalid sheet number: "${part}". Must be a positive integer`)
      }
    }
  }
  
  return errors
}
