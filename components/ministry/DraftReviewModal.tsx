"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { applicationAPI } from "@/lib/api/applications"

interface DraftReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onApprove: (data: { 
    blacklist_check_pass?: boolean;
    etd_issue_date?: string;
    etd_expiry_date?: string;
  }) => Promise<void>
  onReject: (data: { 
    rejection_reason: string;
    blacklist_check_pass?: boolean;
    etd_issue_date?: string;
    etd_expiry_date?: string;
  }) => Promise<void>
  isLoading?: boolean
}

export function DraftReviewModal({
  isOpen,
  onClose,
  onApprove,
  onReject,
  isLoading = false
}: DraftReviewModalProps) {
  const [actionMode, setActionMode] = useState<'select' | 'approve' | 'reject'>('select')
  const [blacklistCheck, setBlacklistCheck] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [etdIssueDate, setEtdIssueDate] = useState('')
  const [etdExpiryDate, setEtdExpiryDate] = useState('')
  const [rejectionReasons, setRejectionReasons] = useState<Array<{
    id: number
    rejection_reason: string
    created_at: string
    updated_at: string
  }>>([])
  const [acceptanceRemarks, setAcceptanceRemarks] = useState<Array<{
    id: number
    acceptance_remarks: string
    created_at: string
    updated_at: string
  }>>([])
  const [acceptanceRemark, setAcceptanceRemark] = useState('')
  const [isLoadingReasons, setIsLoadingReasons] = useState(false)
  const [isLoadingAcceptanceRemarks, setIsLoadingAcceptanceRemarks] = useState(false)
  const hasFetchedReasons = useRef(false)
  const hasFetchedAcceptanceRemarks = useRef(false)

  // Fetch rejection reasons when modal opens
  useEffect(() => {
    if (isOpen && !hasFetchedReasons.current) {
      fetchRejectionReasons()
      hasFetchedReasons.current = true
    }
  }, [isOpen])

  // Fetch acceptance remarks when modal opens
  useEffect(() => {
    if (isOpen && !hasFetchedAcceptanceRemarks.current) {
      fetchAcceptanceRemarks()
      hasFetchedAcceptanceRemarks.current = true
    }
  }, [isOpen])

  const fetchRejectionReasons = async () => {
    setIsLoadingReasons(true)
    try {
      const response = await applicationAPI.getRejectionReasons()
      setRejectionReasons(response.data)
      console.log('Fetched rejection reasons:', response.data)
    } catch (error) {
      console.error('Failed to fetch rejection reasons:', error)
      // Keep existing reasons if available, don't clear them on error
    } finally {
      setIsLoadingReasons(false)
    }
  }

  const fetchAcceptanceRemarks = async () => {
    setIsLoadingAcceptanceRemarks(true)
    try {
      const response = await applicationAPI.getAcceptanceRemarks()
      setAcceptanceRemarks(response.data)
      console.log('Fetched acceptance remarks:', response.data)
    } catch (error) {
      console.error('Failed to fetch acceptance remarks:', error)
      // Keep existing remarks if available, don't clear them on error
    } finally {
      setIsLoadingAcceptanceRemarks(false)
    }
  }

  const handleApprove = async () => {
    await onApprove({
      blacklist_check_pass: blacklistCheck,
      etd_issue_date: etdIssueDate || undefined,
      etd_expiry_date: etdExpiryDate || undefined
    })
    resetForm()
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please select or enter a rejection reason')
      return
    }
    await onReject({
      rejection_reason: rejectionReason.trim(),
      blacklist_check_pass: false,
      etd_issue_date: undefined,
      etd_expiry_date: undefined
    })
    resetForm()
  }

  const resetForm = () => {
    setActionMode('select')
    setBlacklistCheck(false)
    setRejectionReason('')
    setAcceptanceRemark('')
    setEtdIssueDate('')
    setEtdExpiryDate('')
  }

  const handleClose = () => {
    resetForm()
    hasFetchedReasons.current = false
    hasFetchedAcceptanceRemarks.current = false
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold">Ministry Review</div>
              <div className="text-sm text-gray-500 mt-1">
                {actionMode === 'select' && 'Select Action'}
                {actionMode === 'approve' && 'Approve Application'}
                {actionMode === 'reject' && 'Reject Application'}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Action Selection Screen */}
          {actionMode === 'select' && (
            <div className="space-y-4">
              <div className="text-center text-gray-600 mb-6">
                Select an action for this DRAFT application
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => setActionMode('approve')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isLoading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Application
                </Button>
                
                <Button
                  onClick={() => setActionMode('reject')}
                  variant="destructive"
                  disabled={isLoading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Application
                </Button>
              </div>
            </div>
          )}

          {/* Approval Screen */}
          {actionMode === 'approve' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="text-green-800">
                    <div className="font-medium">Application will be approved</div>
                    <div className="text-sm">ETD will be issued with the specified dates</div>
                  </div>
                </div>
              </div>

                             {/* ETD Issue Date */}
               <div className="space-y-2">
                 <Label htmlFor="etd-issue-date">
                   ETD Issue Date
                 </Label>
                 <Input
                   id="etd-issue-date"
                   type="date"
                   value={etdIssueDate}
                   onChange={(e) => setEtdIssueDate(e.target.value)}
                   min={new Date().toISOString().split('T')[0]}
                   max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                   className="w-full"
                 />
               </div>

               {/* ETD Expiry Date */}
               <div className="space-y-2">
                 <Label htmlFor="etd-expiry-date">
                   ETD Expiry Date
                 </Label>
                 <Input
                   id="etd-expiry-date"
                   type="date"
                   value={etdExpiryDate}
                   onChange={(e) => setEtdExpiryDate(e.target.value)}
                   min={etdIssueDate || new Date().toISOString().split('T')[0]}
                   max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                   className="w-full"
                 />
                              </div>

               {/* Acceptance Remarks */}
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <Label htmlFor="acceptance-remarks">Acceptance Remarks</Label>
                   <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     onClick={fetchAcceptanceRemarks}
                     disabled={isLoadingAcceptanceRemarks}
                     className="text-xs"
                   >
                     {isLoadingAcceptanceRemarks ? "Loading..." : "Refresh"}
                   </Button>
                 </div>
                 <div className="space-y-2">
                   <Select
                     value={acceptanceRemark}
                     onValueChange={setAcceptanceRemark}
                     disabled={isLoadingAcceptanceRemarks}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder={isLoadingAcceptanceRemarks ? "Loading remarks..." : "Select acceptance remarks"} />
                     </SelectTrigger>
                     <SelectContent>
                       {acceptanceRemarks.length > 0 ? (
                         acceptanceRemarks.map((remark) => (
                           <SelectItem key={remark.id} value={remark.acceptance_remarks}>
                             {remark.acceptance_remarks}
                           </SelectItem>
                         ))
                       ) : (
                         <div className="px-2 py-1.5 text-sm text-muted-foreground">
                           No acceptance remarks available
                         </div>
                       )}
                     </SelectContent>
                   </Select>
                  
                 </div>
               </div>

               <div className="flex items-center space-x-2">
                 <input
                   id="approve-blacklist"
                   type="checkbox"
                   checked={blacklistCheck}
                   onChange={(e) => setBlacklistCheck(e.target.checked)}
                   className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                 />
                 <Label htmlFor="approve-blacklist" className="text-sm">
                   Mark as blacklisted (will still be approved but flagged)
                 </Label>
               </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setActionMode('select')}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Processing...' : 'Confirm Approval'}
                </Button>
              </div>
            </div>
          )}

          {/* Rejection Screen */}
          {actionMode === 'reject' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-red-800">
                    <div className="font-medium">Application will be rejected</div>
                    <div className="text-sm">ETD will not be issued</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fetchRejectionReasons}
                    disabled={isLoadingReasons}
                    className="text-xs"
                  >
                    {isLoadingReasons ? "Loading..." : "Refresh"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Select
                    value={rejectionReason}
                    onValueChange={setRejectionReason}
                    disabled={isLoadingReasons}
                  >
                    <SelectTrigger 
                      className={!rejectionReason.trim() && actionMode === 'reject' ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder={isLoadingReasons ? "Loading reasons..." : "Select a rejection reason"} />
                    </SelectTrigger>
                                         <SelectContent>
                       {rejectionReasons.length > 0 ? (
                         rejectionReasons.map((reason) => (
                           <SelectItem key={reason.id} value={reason.rejection_reason}>
                             {reason.rejection_reason}
                           </SelectItem>
                         ))
                       ) : (
                         <div className="px-2 py-1.5 text-sm text-muted-foreground">
                           No rejection reasons available
                         </div>
                       )}
                     </SelectContent>
                  </Select>
                  
                  {/* Custom reason input */}
                  <div className="space-y-2">
                    <Label htmlFor="custom-rejection-reason" className="text-sm text-gray-600">
                      Or enter custom reason:
                    </Label>
                    <Textarea
                      id="custom-rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter custom rejection reason"
                      rows={2}
                      className={!rejectionReason.trim() && actionMode === 'reject' ? "border-red-500" : ""}
                    />
                  </div>
                  
                  {!rejectionReason.trim() && actionMode === 'reject' && (
                    <p className="text-sm text-red-500">Rejection reason is required</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setActionMode('select')}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isLoading}
                  variant="destructive"
                >
                  {isLoading ? 'Processing...' : 'Confirm Rejection'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
