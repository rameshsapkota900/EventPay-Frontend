import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { api, type AuthResponse } from "./api"

interface AuthContextType {
  user: AuthResponse | null
  isLoading: boolean
  login: (emailOrPhone: string, password: string) => Promise<void>
  completeLogin: (response: AuthResponse) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export { AuthContext }

function getDashboardPath(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin/dashboard"
    case "ORG_ADMIN":
      return "/org-admin/dashboard"
    case "STALL_OWNER":
      return "/stall-owner/dashboard"
    case "VOLUNTEER":
      return "/volunteer/dashboard"
    case "STUDENT":
      return "/student/dashboard"
    default:
      return "/login"
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const accessToken = localStorage.getItem("accessToken")

    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  const completeLogin = useCallback(
    (response: AuthResponse) => {
      localStorage.setItem("accessToken", response.accessToken)
      localStorage.setItem("refreshToken", response.refreshToken)
      localStorage.setItem("user", JSON.stringify(response))
      setUser(response)
      navigate(getDashboardPath(response.role))
    },
    [navigate],
  )

  const login = useCallback(
    async (emailOrPhone: string, password: string) => {
      const isEmail = emailOrPhone.includes('@')
      const loginPayload = isEmail
        ? { email: emailOrPhone, password }
        : { phone: emailOrPhone, password }

      const response = await api.post<AuthResponse>("/auth/login", loginPayload)
      completeLogin(response)
    },
    [completeLogin],
  )

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken")
    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refreshToken })
      } catch (e) {
        // Ignore logout errors
      }
    }
    localStorage.clear()
    setUser(null)
    navigate("/login")
  }, [navigate])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        completeLogin,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
