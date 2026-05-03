import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface MetricCardPieProps {
  title: string
  value: string | number
  total?: number
  percentage?: number
  description?: string
  icon?: ReactNode
  color?: string
  className?: string
}

export function MetricCardPie({ 
  title, 
  value, 
  total, 
  percentage, 
  description, 
  icon, 
  color = "#1a365d",
  className 
}: MetricCardPieProps) {
  // Calculate percentage if total is provided
  const calculatedPercentage = percentage ?? (total ? (Number(value) / total) * 100 : 0)
  const displayPercentage = Math.min(Math.max(calculatedPercentage, 0), 100)
  
  // SVG circle properties
  const size = 80
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayPercentage / 100) * circumference

  return (
    <Card className={cn("h-full rounded-[5px] border-0 shadow-premium transition-all hover:shadow-premium-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs sm:text-sm font-bold text-foreground/80 truncate pr-2 tracking-wide uppercase">
          {title}
        </CardTitle>
        {icon && (
          <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-[5px] bg-primary/5 flex-shrink-0">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mini Pie Chart */}
          <div className="relative flex-shrink-0">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={strokeWidth}
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg sm:text-xl font-bold text-foreground">
                {Math.round(displayPercentage)}%
              </span>
            </div>
          </div>

          {/* Value and description */}
          <div className="flex-1 min-w-0">
            <div className="text-2xl sm:text-3xl font-bold truncate text-foreground tracking-tight" title={value.toString()}>
              {value}
            </div>
            {description && (
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1 truncate" title={description}>
                {description}
              </p>
            )}
            {total !== undefined && (
              <p className="text-xs font-semibold text-muted-foreground/70 mt-1">
                of {total} total
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
