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
import { Input } from "@/components/ui/input"
import { Building2, Search } from "lucide-react"

interface AgencyData {
  agencyName: string
  count: number
  totalIncentive: number
}

export function AgencyTable({
  agencyParticipation,
  applications,
}: {
  agencyParticipation: Record<string, number>
  applications: Array<{
    agencyName: string
    status: string
    incentiveAmount: number
  }>
}) {
  const [searchValue, setSearchValue] = useState("")

  const participation = agencyParticipation ?? {}
  const agencies: AgencyData[] = Object.entries(participation).map(
    ([name, count]) => {
      const totalIncentive = applications
        .filter((a) => a.agencyName === name && a.status === "approved")
        .reduce((sum, a) => sum + a.incentiveAmount, 0)
      return { agencyName: name, count, totalIncentive }
    }
  )

  const filteredAgencies = agencies.filter((agency) =>
    agency.agencyName.toLowerCase().includes(searchValue.trim().toLowerCase())
  )

  if (agencies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5 text-primary" />
            {"대리점별 참여 현황"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            {"아직 신청 내역이 없습니다."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-primary" />
          {"대리점별 참여 현황"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="대리점명 검색..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{"대리점명"}</TableHead>
                <TableHead className="text-right">
                  {"참여횟수"}
                </TableHead>
                <TableHead className="text-right">
                  {"지급 인센티브 총 금액"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgencies.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {searchValue ? "검색 결과가 없습니다." : "데이터가 없습니다."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgencies.map((agency) => (
                <TableRow key={agency.agencyName}>
                  <TableCell className="font-medium">
                    {agency.agencyName}
                  </TableCell>
                  <TableCell className="text-right">
                    {agency.count}
                    {"건"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    {agency.totalIncentive.toLocaleString()}
                    {"원"}
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
