"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, Fingerprint, Loader2, CheckCircle2, AlertCircle, RefreshCw, XCircle, Clock, Eye } from "lucide-react"
import { SmartCameraCapture } from "@/components/ui/SmartCameraCapture"
import BiometricCaptureModal from "@/components/ui/BiometricCaptureModal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { nadraAPI, ResultResponse, NadraMatch } from "@/lib/api/nadra"
import { Badge } from "@/components/ui/badge"

// --- Constants & Types ---

const FINGERS = [
  { key: 'right_thumb', label: 'Right Thumb' },
  { key: 'right_index', label: 'Right Index' },
  { key: 'right_middle', label: 'Right Middle' },
  { key: 'right_ring', label: 'Right Ring' },
  { key: 'right_small', label: 'Right Small' },
  { key: 'left_thumb', label: 'Left Thumb' },
  { key: 'left_index', label: 'Left Index' },
  { key: 'left_middle', label: 'Left Middle' },
  { key: 'left_ring', label: 'Left Ring' },
  { key: 'left_small', label: 'Left Small' },
] as const;

type FingerKey = typeof FINGERS[number]['key'];

interface LocalTransaction {
  transactionId: string
  referenceNumber: string
  submittedAt: string
  status: 'pending' | 'completed' | 'failed'
  result?: ResultResponse | null
  responseMessage?: string
  photo: string | null // Base64 needed for list display
}

const STORAGE_KEY_LIST = 'nadra_1_to_n_list'

export default function NadraProcessingPage() {
  const router = useRouter()

  // --- Persistence ---
  const [transactions, setTransactions] = useState<LocalTransaction[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  // --- New Request State ---
  const [referenceNumber, setReferenceNumber] = useState(`APP-${Math.floor(Math.random() * 100000)}`)
  const [photo, setPhoto] = useState<string | null>(null) // base64
  const [fingerprints, setFingerprints] = useState<Record<string, string>>({}) // key -> base64 (WSQ)

  // --- UI State ---
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [activeFingerKey, setActiveFingerKey] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Navigation/View State ---
  const [viewMode, setViewMode] = useState<'list' | 'new' | 'detail'>('list')
  const [selectedTxn, setSelectedTxn] = useState<LocalTransaction | null>(null)
  const [pollingTxnId, setPollingTxnId] = useState<string | null>(null)

  // Load transactions
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LIST)
      if (stored) {
        setTransactions(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Failed to load transactions", e)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  // Save transactions
  useEffect(() => {
    if (!loadingHistory) {
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(transactions))
    }
  }, [transactions, loadingHistory])

  // --- Actions ---

  const handleGoBack = () => {
    if (viewMode !== 'list') {
      setViewMode('list')
      setSelectedTxn(null)
      // Reset form
      setPhoto(null)
      setFingerprints({})
    } else {
      router.back()
    }
  }

  const handleCreateNew = () => {
    setReferenceNumber(`APP-${Math.floor(Math.random() * 100000)}`)
    setPhoto(null)
    setFingerprints({})
    setViewMode('new')
  }

  const handleSubmit = async () => {
    if (!photo) {
      toast.error("Photograph is required")
      return
    }
    if (Object.keys(fingerprints).length < 1) {
      toast.error("At least one fingerprint is required")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        referenceNumber,
        photograph: photo,
        fingerprintMap: fingerprints
      }

      const data = await nadraAPI.identify1toN(payload);
      const { transactionId: newTxnId } = data;

      const newTxn: LocalTransaction = {
        transactionId: newTxnId,
        referenceNumber,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        photo: photo // Save for list view
      }

      setTransactions(prev => [newTxn, ...prev])
      toast.success("Request Submitted", { description: `Txn ID: ${newTxnId}` })

      setViewMode('list')
      setReferenceNumber(`APP-${Math.floor(Math.random() * 100000)}`)

    } catch (err: any) {
      console.error(err)
      toast.error("Failed to submit", {
        description: err.response?.data?.message || err.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheckStatus = async (txn: LocalTransaction) => {
    setPollingTxnId(txn.transactionId)
    try {
      const data = await nadraAPI.getIdentificationResult(txn.transactionId);

      if (data && data.responseStatus) {
        // Determine success based on Nadra response code or convention
        // "100" usually means success/done, and check if matches exist
        const isCompleted = data.responseStatus.code === "100" || (data.matches && data.matches.length > 0);

        const updatedTxn: LocalTransaction = {
          ...txn,
          status: isCompleted ? 'completed' : 'pending',
          result: data,
          responseMessage: data.responseStatus.message
        }

        setTransactions(prev => prev.map(t =>
          t.transactionId === txn.transactionId ? updatedTxn : t
        ))

        if (isCompleted) {
          toast.success("Result Received!", { description: "Identification process completed." })
        } else {
          toast.info("Status Update", { description: data.responseStatus.message })
        }
      }
    } catch (err: any) {
      // Handle "Not Ready" vs "Error"
      if (err.response && (err.response.status === 404 || err.response.status === 400)) {
        toast.info("Not Ready Yet", { description: "Still processing on server." })
      } else {
        toast.error("Error Checking Status", { description: err.message })
        setTransactions(prev => prev.map(t =>
          t.transactionId === txn.transactionId ? { ...t, status: 'failed' } : t
        ))
      }
    } finally {
      setPollingTxnId(null)
    }
  }

  const handleDelete = (txnId: string) => {
    if (confirm("Remove this transaction record?")) {
      setTransactions(prev => prev.filter(t => t.transactionId !== txnId))
      if (selectedTxn?.transactionId === txnId) setSelectedTxn(null);
    }
  }

  const handleViewDetail = (txn: LocalTransaction) => {
    setSelectedTxn(txn);
    setViewMode('detail');
  }

  // --- Render Helpers ---

  const renderDetailView = () => {
    if (!selectedTxn) return null;
    const result = selectedTxn.result;

    if (!result) return <div className="p-8 text-center">No result data found.</div>

    // Assuming first match is primary
    const match = result.matches?.[0] as NadraMatch | undefined;

    if (!match) {
      return (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-dashed">
          <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No Matches Found</h3>
          <p className="text-slate-500 max-w-md text-center">
            The identification process completed successfully, but no matching identity records were found in the database.
          </p>
          <div className="mt-6 border p-4 rounded bg-slate-50 text-sm font-mono">
            Response: {selectedTxn.responseMessage || result.responseStatus.message}
          </div>
        </div>
      )
    }

    const { citizenData, modalityResult } = match;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Card className="border-green-200 shadow-md">
          <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600" />
          <CardHeader className="bg-green-50/30 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl text-green-900">Identification Match Found</CardTitle>
                <CardDescription>Session ID: {match.sessionId} | Ref: {selectedTxn.referenceNumber}</CardDescription>
              </div>
              <Badge className="bg-green-600 hover:bg-green-700">Verified</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Biometrics Column */}
              <div className="shrink-0 flex flex-col items-center space-y-4">
                <div className="w-[180px] h-[220px] bg-slate-200 rounded-lg border shadow-sm overflow-hidden relative">
                  {citizenData.photograph ? (
                    <img
                      src={`data:image/jpeg;base64,${citizenData.photograph}`}
                      alt="Citizen"
                      className="w-full h-full object-contain bg-slate-900"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <Camera className="w-10 h-10" />
                    </div>
                  )}
                </div>

                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded border text-sm">
                    <span className="text-xs font-semibold text-slate-500">Face</span>
                    <Badge variant={modalityResult.facialResult === "MATCH" ? "default" : "secondary"}>
                      {modalityResult.facialResult}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded border text-sm">
                    <span className="text-xs font-semibold text-slate-500">Fingers</span>
                    <Badge variant={modalityResult.fingerprintResult === "MATCH" ? "default" : "secondary"}>
                      {modalityResult.fingerprintResult}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Data Column */}
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">Citizen Particulars</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500 uppercase">Citizen Number</Label>
                    <div className="text-xl font-mono font-semibold text-slate-900">
                      {match.citizenNumber || selectedTxn.transactionId}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500 uppercase">Gender</Label>
                    <div className="text-lg text-slate-900 capitalize">{citizenData.gender}</div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500 uppercase">Name (Native)</Label>
                    <div className="text-xl font-serif text-right text-slate-900" style={{ direction: 'rtl' }}>{citizenData.name}</div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500 uppercase">Father Name (Native)</Label>
                    <div className="text-xl font-serif text-right text-slate-900" style={{ direction: 'rtl' }}>{citizenData.fatherName}</div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500 uppercase">Name (English)</Label>
                    <div className="text-lg text-slate-900">{citizenData.name || '-'}</div>
                    {/* Note: nameEnglish handling depends on API providing it or just relying on native */}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500 uppercase">Father Name (English)</Label>
                    <div className="text-lg text-slate-900">{citizenData.fatherNameEnglish}</div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500 uppercase">Date of Birth</Label>
                    <div className="text-lg text-slate-900">{citizenData.dateOfBirth}</div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500 uppercase">Mother Name (Native)</Label>
                    <div className="text-lg font-serif text-right text-slate-900" style={{ direction: 'rtl' }}>{citizenData.motherName}</div>
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <div className="border-b my-4" />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs text-slate-500 uppercase">Present Address</Label>
                    <div className="text-lg font-serif text-right text-slate-900 bg-slate-50 p-3 rounded" style={{ direction: 'rtl' }}>
                      {citizenData.presentAddress}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs text-slate-500 uppercase">Permanent Address</Label>
                    <div className="text-lg font-serif text-right text-slate-900 bg-slate-50 p-3 rounded" style={{ direction: 'rtl' }}>
                      {citizenData.permanentAddress}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Main Render ---

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      {/* Header Bar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {viewMode === 'list' && 'NADRA Identification Dashboard'}
              {viewMode === 'new' && 'New Biometric Request'}
              {viewMode === 'detail' && 'Match Results'}
            </h1>
            <p className="text-slate-500">
              1:N Biometric Identification System
            </p>
          </div>
        </div>

        {viewMode === 'list' && (
          <Button onClick={handleCreateNew} size="lg" className="shadow-sm">
            + Start New Request
          </Button>
        )}
      </div>

      <div className="max-w-7xl mx-auto">

        {/* LIST MODE */}
        {viewMode === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle>Sent Applications</CardTitle>
              <CardDescription>History of identification requests and status</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-16 text-slate-400 flex flex-col items-center border border-dashed rounded-lg bg-slate-50">
                  <Fingerprint className="w-12 h-12 mb-3 opacity-20" />
                  <p>No transactions found</p>
                  <Button variant="link" onClick={handleCreateNew} className="mt-2">Create your first request</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map(txn => (
                    <div key={txn.transactionId} className="group flex flex-col sm:flex-row items-center p-4 bg-white border rounded-lg hover:shadow-md transition-all gap-6">

                      {/* Thumbnail */}
                      <div className="shrink-0 w-16 h-20 bg-slate-100 rounded overflow-hidden border">
                        {txn.photo ? (
                          <img src={`data:image/jpeg;base64,${txn.photo}`} className="w-full h-full object-contain bg-slate-900" alt="Thumb" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Camera className="w-6 h-6 text-slate-300" /></div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                          <span className="font-semibold text-slate-900">{txn.referenceNumber}</span>
                          <Badge variant={
                            txn.status === 'completed' ? 'default' :
                              txn.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {txn.status}
                          </Badge>
                        </div>
                        <div className="text-xs font-mono text-slate-500 mb-1">ID: {txn.transactionId}</div>
                        <div className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                          <Clock className="w-3 h-3" /> {new Date(txn.submittedAt).toLocaleString()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {txn.status === 'completed' ? (
                          <Button onClick={() => handleViewDetail(txn)} className="bg-green-600 hover:bg-green-700">
                            <Eye className="w-4 h-4 mr-2" />
                            View Result
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={() => handleCheckStatus(txn)}
                            disabled={pollingTxnId === txn.transactionId}
                          >
                            {pollingTxnId === txn.transactionId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                            Check Status
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={() => handleDelete(txn.transactionId)}>
                          <XCircle className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* NEW MODE */}
        {viewMode === 'new' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6 lg:col-span-1">
              <Card>
                <CardHeader><CardTitle className="text-lg">1. Subject Photo</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <div className="relative w-full rounded flex items-center justify-center overflow-hidden">
                    {photo ? (
                      <img src={`data:image/jpeg;base64,${photo}`} className="w-full h-full object-contain" alt="Subject" />
                    ) : (
                      <div className="text-slate-400 text-center">
                        <Camera className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <div>Capture Photo</div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button className="flex-1" onClick={() => setIsCameraOpen(true)}>
                      {photo ? 'Retake Photo' : 'Capture Photo'}
                    </Button>
                    {photo && (
                      <Button variant="destructive" size="icon" onClick={() => setPhoto(null)} title="Clear Photo">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reference</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label>Ref No.</Label>
                  <Input
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="APP-..."
                    className="mt-1"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Fingerprints */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-lg">2. Capture Fingerprints</CardTitle>
                    {Object.keys(fingerprints).length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setFingerprints({})} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2">
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Clear All
                      </Button>
                    )}
                  </div>
                  <Badge variant="outline">{Object.keys(fingerprints).length}/10 Scanned</Badge>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {FINGERS.map(f => (
                      <div key={f.key} className={`flex items-center justify-between p-3 rounded border ${fingerprints[f.key] ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <Fingerprint className={`w-5 h-5 ${fingerprints[f.key] ? 'text-green-600' : 'text-slate-400'}`} />
                          <div className="text-sm font-medium">{f.label}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {fingerprints[f.key] ? (
                            <>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => {
                                const newPrints = { ...fingerprints };
                                delete newPrints[f.key];
                                setFingerprints(newPrints);
                              }} title="Delete Fingerprint">
                                <XCircle className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-green-600 cursor-default hover:bg-transparent hover:text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setActiveFingerKey(f.key)}>
                              Capture
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-slate-50/50 p-6 flex justify-end">
                  <Button size="lg" disabled={isSubmitting} onClick={handleSubmit} className="min-w-[200px]">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</> : "Submit Request"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}

        {/* DETAIL MODE */}
        {viewMode === 'detail' && renderDetailView()}

      </div>

      {/* --- Modals --- */}
      {isCameraOpen && (
        <SmartCameraCapture
          onCapture={(b64) => { setPhoto(b64); setIsCameraOpen(false); }}
          onCancel={() => setIsCameraOpen(false)}
        />
      )}
      <BiometricCaptureModal
        isOpen={!!activeFingerKey}
        onClose={() => setActiveFingerKey(null)}
        onCaptured={(d) => {
          if (activeFingerKey) {
            setFingerprints(p => ({ ...p, [activeFingerKey]: d.wsqBase64 || d.imageBase64 }));
            setActiveFingerKey(null);
          }
        }}
      />
    </div>
  )
}
