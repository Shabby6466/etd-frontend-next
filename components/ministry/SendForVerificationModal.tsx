"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Upload, AlertCircle, FileText, Trash2 } from "lucide-react"
import { sendForVerificationSchema } from "@/lib/validations"

interface SendForVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    agencies: string[]
    remarks: string
    verification_document?: File
  }) => Promise<void>
  isLoading?: boolean
}

export function SendForVerificationModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: SendForVerificationModalProps) {
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([])
  const [remarks, setRemarks] = useState<string>('')
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const availableAgencies = [
    { id: 'INTELLIGENCE_BUREAU', label: 'Intelligence Bureau' },
    { id: 'SPECIAL_BRANCH_PUNJAB', label: 'Special Branch Punjab' },
    { id: 'SPECIAL_BRANCH_SINDH', label: 'Special Branch Sindh' },
    { id: 'SPECIAL_BRANCH_KPK', label: 'Special Branch KPK' },
    { id: 'SPECIAL_BRANCH_BALOCHISTAN', label: 'Special Branch Balochistan' },
    { id: 'SPECIAL_BRANCH_FEDERAL', label: 'Special Branch Federal' },
  ]

  const handleAgencyChange = (agencyId: string, checked: boolean) => {
    if (checked) {
      setSelectedAgencies([...selectedAgencies, agencyId])
    } else {
      setSelectedAgencies(selectedAgencies.filter(id => id !== agencyId))
    }
    // Clear agency error when user makes a selection
    if (errors.agencies) {
      setErrors(prev => ({ ...prev, agencies: '' }))
    }
  }

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      setErrors(prev => ({ ...prev, verification_document: 'Only PDF files are allowed' }))
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, verification_document: 'File size must be less than 10MB' }))
      return
    }

    setVerificationDocument(file)
    setErrors(prev => ({ ...prev, verification_document: '' }))
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const removeFile = () => {
    setVerificationDocument(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setErrors(prev => ({ ...prev, verification_document: '' }))
  }



  const validateForm = () => {
    const formData = {
      agencies: selectedAgencies,
      remarks: remarks.trim() || undefined,
      verification_document: verificationDocument || undefined
    }

    try {
      sendForVerificationSchema.parse(formData)
      setErrors({})
      return true
    } catch (error: any) {
      const newErrors: Record<string, string> = {}
      if (error.errors) {
        error.errors.forEach((err: any) => {
          newErrors[err.path[0]] = err.message
        })
      }
      setErrors(newErrors)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    const data = {
      agencies: selectedAgencies,
      remarks: remarks.trim(),
      verification_document: verificationDocument || undefined
    }
    
    console.log('SendForVerificationModal - Submitting data:', {
      agencies: data.agencies,
      agenciesType: typeof data.agencies,
      agenciesLength: data.agencies.length,
      agenciesDetails: data.agencies.map((agency, index) => ({
        index,
        agency,
        type: typeof agency,
        length: agency.length
      })),
      hasVerificationDocument: !!data.verification_document
    })
    
    try {
      await onSubmit(data)
      
      // Reset form on success
      setSelectedAgencies([])
      setRemarks('')
      setVerificationDocument(null)
      setErrors({})
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onClose()
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Error submitting verification:', error)
    }
  }

  const handleClose = () => {
    // Reset form when closing
    setSelectedAgencies([])
    setRemarks('')
    setVerificationDocument(null)
    setErrors({})
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 rounded-3xl">
        <CardHeader className="flex items-center justify-between relative">
            <CardTitle>Send for Verification</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
              className="absolute top-2 right-5"
            >
              <X className="h-4 w-4 text-gray-500 text-sm " />
            </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-base font-medium">Select Agencies for Verification</Label>
              <div className="mt-2 space-y-2">
                {availableAgencies.map((agency) => (
                  <div key={agency.id} className="flex items-center space-x-2">
                    <input
                      id={agency.id}
                      type="checkbox"
                      checked={selectedAgencies.includes(agency.id)}
                      onChange={(e) => handleAgencyChange(agency.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <Label htmlFor={agency.id}>{agency.label}</Label>
                  </div>
                ))}
              </div>
              {errors.agencies && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.agencies}
                </div>
              )}
            </div>



            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter any additional remarks..."
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label className="text-base font-medium">Verification Document (Optional)</Label>
              <p className="text-sm text-gray-600 mb-2">Upload a PDF document for verification</p>
              
              {!verificationDocument ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop a PDF file here, or click to browse
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{verificationDocument.name}</p>
                        <p className="text-xs text-gray-500">
                          {(verificationDocument.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {errors.verification_document && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.verification_document}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Sending...' : 'Send for Verification'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
