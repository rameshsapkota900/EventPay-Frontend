import { useEffect, useState } from "react"
import { api, type DashboardMetrics } from "@/lib/api"
import { SystemMetricsPie } from "@/components/dashboard/system-metrics-pie"
import { formatCurrency } from "@/lib/currency"
import { toast } from "sonner"

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.get<DashboardMetrics>("/super-admin/dashboard")
        setMetrics(data)
      } catch (error) {
        toast.error("Failed to load dashboard metrics")
      } finally {
        setIsLoading(false)
      }
    }
    fetchMetrics()
  }, [])

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-left">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Super Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">System-wide metrics and performance overview</p>
      </div>

      <SystemMetricsPie metrics={metrics} />

      <div className="rounded-[10px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Transaction & Event Snapshot</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          <div className="flex flex-col items-center justify-center rounded-[10px] border border-slate-100 bg-slate-50 p-5 text-center transition-all hover:border-slate-200 hover:bg-slate-100/50">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-widest text-slate-500">Last 24 Hours</p>
            <p className="mb-3 text-3xl font-bold text-slate-900">{metrics.transactionsLast24h}</p>
            <div className="inline-block w-full max-w-[120px] rounded-[5px] border border-slate-200 bg-white px-3 py-1.5">
              <p className="truncate text-sm font-bold text-emerald-600" title={formatCurrency(metrics.revenueLast24h, 0)}>
                {formatCurrency(metrics.revenueLast24h, 0)}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-[10px] border border-slate-100 bg-slate-50 p-5 text-center transition-all hover:border-slate-200 hover:bg-slate-100/50">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-widest text-slate-500">Last 7 Days</p>
            <p className="mb-3 text-3xl font-bold text-slate-900">{metrics.transactionsLast7d}</p>
            <div className="inline-block w-full max-w-[120px] rounded-[5px] border border-slate-200 bg-white px-3 py-1.5">
              <p className="truncate text-sm font-bold text-emerald-600" title={formatCurrency(metrics.revenueLast7d, 0)}>
                {formatCurrency(metrics.revenueLast7d, 0)}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-[10px] border border-slate-100 bg-slate-50 p-5 text-center transition-all hover:border-slate-200 hover:bg-slate-100/50">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-widest text-slate-500">Last 30 Days</p>
            <p className="mb-3 text-3xl font-bold text-slate-900">{metrics.transactionsLast30d}</p>
            <div className="inline-block w-full max-w-[120px] rounded-[5px] border border-slate-200 bg-white px-3 py-1.5">
              <p className="truncate text-sm font-bold text-emerald-600" title={formatCurrency(metrics.revenueLast30d, 0)}>
                {formatCurrency(metrics.revenueLast30d, 0)}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-[10px] border border-rose-100 bg-rose-50/30 p-5 text-center transition-all hover:bg-rose-50/50">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-widest text-slate-500">Active Events</p>
            <p className="text-3xl font-bold text-rose-700">{metrics.activeEvents}</p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-[10px] border border-teal-100 bg-teal-50/30 p-5 text-center transition-all hover:bg-teal-50/50">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-widest text-slate-500">Completed Events</p>
            <p className="text-3xl font-bold text-teal-700">{metrics.completedEvents || 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
