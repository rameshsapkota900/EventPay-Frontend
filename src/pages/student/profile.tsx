import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { User, Mail, Phone, CreditCard, Building, Wallet, QrCode, MapPin, Calendar, GraduationCap, Home, UserCheck } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { QrCodeDisplay } from "@/components/ui/qr-code-display"
import { formatCurrency } from "@/lib/currency"
import { useAccountUpdateListener } from "@/lib/realtime"

interface StudentProfile {
  id: number
  userId: number
  name: string
  phone: string
  address?: string
  school?: string
  visitedBefore: boolean
  eventName: string
  eventLocation?: string
  eventStatus: string
  organizationName?: string
  walletBalance: number
  qrCode: string
  registeredByName?: string
  createdAt: string
}

export default function StudentProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!user?.userId || !user?.eventId) {
      setLoading(false)
      return
    }

    try {
      const response = await api.get<StudentProfile>(`/student/profile/${user.userId}/${user.eventId}`)
      setProfile(response)
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      setLoading(false)
    }
  }, [user?.eventId, user?.userId])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  useAccountUpdateListener(() => {
    void fetchProfile()
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
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">View and manage your account</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{profile?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="font-medium">{profile?.phone}</p>
              </div>
            </div>
            {profile?.address && (
              <div className="flex items-center gap-3">
                <Home className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{profile.address}</p>
                </div>
              </div>
            )}
            {profile?.school && (
              <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">School/Institution</p>
                  <p className="font-medium">{profile.school}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Previous Visitor</p>
                <p className="font-medium">{profile?.visitedBefore ? "Yes" : "No"}</p>
              </div>
            </div>
            {profile?.registeredByName && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Registered By</p>
                  <p className="font-medium">{profile.registeredByName}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Event Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Event Name</p>
                <p className="font-medium">{profile?.eventName}</p>
              </div>
            </div>
            {profile?.eventLocation && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Event Location</p>
                  <p className="font-medium">{profile.eventLocation}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Organization</p>
                <p className="font-medium">{profile?.organizationName || "Not specified"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Event Status</p>
                <p className="font-medium capitalize">{profile?.eventStatus?.toLowerCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className="font-bold text-xl text-green-600">
                  {formatCurrency(profile?.walletBalance || 0)}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setQrDialogOpen(true)} className="w-full mt-4">
              <QrCode className="h-4 w-4 mr-2" />
              View Payment QR Code
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-sm rounded-[5px] border border-border/80 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30 p-0 shadow-premium-xl">
          <div className="gradient-premium relative overflow-hidden rounded-t-[5px] p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
            <div className="relative z-10">
              <DialogTitle className="text-lg font-bold uppercase tracking-wide text-white sm:text-xl">
                Your Payment QR Code
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm font-medium text-white/80">
                Show this QR code to receive payments
              </DialogDescription>
            </div>
          </div>
          <div className="flex flex-col items-center p-6">
            {profile?.qrCode ? (
              <QrCodeDisplay 
                value={profile.qrCode} 
                size={256}
              />
            ) : (
              <p className="text-muted-foreground">QR code not available</p>
            )}
            <div className="mt-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Wallet className="h-4 w-4" />
                <span className="font-bold">
                  Balance: {formatCurrency(profile?.walletBalance || 0)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{profile?.name}</p>
              <p className="text-xs text-muted-foreground">{profile?.phone}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
