"use client"

import { useCallback, useState } from "react"
import { Camera, X, FileText, Loader2 } from "lucide-react"
import { uploadFileFromBrowser, deleteFileFromBrowser, type FileCategory } from "@/lib/supabase/client-storage"

interface FileData {
  name: string
  type: string
  data: string // Now contains storage URL instead of base64
  preview?: string
}

interface FileUploadProps {
  id: string
  label: string
  description: string
  maxFiles: number
  accept: string
  files: FileData[]
  onChange: (files: FileData[]) => void
  maxSizeMB?: number // 파일 크기 제한 (MB)
  category: FileCategory // Supabase Storage bucket category
}

export function FileUpload({
  id,
  label,
  description,
  maxFiles,
  accept,
  files,
  onChange,
  maxSizeMB = 10, // 기본값 10MB
  category,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      setError(null)
      setUploading(true)

      try {
        const remaining = maxFiles - files.length
        const newFiles = Array.from(fileList).slice(0, remaining)

        // 파일 크기 검증
        const maxSizeBytes = maxSizeMB * 1024 * 1024
        const oversizedFiles = newFiles.filter(file => file.size > maxSizeBytes)

        if (oversizedFiles.length > 0) {
          setError(`파일 크기는 ${maxSizeMB}MB를 초과할 수 없습니다.`)
          return
        }

        // Upload files to Supabase Storage and get preview URLs
        const uploadPromises = newFiles.map(async (file) => {
          // Upload to Supabase Storage
          const uploaded = await uploadFileFromBrowser(file, category)

          // Generate preview for images
          let preview: string | undefined
          if (file.type.startsWith("image/")) {
            preview = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.readAsDataURL(file)
            })
          }

          return {
            name: uploaded.fileName,
            type: uploaded.fileType,
            data: uploaded.storageUrl, // Storage URL instead of base64
            preview,
          }
        })

        const newFileData = await Promise.all(uploadPromises)
        onChange([...files, ...newFileData])
      } catch (err) {
        setError(err instanceof Error ? err.message : '파일 업로드 중 오류가 발생했습니다.')
        console.error('File upload error:', err)
      } finally {
        setUploading(false)
      }
    },
    [files, maxFiles, onChange, maxSizeMB, category]
  )

  const removeFile = async (index: number) => {
    const fileToRemove = files[index]

    // Delete from Supabase Storage
    try {
      await deleteFileFromBrowser(category, fileToRemove.data)
    } catch (err) {
      console.error('Failed to delete file from storage:', err)
      // Continue with removal from UI even if storage deletion fails
    }

    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="rounded-xl bg-card p-5 shadow-md">
      <label className="mb-2 block font-semibold text-card-foreground">
        {label}
        <span className="ml-1 text-destructive">*</span>
      </label>
      <p className="mb-3 text-sm text-muted-foreground">{description}</p>

      {error && (
        <div className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div
        className={`relative overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          uploading ? "border-primary bg-accent opacity-50 pointer-events-none" :
          isDragging
            ? "border-primary bg-accent"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          if (!uploading) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (!uploading) handleFiles(e.dataTransfer.files)
        }}
      >
        <input
          type="file"
          id={id}
          accept={accept}
          multiple={maxFiles > 1}
          disabled={uploading}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ""
          }}
        />
        <div className="flex cursor-pointer flex-col items-center gap-2 px-4 py-6">
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-sm font-medium text-foreground">
                {"업로드 중..."}
              </span>
            </>
          ) : (
            <>
              <Camera className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {"사진 선택 (카메라/갤러리 최대 "}
                {maxFiles}
                {"장)"}
              </span>
              <span className="text-xs text-muted-foreground">
                {"클릭 또는 드래그하여 업로드"}
              </span>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-border"
            >
              {file.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.preview || "/placeholder.svg"}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-destructive text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
