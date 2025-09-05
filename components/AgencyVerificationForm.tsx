"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { agencyTrackingAPI } from "@/lib/api/agency-tracking"
import { showNotification } from "@/lib/utils/notifications"
import { Upload, FileText, Send, AlertCircle } from "lucide-react"

interface AgencyVerificationFormProps {
  applicationId: string
  agencyName: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function AgencyVerificationForm({
  applicationId,
  agencyName,
  onSuccess,
  onCancel
}: AgencyVerificationFormProps) {
  const [remarks, setRemarks] = useState("")
  const [attachment, setAttachment] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]  
    if (file) {
      // Check file type
      if (file.type !== 'application/pdf') {
        setError("Please select a PDF file")
        return
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB")
        return
      }
      
      setAttachment(file)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!remarks.trim()) {
      setError("Remarks are required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await agencyTrackingAPI.submitVerification(applicationId, agencyName, {
        agency_name: agencyName,
        remarks: remarks.trim(),
        attachment: attachment || undefined
      })

      showNotification.success('Verification submitted successfully')
      
      // Reset form
      setRemarks("")
      setAttachment(null)
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error("Failed to submit verification:", err)
      
      // Handle different error types
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.message) {
        setError(err.message)
      } else {
        setError("Failed to submit verification")
      }
      
      showNotification.error("Failed to submit verification")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Submit Verification - {agencyName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="applicationId">Application ID</Label>
            <Input
              id="applicationId"
              value={applicationId}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="agencyName">Agency</Label>
            <Input
              id="agencyName"
              value={agencyName}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="remarks" className="flex items-center gap-1">
              Remarks <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter verification remarks..."
              rows={4}
              required
              className="resize-none"
            />
          </div>

          <div>
            <Label htmlFor="attachment" className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              Attachment (PDF, max 5MB)
            </Label>
            <Input
              id="attachment"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {attachment && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                  <span>{attachment.name}</span>
                <span>({(attachment.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-600 text-sm">{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !remarks.trim()}
              className="flex-1"
            >
              {loading ? "Submitting..." : "Submit Verification"}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
