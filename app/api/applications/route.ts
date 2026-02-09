import { NextRequest, NextResponse } from "next/server"
import {
  addApplication,
  getAllApplications,
  getStats,
  getAgencySummaries,
} from "@/lib/supabase/store"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      agencyName,
      managerName,
      employeeName,
      storeName,
      storeAddress,
      bankName,
      accountNumber,
      productPhotos,
      storeSignboard,
      transactionDocs,
    } = body

    if (
      !agencyName ||
      !managerName ||
      !employeeName ||
      !storeName ||
      !storeAddress ||
      !bankName ||
      !accountNumber
    ) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요." },
        { status: 400 }
      )
    }

    const app = await addApplication({
      agencyName,
      managerName,
      employeeName,
      storeName,
      storeAddress,
      bankName,
      accountNumber,
      productPhotos: productPhotos || [],
      storeSignboard: storeSignboard || [],
      transactionDocs: transactionDocs || [],
    })

    return NextResponse.json({ success: true, id: app.id }, { status: 201 })
  } catch (error) {
    console.error('Application creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    if (type === "stats") {
      const stats = await getStats()
      return NextResponse.json(stats)
    }

    if (type === "summaries") {
      const summaries = await getAgencySummaries()
      return NextResponse.json(summaries)
    }

    const applications = await getAllApplications()
  // Return without file data for list view (performance)
  const listData = applications.map((app) => ({
    ...app,
    productPhotos: (app.productPhotos ?? []).map((f) => ({ name: f.name, type: f.type })),
    storeSignboard: (app.storeSignboard ?? []).map((f) => ({ name: f.name, type: f.type })),
    transactionDocs: (app.transactionDocs ?? []).map((f) => ({
      name: f.name,
      type: f.type,
    })),
  }))

    return NextResponse.json(listData)
  } catch (error) {
    console.error('Applications fetch error:', error)
    return NextResponse.json(
      { error: "데이터를 불러오는데 실패했습니다." },
      { status: 500 }
    )
  }
}
