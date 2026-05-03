import { formatDistanceToNow } from "date-fns"
import { Bell, CheckCheck, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/lib/notification-context"

export function NotificationSheet() {
  const { notifications, unreadCount, isLoading, isConnected, refreshNotifications, markAsRead, markAllAsRead } =
    useNotifications()

  return (
    <Sheet
      onOpenChange={(open) => {
        if (open) {
          void refreshNotifications()
        }
      }}
    >
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full border-border/80 sm:max-w-md">
        <SheetHeader className="border-b border-border/60 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-foreground">Notifications</SheetTitle>
              <SheetDescription className="mt-1 text-muted-foreground">
                Real-time payment updates for your account.
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "border-border text-[10px] uppercase tracking-wide",
                  isConnected ? "border-primary/30 text-primary" : "text-muted-foreground",
                )}
              >
                {isConnected ? "Live" : "Offline"}
              </Badge>
              {unreadCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => void markAllAsRead()}
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Read all
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No notifications yet</p>
              <p className="mt-1 text-sm text-muted-foreground">New transaction updates will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3 pt-4">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-colors duration-200",
                    notification.read
                      ? "border-border/80 bg-card hover:bg-muted/40"
                      : "border-primary/15 bg-primary/[0.04] hover:bg-primary/[0.07]",
                  )}
                  onClick={() => {
                    if (!notification.read) {
                      void markAsRead(notification.id)
                    }
                  }}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {!notification.read && <Circle className="h-2.5 w-2.5 fill-primary text-primary" />}
                      <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{notification.message}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
