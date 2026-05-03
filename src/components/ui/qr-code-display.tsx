"use client"

import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QrCodeDisplayProps {
  value: string
  title?: string
  size?: number
}

export function QrCodeDisplay({ value, title, size = 200 }: QrCodeDisplayProps) {
  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="flex justify-center">
        <div className="p-4 bg-white rounded-lg">
          <QRCodeSVG value={value} size={size} />
        </div>
      </CardContent>
    </Card>
  )
}
