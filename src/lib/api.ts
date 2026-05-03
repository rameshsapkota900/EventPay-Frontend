import { APP_CONFIG } from "@/constants"

export const API_BASE_URL = APP_CONFIG.api.baseUrl

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  timestamp?: string
  error?: {
    code: string
    message: string
    details?: any[]
  }
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem("accessToken")
  }

  private shouldSkipAuthRefresh(endpoint: string): boolean {
    return (
      endpoint.startsWith("/auth/login") ||
      endpoint.startsWith("/auth/refresh") ||
      endpoint.startsWith("/auth/forgot-password") ||
      endpoint.startsWith("/auth/reset-password")
    )
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken()

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (token) {
      ;(headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 401 && token && !this.shouldSkipAuthRefresh(endpoint)) {
      const refreshed = await this.refreshToken()
      if (refreshed) {
        return this.request(endpoint, options)
      }

      localStorage.clear()
      window.location.href = "/login"
      throw new Error("Session expired. Please log in again.")
    }

    const contentType = response.headers.get("content-type") || ""
    const data: ApiResponse<T> | null = contentType.includes("application/json")
      ? await response.json()
      : null

    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.message || `Request failed (${response.status})`
      throw new Error(errorMessage)
    }

    if (data && !data.success) {
      const errorMessage = data.error?.message || data.message || "Request failed"
      throw new Error(errorMessage)
    }

    return (data?.data as T) ?? (undefined as T)
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem("refreshToken")
    if (!refreshToken) return false

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) return false

      const data: ApiResponse<AuthResponse> = await response.json()
      if (data.success && data.data) {
        localStorage.setItem("accessToken", data.data.accessToken)
        localStorage.setItem("refreshToken", data.data.refreshToken)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  post<T>(endpoint: string, body?: unknown, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(endpoint: string, body?: unknown, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE", headers })
  }

  async downloadFile(endpoint: string, filename: string): Promise<void> {
    const token = this.getToken()
    const headers: HeadersInit = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, { headers })

    if (response.status === 401 && token && !this.shouldSkipAuthRefresh(endpoint)) {
      const refreshed = await this.refreshToken()
      if (refreshed) {
        const refreshedToken = this.getToken()
        const retryHeaders: HeadersInit = refreshedToken
          ? { Authorization: `Bearer ${refreshedToken}` }
          : {}
        response = await fetch(`${API_BASE_URL}${endpoint}`, { headers: retryHeaders })
      }
    }

    if (!response.ok) {
      let message = `Download failed (${response.status})`
      try {
        const json = (await response.json()) as ApiResponse<unknown>
        message = json.error?.message || json.message || message
      } catch {
        // Keep fallback message when response is not JSON
      }
      throw new Error(message)
    }

    const blob = await response.blob()

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }
}

export const api = new ApiClient()

// Types
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  userId: number
  name: string
  email: string | null
  phone: string | null
  role: string
  organizationId: number | null
  organizationName: string | null
  eventId: number | null
  eventName: string | null
  studentId: number | null
}

export interface DashboardMetrics {
  totalOrganizations?: number
  activeOrganizations?: number
  totalEvents: number
  activeEvents: number
  completedEvents?: number
  totalTransactions: number
  totalRevenue: number
  transactionsLast24h: number
  transactionsLast7d: number
  transactionsLast30d: number
  revenueLast24h: number
  revenueLast7d: number
  revenueLast30d: number
  studentsRegistered?: number
  totalStudentsInEvent?: number
}

export interface Organization {
  id: number
  name: string
  description: string
  location: string
  isActive: boolean
  adminId: number
  adminEmail: string
  adminName: string
  eventCount: number
  totalRevenue: number
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: number
  name: string
  dateTime: string
  location: string
  defaultWalletAmount: number
  status: "ACTIVE" | "COMPLETED" | "CANCELLED"
  organizationId: number
  organizationName: string
  studentCount: number
  stallCount: number
  transactionCount: number
  totalRevenue: number
  createdAt: string
  updatedAt: string
}

export interface Stall {
  id: number
  name: string
  phone: string
  qrCode: string
  status: "ACTIVE" | "INACTIVE"
  eventId: number
  eventName: string
  ownerId: number
  ownerName: string
  totalRevenue: number
  transactionCount: number
  createdAt: string
}

export interface Volunteer {
  id: number
  userId: number
  name: string
  phone: string
  eventId: number
  eventName: string
  studentsRegistered: number
  createdAt: string
}

export interface Student {
  id: number
  userId: number
  name: string
  phone: string
  address: string | null
  school: string | null
  visitedBefore: boolean
  qrCode: string
  eventId: number
  eventName: string
  eventStatus: string
  walletId: number
  walletBalance: number
  walletFrozen: boolean
  registeredByName: string | null
  createdAt: string
}

export interface Transaction {
  id: number
  amount: number
  paymentMethod: "QR" | "PHONE"
  transactionType: "STALL" | "STUDENT"
  fromStudentId: number
  fromStudentName: string
  fromStudentPhone: string
  toStallId?: number
  toStallName?: string
  toStallPhone?: string
  toStudentId?: number
  toStudentName?: string
  toStudentPhone?: string
  eventId: number
  eventName: string
  createdAt: string
}

export interface Notification {
  id: number
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface NotificationCountResponse {
  unreadCount: number
}

export interface RealtimeAccountUpdate {
  type: "WALLET_BALANCE_UPDATED" | "STALL_REVENUE_UPDATED"
  userId?: number
  studentId?: number
  stallId?: number
  eventId?: number
  walletBalance?: number
  stallRevenue?: number
  createdAt: string
}

export interface User {
  id: number
  email: string | null
  phone: string | null
  name: string
  role: string
  organizationId: number | null
  isActive: boolean
  createdAt: string
}
