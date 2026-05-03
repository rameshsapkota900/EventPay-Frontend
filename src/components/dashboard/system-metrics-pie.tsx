import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardMetrics } from "@/lib/api"
import { formatCurrency } from "@/lib/currency"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface SystemMetricsPieProps {
  metrics: DashboardMetrics
}

export function SystemMetricsPie({ metrics }: SystemMetricsPieProps) {
  // We use equal values (1) for visual layout so the chart is perfectly 
  // quartered like an infographic. Real values are in the text.
  const data = [
    { 
      name: "Organizations", 
      value: 1, 
      label: "Total Organizations",
      count: metrics.totalOrganizations || 0,
      desc: `${metrics.activeOrganizations || 0} active deployments`,
      color: "#1e293b", // slate-800
      stroke: "#0f172a"
    },
    { 
      name: "Events", 
      value: 1, 
      label: "Total Events",
      count: metrics.totalEvents || 0,
      desc: `${metrics.activeEvents || 0} active`,
      color: "#6366f1", // indigo-500
      stroke: "#4f46e5"
    },
    { 
      name: "Revenue", 
      value: 1, 
      label: "Total Revenue",
      count: formatCurrency(metrics.totalRevenue),
      desc: "Overall processed",
      color: "#f59e0b", // amber-500
      stroke: "#d97706"
    },
    { 
      name: "Transactions", 
      value: 1, 
      label: "Total Transactions",
      count: (metrics.totalTransactions || 0).toLocaleString(),
      desc: "Total executed",
      color: "#e11d48", // rose-600
      stroke: "#be123c"
    }
  ]

  return (
    <Card className="border-0 shadow-sm rounded-[10px] overflow-hidden bg-white mb-6">
      <CardContent className="p-4 sm:p-5 relative">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-4 py-4 lg:flex-row lg:justify-center lg:gap-20 xl:gap-24">
          
          {/* Left Labels */}
          <div className="z-10 flex w-full flex-col gap-6 lg:w-[260px] xl:w-[270px]">
            <div className="flex flex-col relative group">
              <div className="bg-slate-800 text-white rounded-[10px] p-3 shadow-lg border border-slate-700 w-full max-w-[220px] relative z-10 transform transition-transform hover:scale-105">
                <p className="text-xs font-bold opacity-90">{data[0].label}</p>
                <p className="text-2xl font-black tracking-tight my-0.5">{data[0].count}</p>
                <p className="text-[10px] sm:text-xs text-slate-300 font-medium">{data[0].desc}</p>
              </div>
            </div>

            <div className="flex flex-col relative group">
              <div className="bg-indigo-600 text-white rounded-[10px] p-3 shadow-lg border border-indigo-700 w-full max-w-[220px] relative z-10 transform transition-transform hover:scale-105">
                <p className="text-xs font-bold opacity-90">{data[1].label}</p>
                <p className="text-2xl font-black tracking-tight my-0.5">{data[1].count}</p>
                <p className="text-[10px] sm:text-xs text-indigo-200 font-medium">{data[1].desc}</p>
              </div>
            </div>
          </div>

          {/* Central Pie Graphic */}
          <div className="relative flex w-full max-w-[200px] aspect-square items-center justify-center shrink-0 lg:w-[230px] lg:max-w-[230px] xl:w-[250px] xl:max-w-[250px]">
            {/* Soft background glow */}
            <div className="absolute inset-0 bg-slate-100 rounded-full blur-2xl opacity-50 z-0"></div>
            
            <div className="w-full h-full relative z-10 filter drop-shadow-md">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="90%"
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.stroke} strokeWidth={1} style={{ filter: `drop-shadow(0px 4px 6px rgba(0,0,0,0.1))` }} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Inner Circle Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="bg-white h-[88px] w-[88px] rounded-full shadow-inner flex flex-col items-center justify-center border-[3px] border-slate-50">
                  <svg className="w-5 h-5 text-slate-400 mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center mt-0.5">Metrics</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Labels */}
          <div className="z-10 flex w-full flex-col items-end gap-6 lg:w-[260px] xl:w-[270px]">
            <div className="flex flex-col relative group items-end text-right">
              <div className="bg-amber-500 text-white rounded-[10px] p-3 shadow-lg border border-amber-600 w-full max-w-[220px] relative z-10 transform transition-transform hover:scale-105">
                <p className="text-xs font-bold opacity-90">{data[2].label}</p>
                <p className="text-2xl font-black tracking-tight my-0.5">{data[2].count}</p>
                <p className="text-[10px] sm:text-xs text-amber-100 font-medium">{data[2].desc}</p>
              </div>
            </div>

            <div className="flex flex-col relative group items-end text-right">
              <div className="bg-rose-600 text-white rounded-[10px] p-3 shadow-lg border border-rose-700 w-full max-w-[220px] relative z-10 transform transition-transform hover:scale-105">
                <p className="text-xs font-bold opacity-90">{data[3].label}</p>
                <p className="text-2xl font-black tracking-tight my-0.5">{data[3].count}</p>
                <p className="text-[10px] sm:text-xs text-rose-200 font-medium">{data[3].desc}</p>
              </div>
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  )
}
