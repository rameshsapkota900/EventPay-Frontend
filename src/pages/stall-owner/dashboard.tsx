import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Store, DollarSign, ShoppingCart, TrendingUp, QrCode } from "lucide-react"
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

interface StallDashboard {
  totalRevenue: number
  totalTransactions: number
  transactionsLast24h: number
  transactionsLast7d: number
  transactionsLast30d: number
  revenueLast24h: number
  revenueLast7d: number
  revenueLast30d: number
}

export default function StallOwnerDashboard() {
  const { user } = useAuth()
  const [stall, setStall] = useState<StallInfo | null>(null)
  const [dashboard, setDashboard] = useState<StallDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false)
      return
    }

    try {
      const stallResponse = await api.get<StallInfo>(`/stall-owner/profile/${user.userId}`)
      setStall(stallResponse)

      if (stallResponse?.id) {
        const dashboardResponse = await api.get<StallDashboard>(`/stall-owner/dashboard/${stallResponse.id}`)
        setDashboard(dashboardResponse)
      } else {
        setDashboard(null)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [user?.userId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useAccountUpdateListener(() => {
    void fetchData()
  })

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const stats = [
    {
      title: "Today's Revenue",
      value: formatCurrency(dashboard?.revenueLast24h || 0),
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(dashboard?.totalRevenue || 0),
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Today's Orders",
      value: dashboard?.transactionsLast24h || 0,
      icon: ShoppingCart,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Total Orders",
      value: dashboard?.totalTransactions || 0,
      icon: Store,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Stall Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {stall?.name} - {stall?.eventName}
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">{stat.title}</CardTitle>
              <div className={`rounded-lg p-1.5 sm:p-2 ${stat.bg}`}>
                <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* QR Code Section */}
      <Card className="mx-auto max-w-md sm:max-w-none">
        <CardHeader className="text-center sm:text-left">
          <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-lg sm:text-xl">
            <QrCode className="h-5 w-5" />
            Your Stall QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
            {stall?.qrCode ? (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <QrCodeDisplay 
                  value={stall.qrCode} 
                  size={192}
                />
              </div>
            ) : (
            <p className="text-muted-foreground">No QR code available</p>
          )}
          <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-xs">
            Students scan this code to pay at your stall
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Revenue Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center p-2 sm:p-3 bg-muted rounded-lg">
                <span className="text-sm sm:text-base text-muted-foreground">Last 24 Hours</span>
                <span className="text-sm sm:text-base font-semibold text-green-600">
                  {formatCurrency(dashboard?.revenueLast24h || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 sm:p-3 bg-muted rounded-lg">
                <span className="text-sm sm:text-base text-muted-foreground">Last 7 Days</span>
                <span className="text-sm sm:text-base font-semibold text-blue-600">
                  {formatCurrency(dashboard?.revenueLast7d || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 sm:p-3 bg-muted rounded-lg">
                <span className="text-sm sm:text-base text-muted-foreground">Last 30 Days</span>
                <span className="text-sm sm:text-base font-semibold text-purple-600">
                  {formatCurrency(dashboard?.revenueLast30d || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 sm:p-3 bg-primary/10 rounded-lg">
                <span className="text-sm sm:text-base font-medium">Total Revenue</span>
                <span className="text-base sm:text-lg font-bold">
                  {formatCurrency(dashboard?.totalRevenue || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Transaction Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center p-2 sm:p-3 bg-muted rounded-lg">
                <span className="text-sm sm:text-base text-muted-foreground">Last 24 Hours</span>
                <span className="text-sm sm:text-base font-semibold">{dashboard?.transactionsLast24h || 0} orders</span>
              </div>
              <div className="flex justify-between items-center p-2 sm:p-3 bg-muted rounded-lg">
                <span className="text-sm sm:text-base text-muted-foreground">Last 7 Days</span>
                <span className="text-sm sm:text-base font-semibold">{dashboard?.transactionsLast7d || 0} orders</span>
              </div>
              <div className="flex justify-between items-center p-2 sm:p-3 bg-muted rounded-lg">
                <span className="text-sm sm:text-base text-muted-foreground">Last 30 Days</span>
                <span className="text-sm sm:text-base font-semibold">{dashboard?.transactionsLast30d || 0} orders</span>
              </div>
              <div className="flex justify-between items-center p-2 sm:p-3 bg-primary/10 rounded-lg">
                <span className="text-sm sm:text-base font-medium">Total Orders</span>
                <span className="text-base sm:text-lg font-bold">{dashboard?.totalTransactions || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
