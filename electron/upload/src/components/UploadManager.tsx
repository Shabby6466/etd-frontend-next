import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { showNotification } from "@/lib/utils/notifications"
import { applicationsAPI } from "../lib/api/applications"
import { fileServiceAPI } from "../lib/api/fileService"
import { parseXMLToApplicationData } from "../lib/utils/xmlParser"
import { FileText, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"

interface FileUploadStatus {
    filename: string
    status: "pending" | "uploading" | "success" | "error"
    error?: string
}

export function UploadManager() {
    const [files, setFiles] = useState<FileUploadStatus[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [fileCount, setFileCount] = useState(0)

    const fetchFiles = async () => {
        setIsLoading(true)
        try {
            const { files: fileList, count } = await fileServiceAPI.getFiles()
            setFileCount(count)
            setFiles(
                fileList.map((file) => ({
                    filename: file.filename,
                    status: "pending" as const,
                }))
            )
        } catch (error: any) {
            showNotification.error("Failed to fetch files from xml_draft folder")
            console.error("Error fetching files:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchFiles()
    }, [])

    const uploadFile = async (filename: string, index: number): Promise<boolean> => {
        try {
            // Update status to uploading
            setFiles((prev) =>
                prev.map((f, i) => (i === index ? { ...f, status: "uploading" } : f))
            )

            // Get file content from server
            const content = await fileServiceAPI.getFileContent(filename)

            // Parse XML
            const applicationData = parseXMLToApplicationData(content)
            if (!applicationData) {
                throw new Error("Failed to parse XML file")
            }

            // Upload to API
            await applicationsAPI.createTempApplication(applicationData)

            // Mark file as complete (move to xml_complete folder)
            await fileServiceAPI.markAsComplete(filename)

            // Update status to success
            setFiles((prev) =>
                prev.map((f, i) => (i === index ? { ...f, status: "success" } : f))
            )

            return true
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || "Upload failed"

            // Update status to error
            setFiles((prev) =>
                prev.map((f, i) =>
                    i === index ? { ...f, status: "error", error: errorMessage } : f
                )
            )

            return false
        }
    }

    const handleUploadAll = async () => {
        if (files.length === 0) {
            showNotification.error("No files to upload")
            return
        }

        setIsUploading(true)

        let successCount = 0
        let errorCount = 0

        // Upload files sequentially
        for (let i = 0; i < files.length; i++) {
            setCurrentIndex(i)
            const success = await uploadFile(files[i].filename, i)
            if (success) {
                successCount++
            } else {
                errorCount++
            }

            // Small delay between uploads
            await new Promise((resolve) => setTimeout(resolve, 500))
        }

        setIsUploading(false)
        setCurrentIndex(0)

        // Show summary notification
        if (errorCount === 0) {
            showNotification.success(`Successfully uploaded ${successCount} file(s)`)
            // Refresh file list after successful upload
            setTimeout(() => fetchFiles(), 1000)
        } else {
            showNotification.error(
                `Uploaded ${successCount} file(s), ${errorCount} failed`
            )
        }
    }

    const handleClear = async () => {
        await fetchFiles()
    }

    const getStatusIcon = (status: FileUploadStatus["status"]) => {
        switch (status) {
            case "pending":
                return <FileText className="h-4 w-4 text-gray-400" />
            case "uploading":
                return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            case "success":
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case "error":
                return <XCircle className="h-4 w-4 text-red-500" />
        }
    }

    return (
        <Card className="rounded-2xl card-glow">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center justify-between">
                    <span>XML File Upload</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchFiles}
                        disabled={isLoading || isUploading}
                        className="rounded-xl"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div>
                            <p className="text-sm font-medium text-blue-900">Files in Queue</p>
                            <p className="text-2xl font-bold text-blue-600">{fileCount}</p>
                        </div>
                        <FileText className="h-12 w-12 text-blue-400 opacity-50" />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleUploadAll}
                            disabled={isUploading || files.length === 0 || isLoading}
                            className="rounded-xl text-white flex-1"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading {currentIndex + 1}/{files.length}
                                </>
                            ) : (
                                <>Upload All</>
                            )}
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={handleClear}
                            disabled={isUploading || isLoading}
                            className="rounded-xl"
                        >
                            Clear
                        </Button>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-700">
                            Upload Progress
                        </h3>
                        <div className="max-h-96 overflow-y-auto space-y-2 border rounded-xl p-3">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {getStatusIcon(file.status)}
                                        <span className="text-sm truncate">{file.filename}</span>
                                    </div>
                                    {file.error && (
                                        <span className="text-xs text-red-500 ml-2">{file.error}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {files.length === 0 && !isLoading && (
                    <div className="text-center py-8 text-gray-400">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No files in xml_draft folder</p>
                    </div>
                )}

                {isLoading && (
                    <div className="text-center py-8 text-gray-400">
                        <Loader2 className="h-12 w-12 mx-auto mb-2 animate-spin" />
                        <p className="text-sm">Loading files...</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
