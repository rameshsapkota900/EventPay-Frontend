import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Wallet, ShoppingCart, TrendingDown, QrCode, History, Store } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { QrCodeDisplay } from "@/components/ui/qr-code-display"
import { formatCurrency } from "@/lib/currency"
import { useAccountUpdateListener } from "@/lib/realtime"

interface StudentProfile {
  id: number
  userId: number
  name: string
  phone: string
  qrCode: string
  eventId: number
  eventName: string
  walletBalance: number
  walletFrozen: boolean
}

interface TransactionResponse {
  id: number
  amount: number
  transactionType: string
  direction?: string
  stallName?: string | null
  toStallName?: string | null
  toStudentName?: string | null
  fromStudentName?: string | null
  createdAt: string
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [transactions, setTransactions] = useState<TransactionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user?.userId || !user?.eventId) {
      setLoading(false)
      return
    }

    try {
      const profileResponse = await api.get<StudentProfile>(`/student/profile/${user.userId}/${user.eventId}`)
      setProfile(profileResponse)

      if (profileResponse?.id) {
        const txResponse = await api.get<TransactionResponse[]>(`/student/history/${profileResponse.id}`)
        setTransactions(txResponse || [])
      } else {
        setTransactions([])
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [user?.eventId, user?.userId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useAccountUpdateListener(() => {
    void fetchData()
  })

  if (loading) {
    return (
      <div className="flex h-32 sm:h-64 items-center justify-center">
        <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Welcome, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {profile?.eventName || user?.eventName}
        </p>
      </div>

      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm opacity-90">Wallet Balance</p>
              <p className="text-3xl sm:text-4xl font-bold">
                {formatCurrency(profile?.walletBalance || 0)}
              </p>
              {profile?.walletFrozen && (
                <p className="text-sm opacity-90 mt-1">⚠️ Wallet Frozen</p>
              )}
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setQrDialogOpen(true)}
              className="flex items-center gap-2 touch-manipulation w-full sm:w-auto"
            >
              <QrCode className="h-5 w-5" />
              Show QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {formatCurrency(
                transactions
                  .filter((tx) => tx.direction === "SENT")
                  .reduce((sum, tx) => sum + tx.amount, 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <History className="h-4 w-4 sm:h-5 sm:w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Store className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm sm:text-base">No transactions yet</p>
                <p className="text-xs sm:text-sm">Visit a stall to make your first purchase!</p>
              </div>
            ) : (
              transactions.slice(0, 10).map((tx) => {
                const getTransactionDetails = () => {
                  if (tx.direction === "RECEIVED") {
                    return {
                      label: `From ${tx.fromStudentName || "Unknown"}`,
                      type: "Transfer",
                      icon: <Wallet className="h-4 w-4 text-green-600" />,
                      bgColor: "bg-green-100",
                      textColor: "text-green-600",
                      sign: "+"
                    }
                  } else if (tx.transactionType === "STALL") {
                    return {
                      label: tx.toStallName || "Stall Purchase",
                      type: "Purchase",
                      icon: <ShoppingCart className="h-4 w-4 text-red-600" />,
                      bgColor: "bg-red-100",
                      textColor: "text-red-600",
                      sign: "-"
                    }
                  } else {
                    return {
                      label: `To ${tx.toStudentName || "Unknown"}`,
                      type: "Transfer",
                      icon: <Wallet className="h-4 w-4 text-red-600" />,
                      bgColor: "bg-red-100",
                      textColor: "text-red-600",
                      sign: "-"
                    }
                  }
                }
                
                const details = getTransactionDetails()
                
                return (
                  <div key={tx.id} className="flex items-center justify-between border-b pb-3 sm:pb-4 last:border-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-lg ${details.bgColor} flex-shrink-0`}>
                        {details.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{details.type}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{details.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                <span className={`font-semibold text-sm sm:text-base ${details.textColor} flex-shrink-0 ml-2`}>
                      {details.sign}
                      {formatCurrency(tx.amount)}
                </span>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-xs sm:max-w-sm rounded-[5px] border border-border/80 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30 p-0 shadow-premium-xl">
          <div className="gradient-premium relative overflow-hidden rounded-t-[5px] p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
            <div className="relative z-10">
              <DialogTitle className="text-lg font-bold uppercase tracking-wide text-white sm:text-xl">
                Your Payment QR Code
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm font-medium text-white/80">
                Show this QR code at any stall to make a payment
              </DialogDescription>
            </div>
          </div>
          <div className="flex flex-col items-center p-6">
            {profile?.qrCode ? (
              <div className="w-full max-w-[200px]">
                <QrCodeDisplay 
                  value={profile.qrCode} 
                  title="Payment QR Code"
                  size={200}
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">QR code not available</p>
            )}
            <div className="mt-4 flex items-center gap-2 bg-gray-50/80 px-3 py-2 rounded-[5px] shadow-premium">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="font-bold text-sm sm:text-base">
                Balance: {formatCurrency(profile?.walletBalance || 0)}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
