// ============================================
// Application Configuration
// ============================================

export const APP_CONFIG = {
  name: "EventPay",
  version: "1.0.0",
  description: "Digital Payment System for Events",

  // API Configuration
  api: {
    // Vite exposes env via import.meta.env
    baseUrl: (typeof import.meta !== "undefined" && import.meta.env.VITE_API_URL) || "http://localhost:8080/api/v1",
    websocketUrl:
      (typeof import.meta !== "undefined" && import.meta.env.VITE_WS_URL) ||
      (() => {
        const apiUrl = (typeof import.meta !== "undefined" && import.meta.env.VITE_API_URL) || "http://localhost:8080/api/v1"

        try {
          const parsedUrl = new URL(apiUrl)
          parsedUrl.pathname = "/ws"
          parsedUrl.search = ""
          parsedUrl.hash = ""
          return parsedUrl.toString()
        } catch {
          return "http://localhost:8080/ws"
        }
      })(),
    timeout: 30000,
  },

  // Pagination defaults
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
  },

  // Date formats
  dateFormat: {
    display: "MMM dd, yyyy",
    displayWithTime: "MMM dd, yyyy HH:mm",
    input: "yyyy-MM-dd",
    inputWithTime: "yyyy-MM-dd'T'HH:mm",
  },

  // Currency
  currency: {
    code: "NPR",
    symbol: "Rs",
    locale: "en-NP",
  },

  // Wallet
  wallet: {
    minTopUp: 100,
    maxTopUp: 10000,
    maxBalance: 50000,
  },
} as const

// Status badge colors
export const STATUS_COLORS = {
  // Event status
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-blue-100 text-blue-800",
  ONGOING: "bg-green-100 text-green-800",
  EVENT_COMPLETED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-red-100 text-red-800",

  // Stall status
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-yellow-100 text-yellow-800",
  CLOSED: "bg-red-100 text-red-800",

  // Transaction status
  PENDING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",

  // Transaction type
  TOP_UP: "bg-blue-100 text-blue-800",
  PAYMENT: "bg-green-100 text-green-800",
  REFUND: "bg-orange-100 text-orange-800",
  TRANSFER: "bg-purple-100 text-purple-800",
} as const

