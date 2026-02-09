"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  FileText,
  Loader2,
} from "lucide-react"
import { ApplicationDetail } from "./application-detail"

interface AppListItem {
  id: string
  agencyName: string
  managerName: string
  employeeName: string
  storeName: string
  storeAddress: string
  bankName: string
  accountNumber: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  incentiveAmount: number
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "대기",
    variant: "outline" as const,
    className: "border-amber-500 text-amber-600 bg-amber-50",
  },
  approved: {
    label: "승인",
    variant: "outline" as const,
    className: "border-emerald-500 text-emerald-600 bg-emerald-50",
  },
  rejected: {
    label: "반려",
    variant: "outline" as const,
    className: "border-destructive text-destructive bg-destructive/10",
  },
}
const defaultStatusConfig = { label: "대기", className: "border-muted text-muted-foreground bg-muted/50" }
function getStatusConfig(status: string) {
  return statusConfig[status] ?? defaultStatusConfig
}

export function ApplicationList({
  applications,
  onRefresh,
}: {
  applications: AppListItem[]
  onRefresh: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const apps = Array.isArray(applications) ? applications : []
  const filteredApps =
    filterStatus === "all"
      ? apps
      : apps.filter((a) => a.status === filterStatus)

  const handleAction = async (
    id: string,
    action: "approve" | "reject" | "delete"
  ) => {
    setActionLoading(id)
    try {
      if (action === "delete") {
        await fetch(`/api/applications/${id}`, { method: "DELETE" })
      } else {
        await fetch(`/api/applications/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: action === "approve" ? "approved" : "rejected",
          }),
        })
      }
      onRefresh()
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" />
              {"상세 신청 내역"}
            </CardTitle>
            <div className="flex gap-2">
              {[
                { key: "all", label: "전체" },
                { key: "pending", label: "대기" },
                { key: "approved", label: "승인" },
                { key: "rejected", label: "반려" },
              ].map((f) => (
                <Button
                  key={f.key}
                  variant={filterStatus === f.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(f.key)}
                  className="text-xs"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredApps.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {"해당하는 신청 내역이 없습니다."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{"신청일"}</TableHead>
                    <TableHead>{"대리점명"}</TableHead>
                    <TableHead>{"마트명"}</TableHead>
                    <TableHead>{"직원명"}</TableHead>
                    <TableHead>{"담당자"}</TableHead>
                    <TableHead>{"상태"}</TableHead>
                    <TableHead>{"인센티브"}</TableHead>
                    <TableHead className="text-right">
                      {"관리"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => {
                    const config = getStatusConfig(app.status)
                    const isLoading = actionLoading === app.id
                    const incentiveAmount = typeof app.incentiveAmount === "number" ? app.incentiveAmount : 0
                    return (
                      <TableRow key={app.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString("ko-KR") : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {app.agencyName ?? "-"}
                        </TableCell>
                        <TableCell>{app.storeName ?? "-"}</TableCell>
                        <TableCell>{app.employeeName ?? "-"}</TableCell>
                        <TableCell>{app.managerName ?? "-"}</TableCell>
                        <TableCell>
                          <Badge className={config.className}>
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {incentiveAmount.toLocaleString()}
                          {"원"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedId(app.id)}
                              title="상세보기"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {app.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleAction(app.id, "approve")
                                  }
                                  disabled={isLoading}
                                  title="승인"
                                  className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                >
                                  {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleAction(app.id, "reject")
                                  }
                                  disabled={isLoading}
                                  title="반려"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {app.status === "rejected" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleAction(app.id, "delete")
                                }
                                disabled={isLoading}
                                title="삭제"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                {isLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedId && (
        <ApplicationDetail
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onAction={(action) => {
            handleAction(selectedId, action)
            setSelectedId(null)
          }}
        />
      )}
    </>
  )
}
