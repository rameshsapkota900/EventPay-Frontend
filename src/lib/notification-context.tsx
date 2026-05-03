import type React from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { APP_CONFIG } from "@/constants"
import { api, type Notification, type NotificationCountResponse, type RealtimeAccountUpdate } from "./api"
import { useAuth } from "./auth-context"
import { emitAccountUpdate } from "./realtime"

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  isConnected: boolean
  refreshNotifications: () => Promise<void>
  markAsRead: (notificationId: number) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)

  const mergeNotification = useCallback((notification: Notification) => {
    setNotifications((currentNotifications) => [
      notification,
      ...currentNotifications.filter((currentNotification) => currentNotification.id !== notification.id),
    ])
  }, [])

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    setIsLoading(true)
    try {
      const [notificationList, unreadSummary] = await Promise.all([
        api.get<Notification[]>("/notifications"),
        api.get<NotificationCountResponse>("/notifications/unread-count"),
      ])
      setNotifications(notificationList)
      setUnreadCount(unreadSummary.unreadCount)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const markAsRead = useCallback(async (notificationId: number) => {
    await api.post(`/notifications/${notificationId}/read`)
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    )
    setUnreadCount((currentCount) => Math.max(0, currentCount - 1))
  }, [])

  const markAllAsRead = useCallback(async () => {
    await api.post("/notifications/read-all")
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({ ...notification, read: true })),
    )
    setUnreadCount(0)
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user) {
      clientRef.current?.deactivate()
      clientRef.current = null
      setNotifications([])
      setUnreadCount(0)
      setIsConnected(false)
      return
    }

    let isCancelled = false

    const initializeNotifications = async () => {
      try {
        await refreshNotifications()
      } catch (error) {
        console.error("Failed to load notifications", error)
      }

      if (isCancelled) {
        return
      }

      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) {
        return
      }

      const client = new Client({
        webSocketFactory: () => new SockJS(APP_CONFIG.api.websocketUrl),
        connectHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          setIsConnected(true)

          client.subscribe("/user/queue/notifications", (frame) => {
            const notification = JSON.parse(frame.body) as Notification
            mergeNotification(notification)
            setUnreadCount((currentCount) => currentCount + (notification.read ? 0 : 1))
            toast(notification.title, {
              description: notification.message,
            })
          })

          client.subscribe("/user/queue/notifications/unread-count", (frame) => {
            const unreadSummary = JSON.parse(frame.body) as NotificationCountResponse
            setUnreadCount(unreadSummary.unreadCount)
          })

          client.subscribe("/user/queue/account-updates", (frame) => {
            const accountUpdate = JSON.parse(frame.body) as RealtimeAccountUpdate
            emitAccountUpdate(accountUpdate)
          })
        },
        onDisconnect: () => {
          setIsConnected(false)
        },
        onStompError: () => {
          setIsConnected(false)
        },
        onWebSocketClose: () => {
          setIsConnected(false)
        },
        onWebSocketError: () => {
          setIsConnected(false)
        },
      })

      clientRef.current = client
      client.activate()
    }

    void initializeNotifications()

    return () => {
      isCancelled = true
      setIsConnected(false)
      const activeClient = clientRef.current
      clientRef.current = null
      activeClient?.deactivate()
    }
  }, [isAuthenticated, mergeNotification, refreshNotifications, user?.userId])

  const value = useMemo<NotificationContextType>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      isConnected,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [isConnected, isLoading, markAllAsRead, markAsRead, notifications, refreshNotifications, unreadCount],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
