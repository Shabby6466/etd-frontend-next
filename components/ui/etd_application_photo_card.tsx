"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ChevronRight, Camera, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/stores/auth-store"
import BiometricCaptureModal from "@/components/ui/BiometricCaptureModal"
import { SmartCameraCapture } from "@/components/ui/SmartCameraCapture"
import { showNotification } from "@/lib/utils/notifications"
import Image from "next/image"

type Props = {
  title?: string
  initialCitizenNumber?: string
  initialImageBase64?: string | null
  initialBiometricData?: {
    imageBase64: string
    templateBase64?: string
    imageDpi?: number
    imageQuality?: number
    wsqBase64?: string
    wsqSize?: number
    deviceModel?: string
    serial?: string
  } | null
  imgWidth?: number
  imgHeight?: number
  maxFileSizeMB?: number
  onGetData?: (citizenNumber: string) => void
  onDelete?: () => void
  onImageChange?: (base64: string | null) => void
  onBiometricChange?: (data: any) => void
  onNavigate?: (citizenNumber: string, imageBase64: string | null, biometricData: any) => void
}

export default function ETDApplicationPhotoCard({
  title = "Emergency Travel Document",
  initialCitizenNumber = "",
  initialImageBase64 = null,
  initialBiometricData = null,
  imgWidth = 140,
  imgHeight = 140,
  maxFileSizeMB = 5,
  onGetData,
  onDelete,
  onImageChange,
  onBiometricChange,
  onNavigate,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const fingerprintFileRef = useRef<HTMLInputElement | null>(null)
  const [citizen, setCitizen] = useState(initialCitizenNumber)
  const [photoB64, setPhotoB64] = useState<string | null>(initialImageBase64)
  const [biometricData, setBiometricData] = useState<any>(initialBiometricData)
  const [loading, setLoading] = useState(false)
  const [showSmartCamera, setShowSmartCamera] = useState(false)
  const [showBiometricModal, setShowBiometricModal] = useState(false)
  const { user } = useAuthStore()
  const router = useRouter()

  // Handle smart camera capture
  const handleSmartCameraCapture = (imageBase64: string) => {
    setPhotoB64(imageBase64)
    onImageChange?.(imageBase64)
    setShowSmartCamera(false)
    showNotification.success("Photo captured successfully")
  }

  // Handle biometric capture
  const handleBiometricCapture = (data: {
    imageBase64: string
    templateBase64?: string
    imageDpi?: number
    imageQuality?: number
    wsqBase64?: string
    wsqSize?: number
    deviceModel?: string
    serial?: string
  }) => {
    setBiometricData(data)
    onBiometricChange?.(data)
    setShowBiometricModal(false)
    showNotification.success("Fingerprint captured successfully")
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showNotification.error("Please select a valid image file")
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification.error("File size must be less than 5MB")
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      setPhotoB64(base64)
      onImageChange?.(base64)
      showNotification.success("Photo uploaded successfully")
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleFingerprintUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification.error("File size must be less than 5MB")
      event.target.value = ''
      return
    }

    const isWSQ = file.name.toLowerCase().endsWith('.wsq')
    const isTXT = file.name.toLowerCase().endsWith('.txt')

    const reader = new FileReader()
    reader.onload = () => {
      let base64 = ""

      if (isTXT) {
        // For TXT files, use the content directly as base64 string (clean up whitespace/newlines)
        base64 = (reader.result as string).trim().replace(/[\r\n\s]/g, '')
      } else {
        // For other files (WSQ, images), read as base64 (strip data URL prefix)
        const result = reader.result as string
        base64 = result.includes(',') ? result.split(',')[1] : result
      }

      const uploadedData = {
        imageBase64: base64,
        wsqBase64: (isWSQ || isTXT) ? base64 : undefined,
        deviceModel: 'File Upload',
        serial: file.name,
        isUpload: true,
        fileType: (isWSQ || isTXT) ? 'wsq' : 'image'
      }

      setBiometricData(uploadedData)
      onBiometricChange?.(uploadedData)
      showNotification.success(`Fingerprint uploaded: ${file.name}`)
    }

    if (isTXT) {
      reader.readAsText(file)
    } else {
      reader.readAsDataURL(file)
    }
    event.target.value = ''
  }

  const handleGetData = () => {
    console.log("ETDApplicationPhotoCard handleGetData called with citizen:", citizen)
    if (!/^\d{13}$/.test(citizen)) {
      showNotification.error("Please enter a valid 13-digit citizen ID")
      return
    }

    console.log("Proceeding with get data - citizen:", citizen, "image:", photoB64 ? "has image" : "no image", "biometric:", biometricData ? "has biometric" : "no biometric")
    onNavigate?.(citizen, photoB64, biometricData)
    onGetData?.(citizen)
  }

  return (
    <>
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-center text-2xl font-bold">{title}</CardTitle>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Image Capture Section */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <Label className="text-lg font-semibold mb-4 block">
              Photograph
            </Label>

            <div className="mb-4">
              <Button
                type="button"
                onClick={() => setShowSmartCamera(true)}
                className="w-full flex items-center justify-center gap-2"
                variant="outline"
              >
                <Camera className="w-4 h-4" />
                Capture Photo with Smart Camera
              </Button>
              <Button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 mt-2"
                variant="outline"
              >
                <Upload className="w-4 h-4" />
                Upload Photo
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Image Display */}
            {photoB64 && (
              <div className="flex justify-center mb-4">
                <div className="bg-white p-2 rounded border">
                  <Image
                    src={`data:image/jpeg;base64,${photoB64}`}
                    alt="Captured Photo"
                    width={128}
                    height={160}
                    className="object-cover rounded"
                  />
                </div>
              </div>
            )}

            {!photoB64 && (
              <p className="text-sm text-gray-600 text-center">
                No image captured. Click the button above to capture a photo.
              </p>
            )}
          </div>

          {/* Biometric Capture Section */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <Label className="text-lg font-semibold mb-4 block">
              Fingerprint Capture
            </Label>

            <div className="mb-4 space-y-2">
              <Button
                type="button"
                onClick={() => setShowBiometricModal(true)}
                variant="outline"
                className="w-full flex items-center gap-2 justify-center"
              >
                {biometricData ? "Recapture Fingerprint" : "Capture Fingerprint"}
              </Button>
              <Button
                type="button"
                onClick={() => fingerprintFileRef.current?.click()}
                variant="outline"
                className="w-full flex items-center gap-2 justify-center"
              >
                <Upload className="w-4 h-4" />
                Upload Fingerprint File ({'<'}WSQ)
              </Button>
              <input
                ref={fingerprintFileRef}
                type="file"
                accept=".wsq,.bmp,.png,.jpg,.jpeg,.txt"
                onChange={handleFingerprintUpload}
                className="hidden"
              />
            </div>

            {/* Fingerprint Display */}
            {biometricData && (
              <div className="flex justify-center mb-4">
                <div className="bg-white p-2 rounded border">
                  <img
                    src={`data:image/bmp;base64,${biometricData.imageBase64}`}
                    alt="Captured Fingerprint"
                    width={128}
                    height={160}
                    className="object-contain rounded"
                  />
                </div>
              </div>
            )}

            {!biometricData && (
              <p className="text-sm text-gray-600 text-center">
                No fingerprint captured. Click the button above to capture biometric data.
              </p>
            )}
          </div>

          {/* Citizen Number Input */}
          <div className="mt-6">
            <Label htmlFor="citizen-number" className="text-sm">
              Citizen Number
            </Label>
            <Input
              id="citizen-number"
              placeholder="Enter 13-digit citizen ID"
              value={citizen}
              onChange={(e) => setCitizen(e.target.value)}
              maxLength={13}
              pattern="\d{13}"
              inputMode="numeric"
              className={cn(
                "mt-1 h-11 rounded-xl",
                "bg-white"
              )}
            />
          </div>

          {/* Footer bar */}
          <div className="mt-8 -mb-2 -mx-6 border-t px-6 pt-4 flex justify-end">
            <Button
              type="button"
              onClick={handleGetData}
              disabled={!/^\d{13}$/.test(citizen)}
            >
              Get Data
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Smart Camera Capture Modal */}
      {showSmartCamera && (
        <SmartCameraCapture
          onCapture={handleSmartCameraCapture}
          onCancel={() => setShowSmartCamera(false)}
        />
      )}

      {/* Biometric Capture Modal */}
      <BiometricCaptureModal
        isOpen={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        onCaptured={handleBiometricCapture}
        endpoint="https://localhost:8443/SGIFPCapture"
      />
    </>
  )
}