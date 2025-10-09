"use client"

import { useState, useEffect } from "react"
import { Eye, FileText, Loader2 } from "lucide-react"

interface DocumentPreviewToggleProps {
  onToggle: (isNewDesign: boolean) => void
  isNewDesign: boolean
}

export default function DocumentPreviewToggle({ onToggle, isNewDesign }: DocumentPreviewToggleProps) {
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleToggle = (newValue: boolean) => {
    setIsTransitioning(true)
    onToggle(newValue)
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false)
    }, 300)
  }
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 print:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Document Preview</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Design Labels */}
          <div className="flex items-center space-x-3 text-sm">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              !isNewDesign 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-500 hover:text-gray-700'
            }`}>
              <FileText className="h-4 w-4" />
              <span className="font-medium">Standard</span>
            </div>
            
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              isNewDesign 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'text-gray-500 hover:text-gray-700'
            }`}>
              <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-green-400 to-green-600"></div>
              <span className="font-medium">New Design</span>
            </div>
          </div>
          
          {/* Toggle Switch */}
          <button
            onClick={() => handleToggle(!isNewDesign)}
            disabled={isTransitioning}
            className="relative inline-flex items-center justify-center w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isNewDesign ? '#10b981' : '#d1d5db'
            }}
            aria-label={`Switch to ${isNewDesign ? 'standard' : 'new'} design`}
          >
            {isTransitioning ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <span
                className={`inline-block w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${
                  isNewDesign ? 'translate-x-3' : '-translate-x-3'
                }`}
              />
            )}
          </button>
        </div>
      </div>
      
      {/* Description */}
      <div className="mt-3 text-xs text-gray-500">
        {isTransitioning ? (
          <span className="flex items-center space-x-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Switching design...</span>
          </span>
        ) : isNewDesign ? (
          <span>Showing the new single-page document design with enhanced visual elements</span>
        ) : (
          <span>Showing the standard two-page document design with traditional layout</span>
        )}
      </div>
    </div>
  )
}
