import React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "썬키스트 인센티브 신청 시스템",
  description: "썬키스트 2종 마트 신규 입점 인센티브 신청 및 관리 시스템",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ea7317",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
