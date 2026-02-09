import { NextRequest, NextResponse } from "next/server"

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET

interface NaverLocalItem {
  title: string
  link: string
  category: string
  description: string
  address: string
  roadAddress: string
  mapx: string
  mapy: string
}

interface NaverLocalResponse {
  lastBuildDate: string
  total: number
  start: number
  display: number
  items: NaverLocalItem[]
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "")
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "검색어를 2글자 이상 입력해주세요." },
      { status: 400 }
    )
  }

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    return NextResponse.json(
      {
        error: "네이버 API가 설정되지 않았습니다. .env.local에 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET을 추가해주세요.",
        items: [],
      },
      { status: 200 }
    )
  }

  try {
    const encodedQuery = encodeURIComponent(query)
    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodedQuery}&display=20&sort=random`

    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
      },
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("Naver API error:", res.status, errText)
      return NextResponse.json(
        { error: "검색에 실패했습니다.", items: [] },
        { status: 200 }
      )
    }

    const data: NaverLocalResponse = await res.json()
    const items = (data.items || []).map((item) => ({
      name: stripHtml(item.title),
      address: item.roadAddress || item.address || "",
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Naver local search error:", error)
    return NextResponse.json(
      { error: "검색 중 오류가 발생했습니다.", items: [] },
      { status: 200 }
    )
  }
}
