"use client"

import { useCallback, useState } from "react"
import { Camera, X, FileText } from "lucide-react"

interface FileData {
  name: string
  type: string
  data: string
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
}

export function FileUpload({
  id,
  label,
  description,
  maxFiles,
  accept,
  files,
  onChange,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const remaining = maxFiles - files.length
      const newFiles = Array.from(fileList).slice(0, remaining)

      Promise.all(
        newFiles.map(
          (file) =>
            new Promise<FileData>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => {
                const base64 = reader.result as string
                resolve({
                  name: file.name,
                  type: file.type,
                  data: base64,
                  preview: file.type.startsWith("image/") ? base64 : undefined,
                })
              }
              reader.readAsDataURL(file)
            })
        )
      ).then((newFileData) => {
        onChange([...files, ...newFileData])
      })
    },
    [files, maxFiles, onChange]
  )

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="rounded-xl bg-card p-5 shadow-md">
      <label className="mb-2 block font-semibold text-card-foreground">
        {label}
        <span className="ml-1 text-destructive">*</span>
      </label>
      <p className="mb-3 text-sm text-muted-foreground">{description}</p>

      <div
        className={`relative overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-accent"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        <input
          type="file"
          id={id}
          accept={accept}
          multiple={maxFiles > 1}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ""
          }}
        />
        <div className="flex cursor-pointer flex-col items-center gap-2 px-4 py-6">
          <Camera className="h-8 w-8 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {"사진 선택 (카메라/갤러리 최대 "}
            {maxFiles}
            {"장)"}
          </span>
          <span className="text-xs text-muted-foreground">
            {"클릭 또는 드래그하여 업로드"}
          </span>
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
