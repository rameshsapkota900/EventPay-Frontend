import { APP_CONFIG } from "@/constants"

export const formatCurrency = (amount: number, minimumFractionDigits = 2) =>
  new Intl.NumberFormat(APP_CONFIG.currency.locale, {
    style: "currency",
    currency: APP_CONFIG.currency.code,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits,
  }).format(amount || 0)
