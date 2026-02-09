"use client"

import React, { useState, useEffect } from "react"
import { FileUpload } from "@/components/file-upload"
import {
  CheckCircle2,
  Loader2,
  XCircle,
  Settings,
  X,
  Eye,
  EyeOff,
  Check,
  ChevronsUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

function formatAccountNumber(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 12)}`
}

interface FileData {
  name: string
  type: string
  data: string
  preview?: string
}

type FormStatus = "idle" | "loading" | "success" | "error"

export default function ApplicationPage() {
  const router = useRouter()
  const [agencyName, setAgencyName] = useState("")
  const [managerName, setManagerName] = useState("")
  const [employeeName, setEmployeeName] = useState("")
  const [storeName, setStoreName] = useState("")
  const [storeAddress, setStoreAddress] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [productPhotos, setProductPhotos] = useState<FileData[]>([])
  const [storeSignboard, setStoreSignboard] = useState<FileData[]>([])
  const [transactionDocs, setTransactionDocs] = useState<FileData[]>([])
  const [status, setStatus] = useState<FormStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  
  // Agency name autocomplete
  const AGENCY_NAMES = [
    "광명", "영등포", "관악", "김포", "구로", "대구", "영주", "경산", "대구달서",
    "남구미", "동구미", "안동", "김천", "종로", "파주", "서대문", "은평", "덕양",
    "창원", "통영거제고성", "사천", "진영", "신마산", "진주", "거창", "양주",
    "동대문", "노원", "의정부", "구리", "중구", "김해강서", "사하", "연제",
    "서부산", "신동래", "해운대", "수영남구", "부산북구", "성남", "이천", "용인",
    "분당", "경기광주", "강릉", "동해", "원주", "춘천", "홍천", "충주", "성북",
    "남양주", "송파", "강동", "서초", "강남", "성동", "서산", "대전서구", "청주",
    "천안", "유성", "대전중부", "대전", "안양", "평택", "오산", "화성", "수원",
    "안산", "광산", "제주", "목포", "목포산정", "남북", "여수", "순천", "광주서구",
    "시흥", "부평", "인천서구", "부천", "남동", "전주", "익산김제", "정읍고창",
    "군산", "남울산", "동울산", "포항", "경주", "서울",
  ]
    .map((r) => `${r}대리점`)
    .sort((a, b) => a.localeCompare(b, "ko"))
  const [agencyOpen, setAgencyOpen] = useState(false)
  const [agencySearchValue, setAgencySearchValue] = useState("")

  // Manager name autocomplete
  const MANAGER_NAMES = ["이태민", "이승수", "정희범", "최형락", "안수광", "고광일", "이준우"]
  const [managerOpen, setManagerOpen] = useState(false)
  const [managerSearchValue, setManagerSearchValue] = useState("")

  // Bank selection (대표 은행)
  const BANK_NAMES = [
    "국민은행", "신한은행", "우리은행", "하나은행", "NH농협은행",
    "IBK기업은행", "SC제일은행", "한국씨티은행", "카카오뱅크", "케이뱅크",
    "토스뱅크", "우체국", "대구은행", "부산은행", "경남은행", "광주은행",
    "전북은행", "제주은행", "새마을금고", "신협", "HSBC은행", "한국스탠다드차타드은행",
  ]
  const [bankOpen, setBankOpen] = useState(false)
  const [bankSearchValue, setBankSearchValue] = useState("")

  // Admin login modal state
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginId, setLoginId] = useState("")
  const [loginPw, setLoginPw] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const progress =
    [
      agencyName,
      managerName,
      employeeName,
      storeName,
      storeAddress,
      productPhotos.length > 0,
      storeSignboard.length > 0,
      transactionDocs.length > 0,
      bankName,
      accountNumber,
    ].filter(Boolean).length * 10

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
        window.location.href = "/admin"
        return
      } else {
        setLoginError(data.error || "인증에 실패했습니다.")
      }
    } catch {
      setLoginError("서버 오류가 발생했습니다.")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (productPhotos.length === 0) {
      setErrorMessage("제품 진열 사진을 업로드해주세요.")
      setStatus("error")
      return
    }
    if (storeSignboard.length === 0) {
      setErrorMessage("마트 외부 간판 사진을 업로드해주세요.")
      setStatus("error")
      return
    }
    if (transactionDocs.length === 0) {
      setErrorMessage("거래명세서를 업로드해주세요.")
      setStatus("error")
      return
    }

    setStatus("loading")

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName,
          managerName,
          employeeName,
          storeName,
          storeAddress,
          bankName,
          accountNumber,
          productPhotos: productPhotos.map((f) => ({
            name: f.name,
            type: f.type,
            data: f.data,
          })),
          storeSignboard: storeSignboard.map((f) => ({
            name: f.name,
            type: f.type,
            data: f.data,
          })),
          transactionDocs: transactionDocs.map((f) => ({
            name: f.name,
            type: f.type,
            data: f.data,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "제출에 실패했습니다.")
      }

      setStatus("success")
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "제출에 실패했습니다."
      )
      setStatus("error")
    }
  }

  const resetForm = () => {
    setAgencyName("")
    setManagerName("")
    setEmployeeName("")
    setStoreName("")
    setStoreAddress("")
    setBankName("")
    setAccountNumber("")
    setProductPhotos([])
    setStoreSignboard([])
    setTransactionDocs([])
    setStatus("idle")
    setErrorMessage("")
  }

  if (status === "success") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-card-foreground">
            {"신청 완료"}
          </h2>
          <p className="mb-2 text-muted-foreground">
            {agencyName}
            {" / "}
            {storeName}
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            {"신청이 정상적으로 접수되었습니다."}
            <br />
            {"관리자 확인 후 인센티브가 지급됩니다."}
          </p>
          <Button onClick={resetForm} className="w-full">
            {"새 신청서 작성"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-amber-50">
      {/* Progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Admin icon - top right */}
      <button
        type="button"
        onClick={() => {
          setShowLoginModal(true)
          setLoginId("")
          setLoginPw("")
          setLoginError("")
          setShowPassword(false)
        }}
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-card text-muted-foreground shadow-md transition-colors hover:bg-muted hover:text-foreground"
        aria-label="관리자 로그인"
      >
        <Settings className="h-5 w-5" />
      </button>

      <div className="container mx-auto max-w-2xl px-4 pb-8 pt-8">
        {/* Header */}
        <div className="mb-6 rounded-2xl bg-card p-6 shadow-xl">
          <div className="text-center">
            <span className="mb-3 inline-block rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground shadow-lg">
              {"썬키스트 2종 인센티브 행사"}
            </span>
            <h1 className="mb-3 text-balance text-3xl font-bold leading-tight text-card-foreground">
              {"썬키스트 20입 2종"}
              <br />
              {"마트 신규 입점"}
            </h1>
            <div className="mb-4 inline-block rounded-lg border-2 border-amber-400 bg-amber-50 px-6 py-3">
              <p className="font-bold text-destructive">
                {"2종 마트 입점시 1건당 "}
                <span className="text-2xl font-extrabold">{"7,000원"}</span>
                {" 지급"}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {"아래 항목을 채우고 제출하면 관리자에게 자동 전송됩니다."}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Agency Name */}
          <div className="rounded-xl bg-card p-5 shadow-md">
            <label
              htmlFor="agencyName"
              className="mb-2 block font-semibold text-card-foreground"
            >
              {"1. 대리점명"}
              <span className="ml-1 text-destructive">*</span>
            </label>
            <p className="mb-2 text-sm text-muted-foreground">
              {"예: "}
              <span className="font-medium text-foreground">{"서울"}</span>
              {"대리점은 "}
              <span className="font-medium text-foreground">{"서울"}</span>
              {"만 검색해서 찾을 수 있습니다."}
            </p>
            <Popover open={agencyOpen} onOpenChange={setAgencyOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={agencyOpen}
                  className="w-full justify-between rounded-lg border border-input bg-background px-4 py-3 text-left font-normal text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {agencyName || "지역명을 입력해 검색하세요 (예: 서 → 서울대리점)"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="지역명 검색 (예: 서 → 서울대리점)"
                    value={agencySearchValue}
                    onValueChange={setAgencySearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                    <CommandGroup>
                      {AGENCY_NAMES.filter(
                        (name) =>
                          !agencySearchValue ||
                          name.toLowerCase().includes(agencySearchValue.toLowerCase())
                      ).map((name) => (
                        <CommandItem
                          key={name}
                          value={name}
                          onSelect={() => {
                            setAgencyName(name)
                            setAgencyOpen(false)
                            setAgencySearchValue("")
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              agencyName === name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {agencyName && (
              <input type="hidden" id="agencyName" required value={agencyName} />
            )}
          </div>

          {/* 2. Manager Name */}
          <div className="rounded-xl bg-card p-5 shadow-md">
            <label
              htmlFor="managerName"
              className="mb-2 block font-semibold text-card-foreground"
            >
              {"2. 본사 담당자명"}
              <span className="ml-1 text-destructive">*</span>
            </label>
            <p className="mb-2 text-sm text-muted-foreground">
              {"예: "}
              <span className="font-medium text-foreground">{"이"}</span>
              {"를 검색하면 이태민, 이승수, 이준우 등이 표시됩니다."}
            </p>
            <Popover open={managerOpen} onOpenChange={setManagerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={managerOpen}
                  className="w-full justify-between rounded-lg border border-input bg-background px-4 py-3 text-left font-normal text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {managerName || "담당자명을 입력해 검색하세요 (예: 이 → 이태민)"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="담당자명 검색 (예: 이, 정, 최...)"
                    value={managerSearchValue}
                    onValueChange={setManagerSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                    <CommandGroup>
                      {MANAGER_NAMES.filter(
                        (name) =>
                          !managerSearchValue ||
                          name.includes(managerSearchValue)
                      ).map((name) => (
                        <CommandItem
                          key={name}
                          value={name}
                          onSelect={() => {
                            setManagerName(name)
                            setManagerOpen(false)
                            setManagerSearchValue("")
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              managerName === name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {managerName && (
              <input type="hidden" id="managerName" required value={managerName} />
            )}
          </div>

          {/* 3. Employee Name */}
          <div className="rounded-xl bg-card p-5 shadow-md">
            <label
              htmlFor="employeeName"
              className="mb-2 block font-semibold text-card-foreground"
            >
              {"3. 대리점 직원명 (예: 김사원)"}
              <span className="ml-1 text-destructive">*</span>
            </label>
            <input
              type="text"
              id="employeeName"
              required
              placeholder="김사원"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none transition focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 4. Store Name */}
          <div className="rounded-xl bg-card p-5 shadow-md">
            <label
              htmlFor="storeName"
              className="mb-2 block font-semibold text-card-foreground"
            >
              {"4. 마트 상호명"}
              <span className="ml-1 text-destructive">*</span>
            </label>
            <p className="mb-2 text-sm text-muted-foreground">
              {"마트명 검색 시 예시: 행복마트 향남점 형식으로 표기해주세요"}
            </p>
            <input
              type="text"
              id="storeName"
              required
              placeholder="행복마트 향남점"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none transition focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 5. Store Address */}
          <div className="rounded-xl bg-card p-5 shadow-md">
            <label
              htmlFor="storeAddress"
              className="mb-2 block font-semibold text-card-foreground"
            >
              {"5. 마트 주소 (예: 화성시 향남읍 은행나무로23)"}
              <span className="ml-1 text-destructive">*</span>
            </label>
            <input
              type="text"
              id="storeAddress"
              required
              placeholder="화성시 향남읍 은행나무로23"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none transition focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 6. Product Photos */}
          <FileUpload
            id="productPhotos"
            label="6. 제품 진열 사진 (썬키스트 진열+점주샷)"
            description="카메라 촬영 또는 갤러리에서 1-2장 선택"
            maxFiles={2}
            accept="image/*"
            files={productPhotos}
            onChange={setProductPhotos}
          />

          {/* 7. Store Signboard */}
          <FileUpload
            id="storeSignboard"
            label="7. 마트 외부 간판 사진"
            description="카메라 촬영 또는 갤러리에서 마트 간판 잘 보이게 1장"
            maxFiles={1}
            accept="image/*"
            files={storeSignboard}
            onChange={setStoreSignboard}
          />

          {/* 8. Transaction Docs */}
          <FileUpload
            id="transactionDocs"
            label="8. 거래명세서 (영수증/거래증명)"
            description="카메라 촬영 또는 갤러리에서 마트 거래 내역 1-2장"
            maxFiles={2}
            accept="image/*,application/pdf"
            files={transactionDocs}
            onChange={setTransactionDocs}
          />

          {/* 9. Bank Name */}
          <div className="rounded-xl bg-card p-5 shadow-md">
            <label
              htmlFor="bankName"
              className="mb-2 block font-semibold text-card-foreground"
            >
              {"9. 은행명"}
              <span className="ml-1 text-destructive">*</span>
            </label>
            <p className="mb-2 text-sm text-muted-foreground">
              {"대표 은행 중에서 선택해주세요"}
            </p>
            <Popover open={bankOpen} onOpenChange={setBankOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={bankOpen}
                  className="w-full justify-between rounded-lg border border-input bg-background px-4 py-3 text-left font-normal text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {bankName || "은행을 검색해 선택하세요"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="은행명 검색 (예: 국민, 신한...)"
                    value={bankSearchValue}
                    onValueChange={setBankSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                    <CommandGroup>
                      {BANK_NAMES.filter(
                        (name) =>
                          !bankSearchValue ||
                          name.includes(bankSearchValue)
                      ).map((name) => (
                        <CommandItem
                          key={name}
                          value={name}
                          onSelect={() => {
                            setBankName(name)
                            setBankOpen(false)
                            setBankSearchValue("")
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              bankName === name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {bankName && (
              <input type="hidden" id="bankName" required value={bankName} />
            )}
          </div>

          {/* 10. Account Number */}
          <div className="rounded-xl bg-card p-5 shadow-md">
            <label
              htmlFor="accountNumber"
              className="mb-2 block font-semibold text-card-foreground"
            >
              {"10. 계좌번호 (예: 123-456-789012)"}
              <span className="ml-1 text-destructive">*</span>
            </label>
            <p className="mb-2 text-sm text-muted-foreground">
              {"숫자만 입력해도 자동으로 -(하이픈)이 표시됩니다"}
            </p>
            <input
              type="text"
              id="accountNumber"
              required
              placeholder="123-456-789012"
              value={accountNumber}
              onChange={(e) => setAccountNumber(formatAccountNumber(e.target.value))}
              maxLength={14}
              inputMode="numeric"
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none transition focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-xl py-6 text-lg font-bold shadow-lg"
            size="lg"
          >
            {status === "loading" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {"제출 중..."}
              </span>
            ) : (
              "신청 완료하기"
            )}
          </Button>
        </form>

        {/* Error Modal */}
        {status === "error" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-destructive">
                {"오류 발생"}
              </h2>
              <p className="mb-6 text-muted-foreground">{errorMessage}</p>
              <Button
                variant="destructive"
                onClick={() => setStatus("idle")}
                className="w-full"
              >
                {"다시 시도"}
              </Button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {status === "loading" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50">
            <div className="rounded-2xl bg-card p-8 text-center">
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
              <p className="font-semibold text-card-foreground">
                {"제출 중..."}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {"잠시만 기다려주세요"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-card p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Settings className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-card-foreground">
                {"관리자 로그인"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {"관리자 계정으로 로그인해주세요"}
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="loginId"
                  className="mb-1.5 block text-sm font-medium text-card-foreground"
                >
                  {"아이디"}
                </label>
                <input
                  type="text"
                  id="loginId"
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
                  htmlFor="loginPw"
                  className="mb-1.5 block text-sm font-medium text-card-foreground"
                >
                  {"비밀번호"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="loginPw"
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
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {"로그인 중..."}
                  </span>
                ) : (
                  "로그인"
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
