import { NextRequest, NextResponse } from "next/server"
import {
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
} from "@/lib/supabase/store"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const app = await getApplicationById(id)
    if (!app) {
      return NextResponse.json(
        { error: "신청서를 찾을 수 없습니다." },
        { status: 404 }
      )
    }
    return NextResponse.json(app)
  } catch (error) {
    console.error('Application fetch error:', error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json(
        { error: "유효하지 않은 상태입니다." },
        { status: 400 }
      )
    }

    const app = await updateApplicationStatus(id, status)
    if (!app) {
      return NextResponse.json(
        { error: "신청서를 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, application: app })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await deleteApplication(id)
    if (!deleted) {
      return NextResponse.json(
        { error: "신청서를 찾을 수 없습니다." },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Application deletion error:', error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
