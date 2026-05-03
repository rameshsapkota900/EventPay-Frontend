import type React from "react"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { QrCode, Store, Mail, Phone, User } from "lucide-react"
import { QrCodeDisplay } from "@/components/ui/qr-code-display"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/currency"
import { useAccountUpdateListener } from "@/lib/realtime"

interface StallInfo {
  id: number
  name: string
  phone: string
  qrCode: string
  status: string
  eventName: string
  totalRevenue: number
}

export default function StallOwnerProfile() {
  const { user } = useAuth()
  const [stall, setStall] = useState<StallInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStall = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false)
      return
    }

    try {
      const response = await api.get<StallInfo>(`/stall-owner/profile/${user.userId}`)
      setStall(response)
    } catch (error) {
      console.error("Failed to fetch stall:", error)
      toast.error("Failed to load stall information")
    } finally {
      setLoading(false)
    }
  }, [user?.userId])

  useEffect(() => {
    void fetchStall()
  }, [fetchStall])

  useAccountUpdateListener(() => {
    void fetchStall()
  })

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">Manage your account and stall information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{user?.phone || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Stall Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Stall Name</p>
              <p className="font-medium">{stall?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Event</p>
              <p className="font-medium">{stall?.eventName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={stall?.status === "ACTIVE" ? "default" : "secondary"}>{stall?.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stall?.totalRevenue || 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Stall QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {stall?.qrCode ? (
              <QrCodeDisplay 
                value={stall.qrCode} 
                size={192}
              />
            ) : (
              <p className="text-muted-foreground">No QR code available</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Students scan this code to pay at your stall
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
