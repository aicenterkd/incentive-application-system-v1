import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { getAllApplications } from "@/lib/supabase/store"
import sizeOf from "image-size"

function getImageExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpeg",
    "image/jpg": "jpeg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/bmp": "bmp",
  }
  return map[mimeType?.toLowerCase()] || "jpeg"
}

function parseBase64Data(data: string): { base64: string; extension: string; width: number; height: number } | null {
  if (!data || typeof data !== "string") return null

  let base64Str = data
  let ext = "jpeg"

  if (data.startsWith("data:image/")) {
    const match = data.match(/^data:image\/(\w+);base64,(.+)$/)
    if (match) {
      ext = getImageExtension(`image/${match[1]}`)
      base64Str = match[2]
    }
  }

  try {
    // Get image dimensions from base64
    const buffer = Buffer.from(base64Str, 'base64')
    const dimensions = sizeOf(buffer)
    const width = dimensions.width || 200
    const height = dimensions.height || 150

    return { base64: base64Str, extension: ext, width, height }
  } catch {
    return { base64: base64Str, extension: ext, width: 200, height: 150 }
  }
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; extension: string; width: number; height: number } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const extension = getImageExtension(contentType)

    // Get image dimensions
    const dimensions = sizeOf(buffer)
    const width = dimensions.width || 200
    const height = dimensions.height || 150

    return { base64, extension, width, height }
  } catch (error) {
    console.error('Failed to fetch image:', url, error)
    return null
  }
}

function applyHeaderStyle(headerRow: ExcelJS.Row) {
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  }
  headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
}

function applyBorders(sheet: ExcelJS.Worksheet, lastRow: number, colCount: number) {
  for (let r = 1; r <= lastRow; r++) {
    for (let c = 1; c <= colCount; c++) {
      const cell = sheet.getCell(r, c)
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      }
      if (r > 1) {
        cell.alignment = { vertical: "middle", wrapText: true }
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const approvedOnly = searchParams.get("approvedOnly") !== "false"
    const allApps = await getAllApplications(true) // Include file data
    const applications = approvedOnly
      ? allApps.filter((a) => a.status === "approved")
      : allApps

    const workbook = new ExcelJS.Workbook()

    // === 1번 시트: 본사담당자명, 대리점명, 직원명, 마트상호명, 제품진열사진 ===
    const sheet1 = workbook.addWorksheet("1번", {
      views: [{ state: "frozen", ySplit: 1 }],
    })
    const headers1 = ["본사담당자명", "대리점명", "직원명", "마트상호명", "제품진열사진"]
    applyHeaderStyle(sheet1.addRow(headers1))
    sheet1.columns = [{ width: 18 }, { width: 20 }, { width: 14 }, { width: 25 }, { width: 30 }]

    const ROW_HEIGHT = 160

    // Process images in parallel for better performance
    const imageDataPromises = applications.map(async (app, index) => {
      const photos = Array.isArray(app.productPhotos) ? app.productPhotos : []
      const firstPhoto = photos[0]

      if (!firstPhoto || !firstPhoto.data || typeof firstPhoto.data !== "string") {
        return null
      }

      // Handle both base64 and URL images
      if (firstPhoto.data.startsWith("http")) {
        return await fetchImageAsBase64(firstPhoto.data)
      } else {
        return parseBase64Data(firstPhoto.data)
      }
    })

    const imageDataResults = await Promise.all(imageDataPromises)

    applications.forEach((app, index) => {
      const rowIndex = index + 2
      const photos = Array.isArray(app.productPhotos) ? app.productPhotos : []
      const firstPhoto = photos[0]

      sheet1.addRow([
        String(app.managerName ?? ""),
        String(app.agencyName ?? ""),
        String(app.employeeName ?? ""),
        String(app.storeName ?? ""),
        firstPhoto ? "" : "-",
      ])

      try {
        sheet1.getRow(rowIndex).height = ROW_HEIGHT / 0.75
      } catch {
        // ignore row height error
      }

      const imageData = imageDataResults[index]
      if (imageData && imageData.base64.length > 0) {
        try {
          const imageId = workbook.addImage({
            base64: imageData.base64,
            extension: imageData.extension,
          })

          // Maintain aspect ratio: fit within max height
          const maxHeight = ROW_HEIGHT - 8
          const aspectRatio = imageData.width / imageData.height
          const imageHeight = maxHeight
          const imageWidth = imageHeight * aspectRatio

          sheet1.addImage(imageId, {
            tl: { col: 4, row: rowIndex - 1 },
            ext: { width: imageWidth, height: imageHeight },
            editAs: "oneCell",
          })
        } catch {
          // 이미지 삽입 실패 시 해당 셀에 "-" 표시
          sheet1.getCell(rowIndex, 5).value = "-"
        }
      }
    })
    applyBorders(sheet1, applications.length + 1, 5)

    // === 2번 시트: 본사담당자명, 대리점명, 직원명, 금액, 은행명, 계좌번호 ===
    const sheet2 = workbook.addWorksheet("2번", {
      views: [{ state: "frozen", ySplit: 1 }],
    })
    const headers2 = ["본사담당자명", "대리점명", "직원명", "금액", "은행명", "계좌번호"]
    applyHeaderStyle(sheet2.addRow(headers2))
    sheet2.columns = [
      { width: 18 },
      { width: 20 },
      { width: 14 },
      { width: 14 },
      { width: 18 },
      { width: 22 },
    ]

    applications.forEach((app) => {
      const row = sheet2.addRow([
        String(app.managerName ?? ""),
        String(app.agencyName ?? ""),
        String(app.employeeName ?? ""),
        Number(app.incentiveAmount ?? 0),
        String(app.bankName ?? ""),
        String(app.accountNumber ?? ""),
      ])
      try {
        row.getCell(4).numFmt = "#,##0"
      } catch {
        // ignore
      }
    })
    applyBorders(sheet2, applications.length + 1, 6)

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `incentive_report_${new Date().toISOString().split("T")[0]}.xlsx`
    const arrayBuffer = buffer instanceof Buffer ? buffer : Buffer.from(buffer as ArrayBuffer)

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error) {
    console.error("Excel export error:", error)
    return NextResponse.json(
      { error: "Excel 다운로드에 실패했습니다." },
      { status: 500 }
    )
  }
}
