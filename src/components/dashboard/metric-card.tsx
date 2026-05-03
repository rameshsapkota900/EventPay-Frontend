import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function MetricCard({ title, value, description, icon, trend, className }: MetricCardProps) {
  return (
    <Card className={cn("h-full rounded-[10px] shadow-sm transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-sm font-bold text-slate-600 truncate pr-2 tracking-tight">
          {title}
        </CardTitle>
        {icon && <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-sm border border-slate-100 flex-shrink-0">{icon}</div>}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl sm:text-3xl font-bold truncate text-slate-900 tracking-tight" title={value.toString()}>
          {value}
        </div>
        {description && (
          <p className="text-[13px] font-medium text-slate-500 mt-2 truncate" title={description}>
            {description}
          </p>
        )}
        {trend && (
          <p className={`text-[13px] font-bold mt-2 ${trend.isPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {trend.isPositive ? "+" : "-"}
            {trend.value}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  )
}
