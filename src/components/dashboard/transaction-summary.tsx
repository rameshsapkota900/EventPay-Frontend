import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardMetrics } from "@/lib/api"
import { formatCurrency } from "@/lib/currency"

interface TransactionSummaryProps {
  metrics: DashboardMetrics
}

export function TransactionSummary({ metrics }: TransactionSummaryProps) {
  return (
    <Card className="h-full border-0 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-slate-900 tracking-tight">Transaction Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-[10px] text-center hover:bg-slate-100/50 hover:border-slate-200 transition-all flex flex-col items-center justify-center">
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Last 24 Hours</p>
              <p className="text-3xl font-bold text-slate-900 mb-3">{metrics.transactionsLast24h}</p>
              <div className="py-1.5 px-3 bg-white border border-slate-200 rounded-[5px] inline-block w-full max-w-[120px]">
                 <p className="text-sm font-bold text-emerald-600 truncate" title={formatCurrency(metrics.revenueLast24h, 0)}>
                   {formatCurrency(metrics.revenueLast24h, 0)}
                 </p>
              </div>
            </div>
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-[10px] text-center hover:bg-slate-100/50 hover:border-slate-200 transition-all flex flex-col items-center justify-center">
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Last 7 Days</p>
              <p className="text-3xl font-bold text-slate-900 mb-3">{metrics.transactionsLast7d}</p>
              <div className="py-1.5 px-3 bg-white border border-slate-200 rounded-[5px] inline-block w-full max-w-[120px]">
                 <p className="text-sm font-bold text-emerald-600 truncate" title={formatCurrency(metrics.revenueLast7d, 0)}>
                   {formatCurrency(metrics.revenueLast7d, 0)}
                 </p>
              </div>
            </div>
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-[10px] text-center hover:bg-slate-100/50 hover:border-slate-200 transition-all flex flex-col items-center justify-center">
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Last 30 Days</p>
              <p className="text-3xl font-bold text-slate-900 mb-3">{metrics.transactionsLast30d}</p>
              <div className="py-1.5 px-3 bg-white border border-slate-200 rounded-[5px] inline-block w-full max-w-[120px]">
                 <p className="text-sm font-bold text-emerald-600 truncate" title={formatCurrency(metrics.revenueLast30d, 0)}>
                   {formatCurrency(metrics.revenueLast30d, 0)}
                 </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
