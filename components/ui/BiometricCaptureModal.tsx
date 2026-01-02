"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { encodeToWSQ, createWSQInfo, type WSQResult } from "@/lib/utils/wsq-encoder"
import axios from "axios"

type CaptureResponse = {
  ErrorCode: number
  Manufacturer?: string
  Model?: string
  SerialNumber?: string
  ImageWidth?: number
  ImageHeight?: number
  ImageDPI?: number
  ImageQuality?: number
  NFIQ?: number
  ImageDataBase64?: string
  BMPBase64?: string
  TemplateBase64?: string
  ISOTemplateBase64?: string
  WSQImageSize?: number
  WSQImage?: string
}

interface BiometricCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onCaptured: (data: {
    imageBase64: string
    templateBase64?: string
    imageDpi?: number
    imageQuality?: number
    wsqBase64?: string
    wsqSize?: number
    deviceModel?: string
    serial?: string
  }) => void
  onSkip?: () => void // Optional skip callback
  // Optional license and options; tuned for SecuGEN HU20A defaults from BIOMETRIC_README
  endpoint?: string // e.g. https://localhost:8000/SGIFPCapture
}

export default function BiometricCaptureModal({ isOpen, onClose, onCaptured, endpoint = "https://localhost:8443/SGIFPCapture" }: BiometricCaptureModalProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [wsqPreview, setWsqPreview] = useState<string | null>(null)
  const [wsqResult, setWsqResult] = useState<WSQResult | null>(null)
  const [wsqEncoding, setWsqEncoding] = useState(false)
  const [details, setDetails] = useState<Partial<CaptureResponse> | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setPreview(null)
      setWsqPreview(null)
      setWsqResult(null)
      setWsqEncoding(false)
      setDetails(null)
      setError(null)
      setConnectionStatus(null)
    } else {
      // testConnection()S
    }
  }, [isOpen])

  // const testConnection = async () => {
  //   try {
  //     const response = await fetch(endpoint + "?Timeout=3000", {
  //       method: "GET",
  //     })
  //     if (response.ok) {
  //       const data = await response.json()
  //       if (data.ErrorCode === 0) {
  //         console.log("✅ Service ready")
  //       }
  //     }
  //   } catch (e) {
  //     setConnectionStatus("❌ Connection failed")
  //   }
  // }

  const startCapture = async () => {
    setIsCapturing(true)
    setError(null)
    try {
      // Hardcoded payload as requested
      const payload = "Timeout=10000&Quality=50&licstr=&templateFormat=ISO&imageWSQRate=0.75";

      const apiClient = axios.create({
        baseURL: endpoint,
        timeout: 12000,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      })
      const res = await apiClient.post(endpoint, payload);
      const data = (await res.data) as CaptureResponse

      console.log("=== COMPLETE CAPTURE RESPONSE ===")
      console.log("Full Response:", data)
      console.log("Error Code:", data.ErrorCode)
      console.log("Device:", data.Model, "Serial:", data.SerialNumber)
      console.log("Image Quality:", data.ImageQuality, "NFIQ:", data.NFIQ)
      console.log("=== END RESPONSE ===")

      if (typeof data.ErrorCode !== "number") {
        throw new Error("Invalid response from capture service")
      }

      if (data.ErrorCode === 54) {
        setError("⚠️ Timeout during WSQ processing. Image captured successfully.")
      } else if (data.ErrorCode !== 0) {
        throw new Error(`Capture failed (code ${data.ErrorCode})`)
      }

      const imgB64 = data.ImageDataBase64 || data.BMPBase64 || ""
      setPreview(imgB64 ? `data:image/bmp;base64,${imgB64}` : null)

      // Handle WSQ image if available from service, otherwise encode client-side
      if (data.WSQImage) {
        setWsqPreview(data.WSQImage)
        console.log("=== SERVICE WSQ DATA ===")
        console.log("WSQ Size:", data.WSQImageSize, "bytes")
        console.log("WSQ Base64 Length:", data.WSQImage.length, "characters")
        console.log("WSQ Encoded Data:")
        console.log(data.WSQImage)
        console.log("=== END SERVICE WSQ ===")
      } else {
        console.log("⚠️ WSQ not available from service, encoding client-side...")
        await encodeClientSideWSQ(imgB64)
      }

      setDetails(data)
    } catch (e: unknown) {
      let msg = "Failed to start capture"
      if (e instanceof Error) {
        if (e.message.includes("Failed to fetch") || e.message.includes("NetworkError")) {
          msg = "Cannot connect to SecuGen WebAPI. Please ensure:\n• SgiBioSrv service is running\n• Device is connected\n• Browser allows localhost connections"
        } else if (e.message.includes("HTTP 404")) {
          msg = "SecuGen WebAPI not found. Please install SgiBioSrv from https://webapi.secugen.com/"
        } else if (e.message.includes("HTTP 500")) {
          msg = "SecuGen WebAPI error. Check device connection and drivers."
        } else {
          msg = e.message
        }
      }
      setError(msg)
    } finally {
      setIsCapturing(false)
    }
  }

  const encodeClientSideWSQ = async (bmpBase64: string) => {
    if (!bmpBase64) return

    setWsqEncoding(true)
    try {
      console.log("Starting client-side WSQ encoding...")
      const wsqResult = await encodeToWSQ(bmpBase64, 15)

      setWsqResult(wsqResult)
      setWsqPreview(wsqResult.wsqBase64)

      const wsqInfo = createWSQInfo(wsqResult)
      console.log("=== CLIENT-SIDE WSQ ENCODING ===")
      console.log("WSQ Header:", wsqInfo.header)
      console.log("Original Size:", wsqInfo.stats.originalSize, "bytes")
      console.log("Compressed Size:", wsqInfo.stats.compressedSize, "bytes")
      console.log("Compression Ratio:", wsqInfo.stats.compressionRatio + ":1")
      console.log("Quality:", wsqInfo.stats.quality + "%")
      console.log("Space Savings:", wsqInfo.stats.savings)
      console.log("WSQ Base64 Length:", wsqResult.wsqBase64.length, "characters")
      console.log("WSQ Encoded Data:")
      console.log(wsqResult.wsqBase64)
      console.log("=== END CLIENT WSQ ===")
    } catch (error) {
      console.error("Client-side WSQ encoding failed:", error)
      setError(`WSQ encoding failed: ${error}`)
    } finally {
      setWsqEncoding(false)
    }
  }

  const handleUse = () => {
    if (!details) return
    const img = details.ImageDataBase64 || details.BMPBase64 || ""
    onCaptured({
      imageBase64: img,
      templateBase64: details.TemplateBase64,
      imageDpi: details.ImageDPI,
      imageQuality: details.ImageQuality,
      wsqBase64: wsqPreview || details.WSQImage,
      wsqSize: wsqResult?.compressedSize || details.WSQImageSize,
      deviceModel: details.Model,
      serial: details.SerialNumber,
    })
    onClose()
  }

  const downloadWSQ = () => {
    if (!wsqPreview) return

    try {
      const byteCharacters = atob(wsqPreview)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/octet-stream' })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const serial = details?.SerialNumber?.trim() || 'unknown'
      link.download = `fingerprint_${serial}_${timestamp}.wsq`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log(`WSQ file downloaded: ${link.download}`)
    } catch (error) {
      console.error('Failed to download WSQ file:', error)
      setError('Failed to download WSQ file')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-2xl mx-4">
        <Card className="shadow-none border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Fingerprint Capture</CardTitle>
            <Button variant="ghost" onClick={onClose} disabled={isCapturing}>✕</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col items-center">
                <div className=" border rounded-md bg-gray-50 flex items-center justify-center overflow-hidden">
                  {preview ? (
                    <img src={preview} alt="Fingerprint" className="object-contain" />
                  ) : (
                    <span className="text-sm text-gray-500">No image captured</span>
                  )}
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <Button onClick={startCapture} disabled={isCapturing || wsqEncoding}>
                    {isCapturing ? "Capturing..." : details?.ErrorCode === 54 ? "Retry for WSQ" : "Capture"}
                  </Button>
                  <Button variant="secondary" onClick={handleUse} disabled={!details || wsqEncoding || !preview}>
                    {wsqEncoding ? "Encoding WSQ..." : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


