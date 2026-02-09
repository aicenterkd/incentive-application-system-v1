"use client"

import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Banknote,
  Building2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
  agencyParticipation: Record<string, number>
  totalIncentive: number
}

export function StatsCards({ stats }: { stats: Stats | null }) {
  if (!stats || typeof stats.total !== "number") return null

  const agencyParticipation = stats.agencyParticipation ?? {}
  const agencyCount = Object.keys(agencyParticipation).length

  const totalIncentive = typeof stats.totalIncentive === "number" ? stats.totalIncentive : 0
  const cards = [
    {
      label: "총 신청 건수",
      value: stats.total,
      suffix: "건",
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "승인 대기",
      value: stats.pending,
      suffix: "건",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "승인 완료",
      value: stats.approved,
      suffix: "건",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      label: "반려",
      value: stats.rejected,
      suffix: "건",
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "참여 대리점 수",
      value: agencyCount,
      suffix: "곳",
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "총 지급 인센티브",
      value: totalIncentive.toLocaleString(),
      suffix: "원",
      icon: Banknote,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.bg}`}
              >
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">
                  {card.label}
                </p>
                <p className="text-lg font-bold text-card-foreground">
                  {card.value}
                  <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                    {card.suffix}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
