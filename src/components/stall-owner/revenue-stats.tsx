// ============================================
// Stall Owner Revenue Stats Component
// ============================================

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react"
import { formatCurrency } from "@/lib/currency"

interface RevenueStatsProps {
  totalRevenue: number
  todayRevenue: number
  totalTransactions: number
  todayTransactions: number
  averageTransaction: number
  revenueChange?: number // Percentage change from yesterday
}

export function RevenueStats({
  totalRevenue,
  todayRevenue,
  totalTransactions,
  todayTransactions,
  averageTransaction,
  revenueChange = 0,
}: RevenueStatsProps) {
  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(todayRevenue),
      icon: revenueChange >= 0 ? TrendingUp : TrendingDown,
      color: revenueChange >= 0 ? "text-green-600" : "text-red-600",
      bgColor: revenueChange >= 0 ? "bg-green-100" : "bg-red-100",
      change: revenueChange,
    },
    {
      title: "Total Transactions",
      value: totalTransactions.toLocaleString(),
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Today's Transactions",
      value: todayTransactions.toLocaleString(),
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Average Transaction",
      value: formatCurrency(averageTransaction),
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`rounded-full p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.change !== undefined && (
              <p className={`text-xs ${stat.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stat.change >= 0 ? "+" : ""}
                {stat.change.toFixed(1)}% from yesterday
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
