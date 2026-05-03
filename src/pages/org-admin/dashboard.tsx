import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { api, type DashboardMetrics } from "@/lib/api"
import { MetricCard } from "@/components/dashboard/metric-card"
import { MetricCardPie } from "@/components/dashboard/metric-card-pie"
import { TransactionSummary } from "@/components/dashboard/transaction-summary"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { Calendar, CreditCard, DollarSign, Activity, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/currency"

export default function OrgAdminDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [eventChartData, setEventChartData] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.organizationId) return

    const fetchData = async () => {
      try {
        const [metricsData, chartData] = await Promise.all([
          api.get<DashboardMetrics>(`/org-admin/dashboard/${user.organizationId}`),
          api.get<Record<string, number>>(`/org-admin/charts/events/${user.organizationId}`),
        ])
        setMetrics(metricsData)
        setEventChartData(chartData)
      } catch (error) {
        toast.error("Failed to load dashboard")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [user?.organizationId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 sm:h-64">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p className="text-sm sm:text-base">Failed to load metrics</p>
      </div>
    )
  }

  const completedEvents = metrics.completedEvents || 0
  const cancelledEvents = Math.max(metrics.totalEvents - metrics.activeEvents - completedEvents, 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[5px] border-0 bg-gradient-to-br from-white via-gray-50/30 to-white p-6 sm:p-8 shadow-premium">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Organization Dashboard</h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground font-medium">Overview of your organization performance</p>
          </div>
          <div className="inline-flex items-center rounded-[5px] border-0 bg-primary/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary sm:text-sm shadow-premium">
            {user?.organizationName || "Organization"}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[5px] border-0 bg-white p-4 shadow-premium hover:shadow-premium-lg transition-all">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Events</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">{metrics.activeEvents}</p>
          </div>
          <div className="rounded-[5px] border-0 bg-white p-4 shadow-premium hover:shadow-premium-lg transition-all">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Completed Events</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">{completedEvents}</p>
          </div>
          <div className="rounded-[5px] border-0 bg-white p-4 shadow-premium hover:shadow-premium-lg transition-all">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cancelled Events</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-2">{cancelledEvents}</p>
          </div>
          <div className="rounded-[5px] border-0 bg-white p-4 shadow-premium hover:shadow-premium-lg transition-all">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tracked Revenue</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-2">{formatCurrency(metrics.totalRevenue)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCardPie 
          title="Total Events" 
          value={metrics.totalEvents} 
          total={metrics.totalEvents || 1}
          percentage={100}
          icon={<Calendar className="h-4 w-4 text-primary" />}
          color="#1a365d"
        />
        <MetricCardPie 
          title="Active Events" 
          value={metrics.activeEvents} 
          total={metrics.totalEvents || 1}
          icon={<Activity className="h-4 w-4 text-emerald-600" />}
          color="#059669"
        />
        <MetricCardPie
          title="Total Transactions"
          value={metrics.totalTransactions.toLocaleString()}
          percentage={metrics.totalTransactions > 0 ? 100 : 0}
          icon={<CreditCard className="h-4 w-4 text-blue-600" />}
          color="#2563eb"
        />
        <MetricCardPie
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          percentage={metrics.totalRevenue > 0 ? 100 : 0}
          icon={<DollarSign className="h-4 w-4 text-amber-600" />}
          color="#d97706"
        />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <MetricCardPie
          title="Active Events"
          value={metrics.activeEvents}
          total={metrics.totalEvents || 1}
          icon={<Activity className="h-4 w-4 text-green-600" />}
          color="#16a34a"
          description="Currently running"
        />
        <MetricCardPie
          title="Completed Events"
          value={completedEvents}
          total={metrics.totalEvents || 1}
          icon={<CheckCircle className="h-4 w-4 text-blue-600" />}
          color="#3b82f6"
          description="Successfully finished"
        />
        <MetricCardPie
          title="Cancelled Events"
          value={cancelledEvents}
          total={metrics.totalEvents || 1}
          icon={<XCircle className="h-4 w-4 text-red-600" />}
          color="#dc2626"
          description="Terminated early"
        />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <TransactionSummary metrics={metrics} />
        <RevenueChart title="Event-wise Revenue" data={eventChartData} />
      </div>
    </div>
  )
}
