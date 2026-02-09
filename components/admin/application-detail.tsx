"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
  User,
  Building2,
  Banknote,
  ImageIcon,
  Trash2,
} from "lucide-react"

interface FileAttachment {
  name: string
  type: string
  data: string
}

interface ApplicationFull {
  id: string
  agencyName: string
  managerName: string
  employeeName: string
  storeName: string
  storeAddress: string
  bankName: string
  accountNumber: string
  productPhotos: FileAttachment[]
  storeSignboard: FileAttachment[]
  transactionDocs: FileAttachment[]
  status: "pending" | "approved" | "rejected"
  createdAt: string
  incentiveAmount: number
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "승인 대기",
    className: "border-amber-500 text-amber-600 bg-amber-50",
  },
  approved: {
    label: "승인 완료",
    className: "border-emerald-500 text-emerald-600 bg-emerald-50",
  },
  rejected: {
    label: "반려",
    className: "border-destructive text-destructive bg-destructive/10",
  },
}

const defaultStatus = {
  label: "대기",
  className: "border-muted-foreground/50 text-muted-foreground bg-muted/50",
}

function getStatusConfig(status: string | undefined) {
  return status && statusConfig[status] ? statusConfig[status] : defaultStatus
}

export function ApplicationDetail({
  id,
  onClose,
  onAction,
}: {
  id: string
  onClose: () => void
  onAction: (action: "approve" | "reject" | "delete") => void
}) {
  const [app, setApp] = useState<ApplicationFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/applications/${id}`)
      .then(async (r) => {
        const text = await r.text()
        try {
          return JSON.parse(text)
        } catch {
          console.error("[v0] Response is not valid JSON:", text.slice(0, 100))
          return { error: "Invalid response" }
        }
      })
      .then((data) => {
        if (data.error) {
          setApp(null)
        } else {
          setApp(data)
        }
        setLoading(false)
      })
      .catch(() => {
        setApp(null)
        setLoading(false)
      })
  }, [id])

  const renderPhotos = (
    title: string,
    files: FileAttachment[]
  ) => {
    if (!files || files.length === 0) return null
    return (
      <div>
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-card-foreground">
          <ImageIcon className="h-4 w-4 text-primary" />
          {title}
        </h4>
        <div className="flex flex-wrap gap-3">
          {files.map((file, i) => (
            <button
              key={`${file.name}-${i}`}
              type="button"
              onClick={() => {
                if (file.data) setLightboxSrc(file.data)
              }}
              className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-lg border-2 border-border transition hover:border-primary"
            >
              {file.type?.startsWith("image/") && file.data ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.data || "/placeholder.svg"}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                  {file.name || "PDF"}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition group-hover:bg-foreground/20">
                <span className="text-sm font-bold text-card opacity-0 transition group-hover:opacity-100">
                  {"확대"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
        onKeyDown={() => {}}
        role="dialog"
        aria-modal="true"
      >
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card p-5">
            <h3 className="text-lg font-bold text-card-foreground">
              {"신청서 상세 정보"}
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : app ? (
            <div className="space-y-6 p-5">
              {/* Status & Date */}
              <div className="flex items-center justify-between">
                <Badge className={getStatusConfig(app.status).className}>
                  {getStatusConfig(app.status).label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(app.createdAt).toLocaleString("ko-KR")}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg bg-secondary p-3">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {"대리점명"}
                    </p>
                    <p className="font-semibold text-secondary-foreground">
                      {app.agencyName}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-secondary p-3">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {"본사 담당자"}
                    </p>
                    <p className="font-semibold text-secondary-foreground">
                      {app.managerName}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-secondary p-3">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {"대리점 직원"}
                    </p>
                    <p className="font-semibold text-secondary-foreground">
                      {app.employeeName}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-secondary p-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {"마트 상호"}
                    </p>
                    <p className="font-semibold text-secondary-foreground">
                      {app.storeName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3 rounded-lg bg-secondary p-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {"마트 주소"}
                  </p>
                  <p className="font-semibold text-secondary-foreground">
                    {app.storeAddress}
                  </p>
                </div>
              </div>

              {/* Bank Info */}
              <div className="flex items-start gap-3 rounded-lg bg-accent p-3">
                <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {"계좌 정보"}
                  </p>
                  <p className="font-semibold text-accent-foreground">
                    {app.bankName}
                    {" "}
                    {app.accountNumber}
                  </p>
                </div>
              </div>

              {/* Incentive */}
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {"인센티브 금액"}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {app.incentiveAmount.toLocaleString()}
                  {"원"}
                </p>
              </div>

              {/* Attachments */}
              {renderPhotos(
                "제품 진열 사진",
                app.productPhotos
              )}
              {renderPhotos(
                "마트 외부 간판",
                app.storeSignboard
              )}
              {renderPhotos(
                "거래명세서",
                app.transactionDocs
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 border-t pt-4">
                {app.status === "pending" && (
                  <>
                    <Button
                      className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => onAction("approve")}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {"승인"}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => onAction("reject")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {"반려"}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onAction("delete")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {"삭제"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              {"신청서를 불러올 수 없습니다."}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/80 p-4"
          onClick={() => setLightboxSrc(null)}
          onKeyDown={() => {}}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card text-card-foreground shadow-lg"
            onClick={() => setLightboxSrc(null)}
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc || "/placeholder.svg"}
            alt="확대 보기"
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </>
  )
}
