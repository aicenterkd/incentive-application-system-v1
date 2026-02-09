"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StatsCards } from "@/components/admin/stats-cards"
import { AgencyTable } from "@/components/admin/agency-table"
import { ApplicationList } from "@/components/admin/application-list"
import {
  Download,
  RefreshCw,
  ArrowLeft,
  Shield,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react"
import Link from "next/link"

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
  agencyParticipation: Record<string, number>
  totalIncentive: number
}

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

export default function AdminPage() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [applications, setApplications] = useState<AppListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [loginId, setLoginId] = useState("")
  const [loginPw, setLoginPw] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  // Check auth on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth")
        const data = await res.json()
        if (data.authenticated) {
          setAuthenticated(true)
        }
      } catch {
        // ignore
      } finally {
        setAuthChecking(false)
      }
    }
    checkAuth()
  }, [])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setLoginLoading(true)
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginId, password: loginPw }),
      })
      const data = await res.json()
      if (data.success) {
        setAuthenticated(true)
        setLoginId("")
        setLoginPw("")
        setLoginError("")
      } else {
        setLoginError(data.error || "인증에 실패했습니다.")
      }
    } catch {
      setLoginError("서버 오류가 발생했습니다.")
    } finally {
      setLoginLoading(false)
    }
  }

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const [statsRes, appsRes] = await Promise.all([
        fetch("/api/applications?type=stats"),
        fetch("/api/applications"),
      ])
      const statsData = await statsRes.json()
      const appsData = await appsRes.json()
      const isStatsValid =
        statsData &&
        typeof statsData.total === "number" &&
        typeof statsData.pending === "number" &&
        statsData.agencyParticipation &&
        typeof statsData.agencyParticipation === "object"
      setStats(isStatsValid ? statsData : null)
      setApplications(Array.isArray(appsData) ? appsData : [])
    } catch {
      setStats(null)
      setApplications([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (authenticated) {
      fetchData()
    }
  }, [fetchData, authenticated])

  const handleExcelDownload = async () => {
    try {
      const res = await fetch("/api/applications/excel")
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || "Excel 다운로드에 실패했습니다.")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `incentive_report_${new Date().toISOString().split("T")[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Excel 다운로드 중 오류가 발생했습니다.")
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" })
    router.replace("/")
  }

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            {"인증 확인 중..."}
          </p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-background to-slate-100 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-card-foreground">
              인센티브 관리자
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              관리자 로그인이 필요합니다
            </p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-login-id"
                className="mb-1.5 block text-sm font-medium text-card-foreground"
              >
                아이디
              </label>
              <input
                type="text"
                id="admin-login-id"
                required
                autoComplete="username"
                placeholder="아이디를 입력하세요"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none transition focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label
                htmlFor="admin-login-pw"
                className="mb-1.5 block text-sm font-medium text-card-foreground"
              >
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="admin-login-pw"
                  required
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                  value={loginPw}
                  onChange={(e) => setLoginPw(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-12 text-foreground outline-none transition focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {loginError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm font-medium text-destructive">
                {loginError}
              </p>
            )}
            <Button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 font-semibold"
            >
              {loginLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  로그인 중...
                </span>
              ) : (
                "로그인"
              )}
            </Button>
          </form>
          <p className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              ← 메인 페이지로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            {"데이터를 불러오는 중..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden text-sm sm:inline">{"신청서"}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-card-foreground">
                {"인센티브 관리"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">{"새로고침"}</span>
            </Button>
            <Button size="sm" onClick={handleExcelDownload}>
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{"Excel 다운로드"}</span>
              <span className="sm:hidden">{"Excel"}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">{"로그아웃"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="space-y-6">
          {/* Stats Cards */}
          <StatsCards stats={stats} />

          {/* Agency Participation Table */}
          {stats && (
            <AgencyTable
              agencyParticipation={stats.agencyParticipation}
              applications={applications}
            />
          )}

          {/* Application List with Detail View */}
          <ApplicationList
            applications={applications}
            onRefresh={() => fetchData(true)}
          />
        </div>
      </main>
    </div>
  )
}
