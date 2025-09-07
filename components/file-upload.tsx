"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, type File, X, ImageIcon, FileText, Download } from "lucide-react"

interface FileUploadProps {
  onFilesChange?: (files: File[]) => void
  maxFiles?: number
  maxSize?: number // in MB
  acceptedTypes?: string[]
  showPreview?: boolean
}

interface UploadedFile {
  file: File
  preview?: string
  progress: number
  status: "uploading" | "completed" | "error"
}

export function FileUpload({
  onFilesChange,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ["image/*", "application/pdf", ".doc", ".docx"],
  showPreview = true,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.slice(0, maxFiles - uploadedFiles.length).map((file) => ({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        progress: 0,
        status: "uploading" as const,
      }))

      setUploadedFiles((prev) => [...prev, ...newFiles])

      // Simulate upload progress
      newFiles.forEach((uploadFile, index) => {
        const interval = setInterval(() => {
          setUploadedFiles((prev) =>
            prev.map((f) => (f.file === uploadFile.file ? { ...f, progress: Math.min(f.progress + 10, 100) } : f)),
          )
        }, 200)

        setTimeout(() => {
          clearInterval(interval)
          setUploadedFiles((prev) =>
            prev.map((f) => (f.file === uploadFile.file ? { ...f, progress: 100, status: "completed" } : f)),
          )
        }, 2000)
      })

      onFilesChange?.(acceptedFiles)
    },
    [uploadedFiles.length, maxFiles, onFilesChange],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - uploadedFiles.length,
    maxSize: maxSize * 1024 * 1024,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
  })

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles((prev) => {
      const updated = prev.filter((f) => f.file !== fileToRemove)
      onFilesChange?.(updated.map((f) => f.file))
      return updated
    })
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-600" />
    }
    return <FileText className="h-5 w-5 text-gray-600" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {uploadedFiles.length < maxFiles && (
        <Card>
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-blue-600 font-medium">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium mb-2">Drag & drop files here, or click to select</p>
                  <p className="text-sm text-gray-500">
                    Max {maxFiles} files, up to {maxSize}MB each
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Supported: Images, PDF, DOC, DOCX</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">
            Uploaded Files ({uploadedFiles.length}/{maxFiles})
          </h4>

          {uploadedFiles.map((uploadFile, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  {/* File Preview/Icon */}
                  <div className="flex-shrink-0">
                    {showPreview && uploadFile.preview ? (
                      <img
                        src={uploadFile.preview || "/placeholder.svg"}
                        alt={uploadFile.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        {getFileIcon(uploadFile.file)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{uploadFile.file.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            uploadFile.status === "completed"
                              ? "default"
                              : uploadFile.status === "error"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {uploadFile.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.file)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>{formatFileSize(uploadFile.file.size)}</span>
                      {uploadFile.status === "completed" && (
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {uploadFile.status === "uploading" && <Progress value={uploadFile.progress} className="h-2" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
